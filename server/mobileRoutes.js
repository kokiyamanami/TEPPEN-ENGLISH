const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const OpenAI = require('openai');
const db = require('./db');

const router = express.Router();
const JWT_SECRET = process.env.STUDENT_JWT_SECRET || 'teppen-english-student-dev-secret';

const AVATAR_DIR = path.join(__dirname, 'public', 'avatars');
fs.mkdirSync(AVATAR_DIR, { recursive: true });
const avatarUpload = multer({ dest: '/tmp/teppen-uploads/' });

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const DEFAULT_OFFICIAL_FOLDERS = ['重要構文40', 'お役立ちフレーズ50'];

function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'unauthorized' });
  try {
    req.studentId = jwt.verify(token, JWT_SECRET).id;
    next();
  } catch (e) {
    res.status(401).json({ error: 'unauthorized' });
  }
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

// ---- auth ----
router.post('/signup', (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'email and password are required' });

  // 管理画面でメールアドレス付きの生徒レコードが先に作られている場合があるため、
  // password_hash未設定（＝まだ本人がサインアップしていない）ならそのレコードを引き継ぐ
  const existing = db.prepare('SELECT id, password_hash FROM students WHERE email = ?').get(email);
  if (existing && existing.password_hash) return res.status(409).json({ error: 'このメールアドレスは既に登録されています' });

  const hash = bcrypt.hashSync(password, 10);
  let studentId;
  if (existing) {
    db.prepare('UPDATE students SET password_hash = ?, status = ?, last_login = ? WHERE id = ?').run(hash, 'active', todayStr(), existing.id);
    studentId = existing.id;
  } else {
    const info = db
      .prepare('INSERT INTO students (name, email, password_hash, phase, status, last_login, profile_json) VALUES (?, ?, ?, 1, ?, ?, ?)')
      .run('', email, hash, 'active', todayStr(), '{}');
    studentId = info.lastInsertRowid;
  }

  const hasFolders = db.prepare('SELECT id FROM phrase_folders WHERE student_id = ? LIMIT 1').get(studentId);
  if (!hasFolders) {
    DEFAULT_OFFICIAL_FOLDERS.forEach((name) => {
      db.prepare('INSERT INTO phrase_folders (student_id, name, source) VALUES (?, ?, ?)').run(studentId, name, 'official');
    });
  }

  const token = jwt.sign({ id: studentId }, JWT_SECRET, { expiresIn: '365d' });
  res.json({ token, studentId });
});

router.post('/login', (req, res) => {
  const { email, password } = req.body || {};
  const student = db.prepare('SELECT * FROM students WHERE email = ?').get(email);
  if (!student || !student.password_hash || !bcrypt.compareSync(password || '', student.password_hash)) {
    return res.status(401).json({ error: 'メールアドレスまたはパスワードが正しくありません' });
  }
  db.prepare('UPDATE students SET last_login = ? WHERE id = ?').run(todayStr(), student.id);
  const token = jwt.sign({ id: student.id }, JWT_SECRET, { expiresIn: '365d' });
  res.json({ token, studentId: student.id });
});

router.use(requireAuth);

// ---- profile ----
router.get('/me', (req, res) => {
  const student = db.prepare('SELECT * FROM students WHERE id = ?').get(req.studentId);
  if (!student) return res.status(404).json({ error: 'not_found' });
  const profile = JSON.parse(student.profile_json || '{}');
  res.json({
    id: student.id,
    email: student.email,
    phase: student.phase,
    profile: { name: student.name, ...profile },
    onboardingStep: student.onboarding_step || 'ob1',
    onboardingComplete: !!student.onboarding_complete,
    avatarUrl: student.avatar_url || '',
  });
});

