const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./db');

const router = express.Router();
const JWT_SECRET = process.env.STUDENT_JWT_SECRET || 'teppen-english-student-dev-secret';

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

  const existing = db.prepare('SELECT id FROM students WHERE email = ?').get(email);
  if (existing) return res.status(409).json({ error: 'このメールアドレスは既に登録されています' });

  const hash = bcrypt.hashSync(password, 10);
  const info = db
    .prepare('INSERT INTO students (name, email, password_hash, phase, status, last_login, profile_json) VALUES (?, ?, ?, 1, ?, ?, ?)')
    .run('', email, hash, 'active', todayStr(), '{}');
  const studentId = info.lastInsertRowid;

  DEFAULT_OFFICIAL_FOLDERS.forEach((name) => {
    db.prepare('INSERT INTO phrase_folders (student_id, name, source) VALUES (?, ?, ?)').run(studentId, name, 'official');
  });

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
  });
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

// ---- ad banners（管理画面で自由に設定できるバナー広告） ----
router.get('/ad-banners', (req, res) => {
  const rows = db
    .prepare('SELECT id, image_url, link_url FROM ad_banners WHERE enabled = 1 ORDER BY sort_order, id')
    .all();
  res.json(rows.map((r) => ({ id: r.id, imageUrl: r.image_url, linkUrl: r.link_url || '' })));
});

// ---- study records (records画面のカレンダー/グラフ用) ----
router.get('/records', (req, res) => {
  const rows = db
    .prepare('SELECT date, study_min, speak_min, category, subcategories, memo FROM speaking_stats WHERE student_id = ? ORDER BY date')
    .all(req.studentId);
  res.json(
    rows.map((r) => ({
      ...r,
      subcategories: r.subcategories ? JSON.parse(r.subcategories) : [],
    }))
  );
});

router.post('/records', (req, res) => {
  const { date, category, subcategories = [], minutes = 0, memo = '' } = req.body || {};
  if (!date) return res.status(400).json({ error: 'date is required' });
  const speakMin = category === 'speaking' ? minutes : Math.round(minutes * 0.3);
  const existing = db.prepare('SELECT id FROM speaking_stats WHERE student_id = ? AND date = ?').get(req.studentId, date);
  if (existing) {
    db.prepare('UPDATE speaking_stats SET study_min = ?, speak_min = ?, category = ?, subcategories = ?, memo = ? WHERE id = ?').run(
      minutes,
      speakMin,
      category,
      JSON.stringify(subcategories),
      memo,
      existing.id
    );
  } else {
    db.prepare(
      'INSERT INTO speaking_stats (student_id, date, study_min, speak_min, category, subcategories, memo) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(req.studentId, date, minutes, speakMin, category, JSON.stringify(subcategories), memo);
  }
  res.json({ ok: true });
});

router.delete('/records/:date', (req, res) => {
  db.prepare('DELETE FROM speaking_stats WHERE student_id = ? AND date = ?').run(req.studentId, req.params.date);
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

module.exports = router;
