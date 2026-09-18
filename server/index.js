require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const OpenAI = require('openai');
const { toFile } = require('openai/uploads');
const { ALL_USERS_MOCK, OTHER_GROUPS_MOCK } = require('./rankingData');
const adminRoutes = require('./adminRoutes');
const mobileRoutes = require('./mobileRoutes');
const { requireAuth } = mobileRoutes;

const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use('/api/admin', adminRoutes);
app.use('/api/mobile', mobileRoutes);
app.use(express.static(path.join(__dirname, 'public')));

const UPLOAD_DIR = '/tmp/teppen-uploads/';
fs.mkdirSync(UPLOAD_DIR, { recursive: true });
const upload = multer({ dest: UPLOAD_DIR, limits: { fileSize: 25 * 1024 * 1024 } });
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const TTS_CACHE_DIR = '/tmp/teppen-tts-cache';
fs.mkdirSync(TTS_CACHE_DIR, { recursive: true });

app.get('/api/health', (req, res) => {
  res.json({ ok: true, hasKey: Boolean(process.env.OPENAI_API_KEY) });
});

// GET /api/ranking -> 全ユーザー・他グループのモックランキングデータ（固定値、サーバー起動中は安定）
app.get('/api/ranking', (req, res) => {
  res.json({ users: ALL_USERS_MOCK, groups: OTHER_GROUPS_MOCK });
});

// POST /api/grade
// multipart/form-data: audio=<file>, taskLabel, promptEN, promptJP
app.post('/api/grade', requireAuth, upload.single('audio'), async (req, res) => {
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
    });
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
    res.json({ transcript, pass: Boolean(parsed.pass), comment: String(parsed.comment || '') });
  } catch (err) {
    console.error('grade error:', err);
    res.status(500).json({ error: 'grading_failed', });
  } finally {
    fs.unlink(file.path, () => {});
  }
});

// POST /api/tts/prepare { text, voice } -> { url } (キャッシュ済みでなければOpenAI TTSで生成)
const ALLOWED_VOICES = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'];
app.post('/api/tts/prepare', requireAuth, async (req, res) => {
  const { text, voice = 'alloy' } = req.body || {};
  if (!text || typeof text !== 'string') return res.status(400).json({ error: 'text is required' });
  const safeVoice = ALLOWED_VOICES.includes(voice) ? voice : 'alloy';

  const hash = crypto.createHash('sha256').update(`${safeVoice}::${text}`).digest('hex');
  const filePath = path.join(TTS_CACHE_DIR, `${hash}.mp3`);

  try {
    if (!fs.existsSync(filePath)) {
      const speech = await openai.audio.speech.create({
        model: 'tts-1',
        voice: safeVoice,
        input: text.slice(0, 4000),
      });
      const buffer = Buffer.from(await speech.arrayBuffer());
      fs.writeFileSync(filePath, buffer);
    }
    res.json({ url: `/api/tts/audio/${hash}.mp3` });
  } catch (err) {
    console.error('tts error:', err);
    res.status(500).json({ error: 'tts_failed', });
  }
});

app.get('/api/tts/audio/:file', (req, res) => {
  // ファイル名はsha256.mp3のみ許可（パストラバーサル対策）
  if (!/^[a-f0-9]{64}\.mp3$/.test(req.params.file)) return res.status(404).end();
  const filePath = path.join(TTS_CACHE_DIR, req.params.file);
  if (!fs.existsSync(filePath)) return res.status(404).end();
  res.setHeader('Content-Type', 'audio/mpeg');
  fs.createReadStream(filePath).pipe(res);
});

// job/position等は複数選択で配列（[]の場合もある）で送られてくるため、プロンプト用の自然文に変換する
function joinOrFallback(value, fallback) {
  if (Array.isArray(value)) return value.length ? value.join('、') : fallback;
  return value || fallback;
}

// POST /api/generate/dialogue { scene, profile } -> AI生成の会話文
app.post('/api/generate/dialogue', requireAuth, async (req, res) => {
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
    console.error('generate dialogue error:', err);
    res.status(500).json({ error: 'generate_failed', });
  }
});

// POST /api/generate/presentation { profile, topic? } -> AI生成のプレゼン原稿（4段落）
app.post('/api/generate/presentation', requireAuth, async (req, res) => {
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
    console.error('generate presentation error:', err);
    res.status(500).json({ error: 'generate_failed', });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`TEPPEN-ENGLISH server listening on :${PORT}`);
});