// アバター画像のアップロード（プロフィール編集画面から）。管理画面の生徒詳細にも同じURLが表示される
router.post('/avatar', avatarUpload.single('avatar'), (req, res) => {
  const file = req.file;
  if (!file) return res.status(400).json({ error: 'avatar file is required' });

  try {
    const ext = (path.extname(file.originalname || '') || '.jpg').toLowerCase();
    const safeExt = ['.jpg', '.jpeg', '.png', '.webp', '.heic'].includes(ext) ? ext : '.jpg';
    const filename = `${req.studentId}-${Date.now()}${safeExt}`;
    const dest = path.join(AVATAR_DIR, filename);
    // renameSyncは/tmpと保存先が別ファイルシステムだとEXDEVで失敗するため、コピー+削除にフォールバック
    try {
      fs.renameSync(file.path, dest);
    } catch (renameErr) {
      if (renameErr.code !== 'EXDEV') throw renameErr;
      fs.copyFileSync(file.path, dest);
      fs.unlink(file.path, () => {});
    }

    const student = db.prepare('SELECT avatar_url FROM students WHERE id = ?').get(req.studentId);
    const oldUrl = student?.avatar_url;
    const avatarUrl = `/avatars/${filename}`;
    db.prepare('UPDATE students SET avatar_url = ? WHERE id = ?').run(avatarUrl, req.studentId);

    if (oldUrl && oldUrl.startsWith('/avatars/')) {
      fs.unlink(path.join(__dirname, 'public', oldUrl), () => {});
    }
    res.json({ avatarUrl });
  } catch (err) {
    console.error('avatar upload error:', err);
    fs.unlink(file.path, () => {});
    res.status(500).json({ error: 'avatar_upload_failed', detail: String(err.message || err) });
  }
});

// オンボーディング各ステップの「次へ」で呼び出し、途中離脱しても再開できるようにする
router.post('/onboarding-progress', (req, res) => {
  const { step } = req.body || {};
  if (!step) return res.status(400).json({ error: 'step is required' });
  db.prepare('UPDATE students SET onboarding_step = ? WHERE id = ?').run(step, req.studentId);
  res.json({ ok: true });
});

router.post('/onboarding-complete', (req, res) => {
  db.prepare("UPDATE students SET onboarding_complete = 1, onboarding_step = 'obdone' WHERE id = ?").run(req.studentId);
  res.json({ ok: true });
});

router.patch('/profile', (req, res) => {
  const student = db.prepare('SELECT * FROM students WHERE id = ?').get(req.studentId);
  if (!student) return res.status(404).json({ error: 'not_found' });
  const current = JSON.parse(student.profile_json || '{}');
  const updated = { ...current, ...(req.body || {}) };
  db.prepare('UPDATE students SET profile_json = ?, name = ? WHERE id = ?').run(
    JSON.stringify(updated),
    updated.name || student.name || '',
    req.studentId
  );
  res.json({ ok: true });
});

// ---- lectures（管理画面で管理する動画一覧） ----
router.get('/lectures', (req, res) => {
  const rows = db.prepare('SELECT id, youtube_id, title, instructor, category FROM lectures ORDER BY sort_order, id').all();
  res.json(rows.map((r) => ({ id: String(r.id), youtubeId: r.youtube_id, title: r.title, instructor: r.instructor, category: r.category })));
});

// ---- ad banners（管理画面で自由に設定できるバナー広告） ----
router.get('/ad-banners', (req, res) => {
  const placement = req.query.placement || 'home';
  const rows = db
    .prepare('SELECT id, image_url, link_url FROM ad_banners WHERE enabled = 1 AND placement = ? ORDER BY sort_order, id')
    .all(placement);
  res.json(rows.map((r) => ({ id: r.id, imageUrl: r.image_url, linkUrl: r.link_url || '' })));
});

// ---- study summary（トレーニング画面の登頂標高に使う累計学習時間） ----
router.get('/study-summary', (req, res) => {
  const row = db.prepare('SELECT COALESCE(SUM(study_min), 0) as total FROM speaking_stats WHERE student_id = ?').get(req.studentId);
  res.json({ totalStudyMinutes: row.total });
});

