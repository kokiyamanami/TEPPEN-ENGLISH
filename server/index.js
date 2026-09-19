require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const helmet = require('helmet');
const compression = require('compression');
const { toFile } = require('openai/uploads');
const { ALL_USERS_MOCK, OTHER_GROUPS_MOCK } = require('./rankingData');
const adminRoutes = require('./adminRoutes');
const mobileRoutes = require('./mobileRoutes');
const { requireAuth } = mobileRoutes;
const { recordMission } = require('./missions');
const { createRateLimiter } = require('./rateLimit');
const db = require('./db');
const openai = require('./openai');
const { logger, requestLogger } = require('./logger');
const { scheduleSweep } = require('./housekeeping');

// OpenAIを使うエンドポイントは1人あたり毎分30回まで
const aiLimiter = createRateLimiter({ windowMs: 60 * 1000, max: 30 });

const app = express();

// リバースプロキシ（nginx・ALBなど）の背後では、TRUST_PROXY（段数。例: 1）を設定する。
// 未設定だとクライアントIPがプロキシのIPになり、IP単位のログイン試行制限が全員まとめて数えられてしまう
if (process.env.TRUST_PROXY) {
  const v = process.env.TRUST_PROXY;
  app.set('trust proxy', /^\d+$/.test(v) ? Number(v) : v === 'true' ? true : v);
}

app.use(requestLogger);
// アプリ・管理画面（別オリジン）から画像・音声を読めるよう、CORPは cross-origin にする
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(compression());

// CORS_ORIGINS（カンマ区切り）で管理画面のオリジンを限定する。ネイティブアプリはOriginを送らないので影響しない。
// 未設定の間は全オリジンを許可する（本番では設定すること）
const corsOrigins = (process.env.CORS_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean);
if (corsOrigins.length === 0 && process.env.NODE_ENV === 'production') {
  logger.warn('CORS_ORIGINS が未設定のため、すべてのオリジンからのアクセスを許可しています');
}
app.use(cors(corsOrigins.length ? { origin: corsOrigins } : undefined));

app.use(express.json({ limit: '2mb' }));
app.use('/api/admin', adminRoutes);
app.use('/api/mobile', mobileRoutes);
// 画像はファイル名がユニーク（またはほぼ不変）なので、1日キャッシュさせて再ダウンロードを減らす
app.use(express.static(path.join(__dirname, 'public'), { maxAge: '1d' }));

const UPLOAD_DIR = '/tmp/teppen-uploads/';
fs.mkdirSync(UPLOAD_DIR, { recursive: true });
const upload = multer({ dest: UPLOAD_DIR, limits: { fileSize: 25 * 1024 * 1024 } });

const TTS_CACHE_DIR = '/tmp/teppen-tts-cache';
fs.mkdirSync(TTS_CACHE_DIR, { recursive: true });

// ディスクを埋め尽くさないよう、TTSキャッシュは30日超・合計500MB超の分を、アップロードの一時ファイルは1時間超を掃除する
scheduleSweep(TTS_CACHE_DIR, { maxAgeMs: 30 * 24 * 60 * 60 * 1000, maxTotalBytes: 500 * 1024 * 1024 });
scheduleSweep(UPLOAD_DIR, { maxAgeMs: 60 * 60 * 1000 });

// ロードバランサ・監視用。DBに接続できなければ503を返す
app.get('/api/health', (req, res) => {
  try {
    db.prepare('SELECT 1').get();
    res.json({ ok: true, hasKey: Boolean(process.env.OPENAI_API_KEY), uptimeSec: Math.round(process.uptime()) });
  } catch (err) {
    logger.error('health check failed', err);
    res.status(503).json({ ok: false });
  }
});

// GET /api/ranking -> 全ユーザー・他グループのモックランキングデータ（固定値、サーバー起動中は安定）
app.get('/api/ranking', (req, res) => {
  res.json({ users: ALL_USERS_MOCK, groups: OTHER_GROUPS_MOCK });
});

// POST /api/grade
// multipart/form-data: audio=<file>, taskLabel, promptEN, promptJP
app.post('/api/grade', requireAuth, aiLimiter, upload.single('audio'), async (req, res) => {
  const file = req.file;
  if (!file) return res.status(400).json({ error: 'audio file is required' });

  const clip = (v) => String(v ?? '').slice(0, 500);
  const taskLabel = clip(req.body.taskLabel);
  const promptEN = clip(req.body.promptEN);
  const promptJP = clip(req.body.promptJP);

  try {
    const transcriptionResp = await openai.audio.transcriptions.create({
      file: await toFile(fs.createReadStream(file.path), file.originalname || 'audio.m4a'),
      model: 'whisper-1',
    }, { timeout: 120 * 1000, maxRetries: 0 }); // 音声はストリームを1回読むと再送できないため、再試行しない
    const transcript = transcriptionResp.text || '';

    const gradingResp = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content:
            'あなたは英語スピーキングのコーチです。ユーザーの発話（文字起こし）を、与えられた課題に対する回答として評価してください。' +
            '文法・語彙の正確さ、課題への関連性、内容の具体性を基準に判定します。' +
            '必ず次のJSON形式のみで回答してください: {"pass": boolean, "comment": "日本語で2〜3文の添削コメント"}',
        },
        {
          role: 'user',
          content: `課題（${taskLabel}）: "${promptEN}"（日本語: ${promptJP}）\n\nユーザーの発話の文字起こし:\n"${transcript}"`,
        },
      ],
    });

    const parsed = JSON.parse(gradingResp.choices[0].message.content);
    const pass = Boolean(parsed.pass);
    // ミッション課題の場合、合否はクライアントの自己申告ではなくここで記録する
    const mission = String(req.body.mission || '');
    const recorded = mission ? recordMission(req.studentId, mission, pass) : false;
    res.json({ transcript, pass, comment: String(parsed.comment || ''), recorded });
  } catch (err) {
    logger.error('grade error', err, { id: req.id });
    res.status(500).json({ error: 'grading_failed', });
  } finally {
    fs.unlink(file.path, () => {});
  }
});

// POST /api/tts/prepare { text, voice } -> { url } (キャッシュ済みでなければOpenAI TTSで生成)
const ttsInflight = new Map(); // hash -> 生成中のPromise
const ALLOWED_VOICES = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'];
app.post('/api/tts/prepare', requireAuth, aiLimiter, async (req, res) => {
  const { text, voice = 'alloy' } = req.body || {};
  if (!text || typeof text !== 'string') return res.status(400).json({ error: 'text is required' });
  const safeVoice = ALLOWED_VOICES.includes(voice) ? voice : 'alloy';

  const hash = crypto.createHash('sha256').update(`${safeVoice}::${text}`).digest('hex');
  const filePath = path.join(TTS_CACHE_DIR, `${hash}.mp3`);

  try {
    if (!fs.existsSync(filePath)) {
      // 同じ文・声のリクエストが同時に来ても、OpenAIへの生成は1回だけにする
      let pending = ttsInflight.get(hash);
      if (!pending) {
        pending = (async () => {
          const speech = await openai.audio.speech.create({ model: 'tts-1', voice: safeVoice, input: text.slice(0, 4000) });
          fs.writeFileSync(filePath, Buffer.from(await speech.arrayBuffer()));
        })().finally(() => ttsInflight.delete(hash));
        ttsInflight.set(hash, pending);
      }
      await pending;
    }
    res.json({ url: `/api/tts/audio/${hash}.mp3` });
  } catch (err) {
    logger.error('tts error', err, { id: req.id });
    res.status(500).json({ error: 'tts_failed', });
  }
});

app.get('/api/tts/audio/:file', (req, res) => {
  // ファイル名はsha256.mp3のみ許可（パストラバーサル対策）
  if (!/^[a-f0-9]{64}\.mp3$/.test(req.params.file)) return res.status(404).end();
  const filePath = path.join(TTS_CACHE_DIR, req.params.file);
  if (!fs.existsSync(filePath)) return res.status(404).end();
  res.setHeader('Content-Type', 'audio/mpeg');
  // ファイル名は内容のハッシュなので、変わらない。長期キャッシュさせる
  res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  fs.createReadStream(filePath).pipe(res);
});

// job/position等は複数選択で配列（[]の場合もある）で送られてくるため、プロンプト用の自然文に変換する
function joinOrFallback(value, fallback) {
  if (Array.isArray(value)) return value.length ? value.join('、') : fallback;
  return value || fallback;
}