// ---- announcements（公開済みで自分宛て「全生徒」または所属グループ宛てのもの） ----
router.get('/announcements', (req, res) => {
  const student = db.prepare('SELECT group_id FROM students WHERE id = ?').get(req.studentId);
  const rows = db
    .prepare(
      `SELECT id, title, body, created_at FROM announcements
       WHERE status = 'published' AND (target = '全生徒' OR (target = '特定グループ' AND target_group_id = ?))
       ORDER BY id DESC`
    )
    .all(student?.group_id ?? -1);
  res.json(rows);
});

// ---- study records (records画面のカレンダー/グラフ用) ----
// 1日に複数件の学習記録を登録できる（同じdateのstudent_id×日付は一意ではない）
router.get('/records', (req, res) => {
  const rows = db
    .prepare('SELECT id, date, study_min, speak_min, category, subcategories, memo FROM speaking_stats WHERE student_id = ? ORDER BY date, id')
    .all(req.studentId);
  res.json(
    rows.map((r) => ({
      ...r,
      subcategories: r.subcategories ? JSON.parse(r.subcategories) : [],
    }))
  );
});

router.post('/records', (req, res) => {
  const body = req.body || {};
  const id = body.id;
  const date = body.date;
  // 分割代入のデフォルト値はundefinedにしか効かないため、明示的にnull/undefinedをまとめて弾く
  const category = body.category ?? 'other';
  const subcategories = body.subcategories ?? [];
  const minutes = body.minutes ?? 0;
  const memo = body.memo ?? '';
  if (!date) return res.status(400).json({ error: 'date is required' });
  const speakMin = category === 'speaking' ? minutes : Math.round(minutes * 0.3);

  // idが指定され、自分の記録であれば更新。それ以外は常に新規追加（同日複数件を許可）
  const existing = id ? db.prepare('SELECT id FROM speaking_stats WHERE id = ? AND student_id = ?').get(id, req.studentId) : null;
  if (existing) {
    db.prepare(
      'UPDATE speaking_stats SET date = ?, study_min = ?, speak_min = ?, category = ?, subcategories = ?, memo = ? WHERE id = ?'
    ).run(date, minutes, speakMin, category, JSON.stringify(subcategories), memo, existing.id);
    return res.json({ ok: true, id: existing.id });
  }
  const info = db
    .prepare(
      'INSERT INTO speaking_stats (student_id, date, study_min, speak_min, category, subcategories, memo) VALUES (?, ?, ?, ?, ?, ?, ?)'
    )
    .run(req.studentId, date, minutes, speakMin, category, JSON.stringify(subcategories), memo);
  res.json({ ok: true, id: info.lastInsertRowid });
});

router.delete('/records/:id', (req, res) => {
  db.prepare('DELETE FROM speaking_stats WHERE id = ? AND student_id = ?').run(req.params.id, req.studentId);
  res.json({ ok: true });
});

// ---- phrases / folders ----
router.get('/phrase-folders', (req, res) => {
  res.json(db.prepare('SELECT * FROM phrase_folders WHERE student_id = ? ORDER BY id').all(req.studentId));
});

router.post('/phrase-folders', (req, res) => {
  const { name } = req.body || {};
  if (!name) return res.status(400).json({ error: 'name is required' });
  const info = db.prepare("INSERT INTO phrase_folders (student_id, name, source) VALUES (?, ?, 'custom')").run(req.studentId, name);
  res.json({ id: info.lastInsertRowid });
});

router.delete('/phrase-folders/:id', (req, res) => {
  db.prepare('DELETE FROM phrases WHERE folder_id = ? AND student_id = ?').run(req.params.id, req.studentId);
  db.prepare("DELETE FROM phrase_folders WHERE id = ? AND student_id = ? AND source = 'custom'").run(req.params.id, req.studentId);
  res.json({ ok: true });
});

router.get('/phrases', (req, res) => {
  res.json(db.prepare('SELECT * FROM phrases WHERE student_id = ? ORDER BY id').all(req.studentId));
});