// POST /api/generate/dialogue { scene, profile } -> AI生成の会話文
app.post('/api/generate/dialogue', requireAuth, aiLimiter, async (req, res) => {
  const scene = String(req.body?.scene ?? '').slice(0, 200);
  const profile = req.body?.profile && typeof req.body.profile === 'object' ? req.body.profile : {};
  try {
    const resp = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content:
            'あなたはビジネス英語教材の作成者です。ユーザーのプロフィールに合わせて、指定されたシーンの自然な英語の会話（5往復程度）を作成してください。' +
            'ユーザー自身の発言は from:"me"、相手の発言は from:"them" とします。' +
            '必ず次のJSON形式のみで回答してください: {"counterpart": "相手の呼び方（例: Mike（同僚）", "lines": [{"from": "them"|"me", "text": "英語", "textJP": "日本語訳"}, ...]}',
        },
        {
          role: 'user',
          content: `シーン: ${scene}\nユーザーの職業: ${joinOrFallback(profile.job, '会社員')}\nユーザーの職位: ${joinOrFallback(profile.position, '')}\nユーザーの職業詳細: ${profile.jobDetail || ''}`,
        },
      ],
    });
    const parsed = JSON.parse(resp.choices[0].message.content);
    res.json(parsed);
  } catch (err) {
    logger.error('generate dialogue error', err, { id: req.id });
    res.status(500).json({ error: 'generate_failed', });
  }
});

// POST /api/generate/presentation { profile, topic? } -> AI生成のプレゼン原稿（4段落）
app.post('/api/generate/presentation', requireAuth, aiLimiter, async (req, res) => {
  const topic = String(req.body?.topic ?? '').slice(0, 200);
  const profile = req.body?.profile && typeof req.body.profile === 'object' ? req.body.profile : {};
  try {
    const resp = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content:
            'あなたはビジネス英語教材の作成者です。ユーザーのプロフィールに合わせて、4段落構成の英語プレゼンテーション原稿を作成してください' +
            '（挨拶と自己紹介／課題や現状の説明／提案や分析／まとめと締めの4段落）。' +
            '必ず次のJSON形式のみで回答してください: {"topic": "テーマ（日本語）", "paragraphsEN": ["段落1","段落2","段落3","段落4"], "paragraphsJP": ["段落1和訳","段落2和訳","段落3和訳","段落4和訳"]}',
        },
        {
          role: 'user',
          content: `テーマ: ${topic || '四半期の振り返りと提案'}\nユーザーの職業: ${joinOrFallback(profile.job, '会社員')}\nユーザーの職位: ${joinOrFallback(profile.position, '')}\n性格: ${profile.personality || ''}`,
        },
      ],
    });
    const parsed = JSON.parse(resp.choices[0].message.content);
    res.json(parsed);
  } catch (err) {
    logger.error('generate presentation error', err, { id: req.id });
    res.status(500).json({ error: 'generate_failed', });
  }
});

// ルート内の未処理エラー（multerのサイズ超過など）をHTMLではなくJSONで返す
app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);
  if (err && err.code === 'LIMIT_FILE_SIZE') return res.status(413).json({ error: 'file_too_large' });
  if (err && err.type === 'entity.parse.failed') return res.status(400).json({ error: 'invalid_json' });
  logger.error('unhandled error', err, { id: req.id });
  res.status(500).json({ error: 'internal_error', requestId: req.id });
});

const PORT = process.env.PORT || 4000;
const server = app.listen(PORT, () => {
  logger.info('server listening', { port: Number(PORT) });
});

// 終了シグナル（デプロイ・再起動）では、新規接続を止め、処理中のリクエストが終わるのを待ってから、DBを閉じて終了する
let shuttingDown = false;
function shutdown(reason, exitCode = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  logger.info('shutting down', { reason });
  const force = setTimeout(() => {
    logger.error('forced exit: 処理中のリクエストが終わらなかった', null);
    process.exit(1);
  }, 10 * 1000);
  force.unref();
  server.close(() => {
    try {
      db.close();
    } catch {
      // すでに閉じている場合は無視
    }
    process.exit(exitCode);
  });
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
// 想定外の非同期エラーは記録して継続する（個別に対処済みの箇所以外での取りこぼしで、全ユーザーの処理を巻き込んで落とさない）。
// 同期的な想定外の例外は、プロセスの状態が不確かなので、後始末をして終了する（プロセス管理ツールに再起動させる）
process.on('unhandledRejection', (err) => logger.error('unhandledRejection', err instanceof Error ? err : new Error(String(err))));
process.on('uncaughtException', (err) => {
  logger.error('uncaughtException', err);
  shutdown('uncaughtException', 1);
});