router.post('/phrases', (req, res) => {
  const { folderId, text, textJP = '' } = req.body || {};
  if (!folderId || !text) return res.status(400).json({ error: 'folderId and text are required' });
  const folder = db.prepare('SELECT id FROM phrase_folders WHERE id = ? AND student_id = ?').get(folderId, req.studentId);
  if (!folder) return res.status(404).json({ error: 'folder_not_found' });
  const info = db
    .prepare('INSERT INTO phrases (student_id, folder_id, text, text_jp, learned) VALUES (?, ?, ?, ?, 0)')
    .run(req.studentId, folderId, text, textJP);
  res.json({ id: info.lastInsertRowid });
});

router.patch('/phrases/:id', (req, res) => {
  const { learned } = req.body || {};
  db.prepare('UPDATE phrases SET learned = ? WHERE id = ? AND student_id = ?').run(learned ? 1 : 0, req.params.id, req.studentId);
  res.json({ ok: true });
});

// ---- monthly mission（AI添削結果を管理画面と共有するテーブルに記録） ----
router.post('/monthly-mission', (req, res) => {
  const { pass } = req.body || {};
  const month = new Date().toISOString().slice(0, 7);
  const existing = db.prepare('SELECT id FROM monthly_mission_results WHERE student_id = ? AND month = ?').get(req.studentId, month);
  if (existing) {
    db.prepare('UPDATE monthly_mission_results SET pass = ?, date = ? WHERE id = ?').run(pass ? 1 : 0, todayStr(), existing.id);
  } else {
    db.prepare('INSERT INTO monthly_mission_results (student_id, month, pass, date) VALUES (?, ?, ?, ?)').run(
      req.studentId,
      month,
      pass ? 1 : 0,
      todayStr()
    );
  }
  res.json({ ok: true });
});

function mondayOfStr(d) {
  const x = new Date(d);
  const day = x.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  x.setDate(x.getDate() + diff);
  return x.toISOString().slice(0, 10);
}

// ---- daily mission（type: 'photo' | 'question'、1日1件ずつ記録） ----
router.post('/daily-mission', (req, res) => {
  const { type, pass } = req.body || {};
  if (!type) return res.status(400).json({ error: 'type is required' });
  const date = todayStr();
  const existing = db
    .prepare('SELECT id FROM daily_mission_results WHERE student_id = ? AND date = ? AND type = ?')
    .get(req.studentId, date, type);
  if (existing) {
    db.prepare('UPDATE daily_mission_results SET pass = ? WHERE id = ?').run(pass ? 1 : 0, existing.id);
  } else {
    db.prepare('INSERT INTO daily_mission_results (student_id, date, type, pass) VALUES (?, ?, ?, ?)').run(
      req.studentId,
      date,
      type,
      pass ? 1 : 0
    );
  }
  res.json({ ok: true });
});

// ---- weekly mission（週の月曜日始まりで1件ずつ記録） ----
router.post('/weekly-mission', (req, res) => {
  const { pass } = req.body || {};
  const weekStart = mondayOfStr(new Date());
  const existing = db
    .prepare('SELECT id FROM weekly_mission_results WHERE student_id = ? AND week_start = ?')
    .get(req.studentId, weekStart);
  if (existing) {
    db.prepare('UPDATE weekly_mission_results SET pass = ?, date = ? WHERE id = ?').run(pass ? 1 : 0, todayStr(), existing.id);
  } else {
    db.prepare('INSERT INTO weekly_mission_results (student_id, week_start, pass, date) VALUES (?, ?, ?, ?)').run(
      req.studentId,
      weekStart,
      pass ? 1 : 0,
      todayStr()
    );
  }
  res.json({ ok: true });
});

// ---- weekly progress（STEP1〜6を順番に完了しないと次に進めない。週が変わると0に戻る） ----
router.get('/weekly-progress', (req, res) => {
  const weekStart = mondayOfStr(new Date());
  const row = db.prepare('SELECT completed_step FROM weekly_progress WHERE student_id = ? AND week_start = ?').get(req.studentId, weekStart);
  res.json({ weekStart, completedStep: row ? row.completed_step : 0 });
});

router.post('/weekly-progress', (req, res) => {
  const step = Number(req.body?.step);
  if (!Number.isInteger(step) || step < 1 || step > 7) return res.status(400).json({ error: 'step must be 1-7' });
  const weekStart = mondayOfStr(new Date());
  const row = db.prepare('SELECT id, completed_step FROM weekly_progress WHERE student_id = ? AND week_start = ?').get(req.studentId, weekStart);
  const current = row ? row.completed_step : 0;
  if (step > current + 1) return res.status(400).json({ error: '前のステップを先に完了してください' });
  const next = Math.max(current, step);
  if (row) db.prepare('UPDATE weekly_progress SET completed_step = ? WHERE id = ?').run(next, row.id);
  else db.prepare('INSERT INTO weekly_progress (student_id, week_start, completed_step) VALUES (?, ?, ?)').run(req.studentId, weekStart, next);
  res.json({ ok: true, completedStep: next });
});

// ---- AI友達とのトーク（persona別のキャラ設定でLLMが返信する） ----
const AI_PERSONAS = {
  justin: 'You are Justin, a friendly, upbeat American friend chatting casually in English. Help the user practice everyday conversation. Keep replies short (1-3 sentences), natural, and end with a light question to keep the chat going. Never switch to Japanese unless the user is clearly stuck.',
  bob: 'You are Bob, a relaxed, humorous American friend who loves small talk. Chat in casual English about daily life. Keep replies short (1-3 sentences) and ask follow-up questions.',
  sara: 'You are Sara, a supportive English speaking coach-friend who helps the user practice presentations and speeches. Chat in English, keep replies short (1-3 sentences), and gently offer a better phrasing when the user makes a mistake.',
  selen: 'あなたは「セレン」という、親しみやすい日本語の学習パートナーです。ユーザーの英語学習の悩み相談や雑談に、日本語で温かく短く（1〜3文）返信してください。',
};

router.post('/chat-ai', async (req, res) => {
  const { persona, history = [] } = req.body || {};
  const system = AI_PERSONAS[persona];
  if (!system) return res.status(400).json({ error: 'unknown persona' });
  const messages = history
    .slice(-12)
    .filter((m) => m && typeof m.text === 'string')
    .map((m) => ({ role: m.from === 'me' ? 'user' : 'assistant', content: m.text.slice(0, 1000) }));
  try {
    const resp = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 200,
      messages: [{ role: 'system', content: system }, ...messages],
    });
    res.json({ reply: resp.choices[0].message.content || '' });
  } catch (err) {
    console.error('chat-ai error:', err);
    res.status(500).json({ error: 'chat_ai_failed' });
  }
});

// ---- mission history（記録画面の「スピーキング履歴」表示用にまとめて取得） ----
router.get('/mission-history', (req, res) => {
  const daily = db
    .prepare('SELECT date, type, pass FROM daily_mission_results WHERE student_id = ? ORDER BY date DESC')
    .all(req.studentId);
  const weekly = db
    .prepare('SELECT week_start, pass, date FROM weekly_mission_results WHERE student_id = ? ORDER BY week_start DESC')
    .all(req.studentId);
  const monthly = db
    .prepare('SELECT month, pass, date FROM monthly_mission_results WHERE student_id = ? ORDER BY month DESC')
    .all(req.studentId);
  res.json({ daily, weekly, monthly });
});

// ---- chat（コーチとのトーク。管理画面の生徒詳細から送るメッセージと同じテーブルを共有） ----
router.get('/chat', (req, res) => {
  res.json(db.prepare('SELECT id, sender, text, time FROM chat_messages WHERE student_id = ? ORDER BY id').all(req.studentId));
});

router.post('/chat', (req, res) => {
  const { text } = req.body || {};
  if (!text) return res.status(400).json({ error: 'text is required' });
  const info = db
    .prepare('INSERT INTO chat_messages (student_id, sender, text, time) VALUES (?, ?, ?, ?)')
    .run(req.studentId, 'student', text, new Date().toISOString());
  res.json({ id: info.lastInsertRowid });
});

module.exports = router;
