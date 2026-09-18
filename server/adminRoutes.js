const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const db = require('./db');

const router = express.Router();
const JWT_SECRET = process.env.ADMIN_JWT_SECRET || 'teppen-english-dev-secret';

const AD_IMAGE_DIR = path.join(__dirname, 'public', 'ads');
fs.mkdirSync(AD_IMAGE_DIR, { recursive: true });
const adImageUpload = multer({ dest: '/tmp/teppen-uploads/' });

function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'unauthorized' });
  try {
    req.admin = jwt.verify(token, JWT_SECRET);
    next();
  } catch (e) {
    res.status(401).json({ error: 'unauthorized' });
  }
}

// ---- auth ----
router.post('/login', (req, res) => {
  const { email, password } = req.body || {};
  const user = db.prepare('SELECT * FROM admin_users WHERE email = ?').get(email);
  if (!user || !bcrypt.compareSync(password || '', user.password_hash)) {
    return res.status(401).json({ error: 'メールアドレスまたはパスワードが正しくありません' });
  }
  const token = jwt.sign({ id: user.id, email: user.email, name: user.name, role: user.role }, JWT_SECRET, { expiresIn: '30d' });
  res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, notifyEmail: !!user.notify_email } });
});

router.get('/me', requireAuth, (req, res) => {
  const user = db.prepare('SELECT * FROM admin_users WHERE id = ?').get(req.admin.id);
  if (!user) return res.status(404).json({ error: 'not_found' });
  res.json({ id: user.id, name: user.name, email: user.email, role: user.role, notifyEmail: !!user.notify_email });
});

router.patch('/me', requireAuth, (req, res) => {
  const { name, notifyEmail } = req.body || {};
  db.prepare('UPDATE admin_users SET name = COALESCE(?, name), notify_email = COALESCE(?, notify_email) WHERE id = ?').run(
    name ?? null,
    notifyEmail === undefined ? null : notifyEmail ? 1 : 0,
    req.admin.id
  );
  res.json({ ok: true });
});

router.use(requireAuth);

// ---- overview ----
router.get('/overview', (req, res) => {
  const totalStudents = db.prepare("SELECT COUNT(*) c FROM students").get().c;
  const activeStudents = db.prepare("SELECT COUNT(*) c FROM students WHERE status = 'active'").get().c;
  const avgSpeak =
    db.prepare(`SELECT AVG(speak_min) a FROM speaking_stats WHERE date >= date('now', '-30 day')`).get().a || 0;
  const recentMonth = new Date().toISOString().slice(0, 7);
  const monthlyPassRate = db
    .prepare(`SELECT AVG(pass) a FROM monthly_mission_results WHERE month = ?`)
    .get(recentMonth);

  const recentLogins = db
    .prepare(
      `SELECT s.id, s.name, s.last_login, g.name as group_name FROM students s LEFT JOIN groups g ON g.id = s.group_id
       ORDER BY s.last_login DESC LIMIT 6`
    )
    .all();

  const groupCounts = db
    .prepare(
      `SELECT g.id, g.name, COUNT(s.id) as count FROM groups g LEFT JOIN students s ON s.group_id = g.id
       WHERE g.status = 'active' GROUP BY g.id ORDER BY g.id`
    )
    .all();

  res.json({
    kpi: {
      totalStudents,
      activeRate: totalStudents ? Math.round((activeStudents / totalStudents) * 1000) / 10 : 0,
      avgSpeakMin: Math.round(avgSpeak),
      monthlyPassRate: monthlyPassRate.a === null ? 0 : Math.round(monthlyPassRate.a * 1000) / 10,
    },
    recentLogins,
    groupCounts,
  });
});

// ---- students ----
router.get('/students', (req, res) => {
  const { search = '', groupId = '', status = '' } = req.query;
  let sql = `SELECT s.id, s.name, s.email, s.phone, s.group_id, s.phase, s.status, s.last_login, s.avatar_url, g.name as group_name FROM students s LEFT JOIN groups g ON g.id = s.group_id WHERE 1=1`;
  const params = [];
  if (search) {
    sql += ` AND s.name LIKE ?`;
    params.push(`%${search}%`);
  }
  if (groupId) {
    sql += ` AND s.group_id = ?`;
    params.push(groupId);
  }
  if (status) {
    sql += ` AND s.status = ?`;
    params.push(status);
  }
  sql += ` ORDER BY s.name`;
  const students = db.prepare(sql).all(...params);

  const withStats = students.map((s) => {
    const speak = db
      .prepare(`SELECT COALESCE(SUM(speak_min),0) t FROM speaking_stats WHERE student_id = ? AND date >= date('now','-7 day')`)
      .get(s.id).t;
    const monthly = db
      .prepare(`SELECT month, pass, date FROM monthly_mission_results WHERE student_id = ? ORDER BY month DESC`)
      .all(s.id);
    return { ...s, weeklySpeakMin: speak, monthlyMissions: monthly };
  });

  res.json(withStats);
});

router.post('/students', (req, res) => {
  const { name, email = '', phone = '', groupId = null, phase = 1 } = req.body || {};
  if (!name) return res.status(400).json({ error: 'name is required' });
  // emailは UNIQUE 制約があるため、未入力時は空文字ではなくNULLで保存する
  // （空文字だとSQLiteのUNIQUEが「同じ値」とみなし、2人目以降のメール未入力の生徒追加が失敗する）
  try {
    const info = db
      .prepare('INSERT INTO students (name, email, phone, group_id, phase, status, last_login) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(name, email.trim() || null, phone, groupId, phase, 'active', new Date().toISOString().slice(0, 10));
    res.json({ id: info.lastInsertRowid });
  } catch (err) {
    if (String(err.message).includes('UNIQUE')) {
      return res.status(409).json({ error: 'このメールアドレスは既に登録されています' });
    }
    throw err;
  }
});

router.patch('/students/:id', (req, res) => {
  const { status, name, email, phone, groupId } = req.body || {};
  db.prepare(
    `UPDATE students SET
      status = COALESCE(?, status), name = COALESCE(?, name), email = COALESCE(?, email),
      phone = COALESCE(?, phone), group_id = COALESCE(?, group_id)
     WHERE id = ?`
  ).run(status ?? null, name ?? null, email ?? null, phone ?? null, groupId ?? null, req.params.id);
  res.json({ ok: true });
});

router.get('/students/:id', (req, res) => {
  const student = db
    .prepare(`SELECT s.id, s.name, s.email, s.phone, s.group_id, s.phase, s.status, s.last_login, s.avatar_url, g.name as group_name FROM students s LEFT JOIN groups g ON g.id = s.group_id WHERE s.id = ?`)
    .get(req.params.id);
  if (!student) return res.status(404).json({ error: 'not_found' });

  const speakingStats = db
    .prepare(`SELECT date, study_min, speak_min FROM speaking_stats WHERE student_id = ? ORDER BY date DESC LIMIT 30`)
    .all(req.params.id);
  const monthlyMissions = db
    .prepare(`SELECT * FROM monthly_mission_results WHERE student_id = ? ORDER BY month DESC`)
    .all(req.params.id);
  const phaseHistory = db.prepare(`SELECT * FROM phase_history WHERE student_id = ? ORDER BY date DESC`).all(req.params.id);
  const unitSubmissions = db
    .prepare(`SELECT * FROM unit_submissions WHERE student_id = ? ORDER BY submitted_at DESC`)
    .all(req.params.id);
  const chatMessages = db.prepare(`SELECT * FROM chat_messages WHERE student_id = ? ORDER BY id ASC`).all(req.params.id);
  const phrases = db
    .prepare(
      `SELECT p.id, p.text, p.text_jp, p.learned, f.name as folder_name FROM phrases p
       LEFT JOIN phrase_folders f ON f.id = p.folder_id WHERE p.student_id = ?`
    )
    .all(req.params.id);

  res.json({ student, speakingStats, monthlyMissions, phaseHistory, unitSubmissions, chatMessages, phrases });
});

router.post('/students/:id/phase', (req, res) => {
  const { phase, date, listening = 0, accuracy = 0, fluency = 0, clarity = 0 } = req.body || {};
  if (!phase) return res.status(400).json({ error: 'phase is required' });
  db.prepare(
    'INSERT INTO phase_history (student_id, phase, date, listening, accuracy, fluency, clarity) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(req.params.id, phase, date || new Date().toISOString().slice(0, 10), listening, accuracy, fluency, clarity);
  db.prepare('UPDATE students SET phase = ? WHERE id = ?').run(phase, req.params.id);
  res.json({ ok: true });
});

router.post('/students/:id/monthly', (req, res) => {
  const { month, pass, date } = req.body || {};
  const safeDate = date || new Date().toISOString().slice(0, 10);
  const existing = db.prepare('SELECT id FROM monthly_mission_results WHERE student_id = ? AND month = ?').get(req.params.id, month);
  if (existing) {
    db.prepare('UPDATE monthly_mission_results SET pass = ?, date = ? WHERE id = ?').run(pass ? 1 : 0, safeDate, existing.id);
  } else {
    db.prepare('INSERT INTO monthly_mission_results (student_id, month, pass, date) VALUES (?, ?, ?, ?)').run(
      req.params.id,
      month,
      pass ? 1 : 0,
      safeDate
    );
  }
  res.json({ ok: true });
});

router.post('/students/:id/units/:unitId/approve', (req, res) => {
  db.prepare("UPDATE unit_submissions SET status = 'approved' WHERE id = ? AND student_id = ?").run(req.params.unitId, req.params.id);
  res.json({ ok: true });
});

router.post('/students/:id/chat', (req, res) => {
  const { text } = req.body || {};
  if (!text) return res.status(400).json({ error: 'text is required' });
  db.prepare('INSERT INTO chat_messages (student_id, sender, text, time) VALUES (?, ?, ?, ?)').run(
    req.params.id,
    'coach',
    text,
    new Date().toISOString()
  );
  res.json({ ok: true });
});

// ---- groups ----
router.get('/groups', (req, res) => {
  const { status = '' } = req.query;
  let sql = `SELECT g.*, COUNT(s.id) as studentCount FROM groups g LEFT JOIN students s ON s.group_id = g.id`;
  const params = [];
  if (status) {
    sql += ` WHERE g.status = ?`;
    params.push(status);
  }
  sql += ` GROUP BY g.id ORDER BY g.id`;
  res.json(db.prepare(sql).all(...params));
});

router.post('/groups', (req, res) => {
  const { name } = req.body || {};
  if (!name) return res.status(400).json({ error: 'name is required' });
  const info = db.prepare("INSERT INTO groups (name, status) VALUES (?, 'active')").run(name);
  res.json({ id: info.lastInsertRowid });
});

router.patch('/groups/:id', (req, res) => {
  const { status, name } = req.body || {};
  db.prepare('UPDATE groups SET status = COALESCE(?, status), name = COALESCE(?, name) WHERE id = ?').run(
    status ?? null,
    name ?? null,
    req.params.id
  );
  res.json({ ok: true });
});

router.delete('/groups/:id', (req, res) => {
  db.prepare('UPDATE students SET group_id = NULL WHERE group_id = ?').run(req.params.id);
  db.prepare('DELETE FROM groups WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

router.get('/groups/:id', (req, res) => {
  const group = db.prepare('SELECT * FROM groups WHERE id = ?').get(req.params.id);
  if (!group) return res.status(404).json({ error: 'not_found' });

  const members = db.prepare('SELECT * FROM students WHERE group_id = ? ORDER BY name').all(req.params.id);
  const memberIds = members.map((m) => m.id);

  let dailyStats = [];
  if (memberIds.length) {
    const placeholders = memberIds.map(() => '?').join(',');
    dailyStats = db
      .prepare(
        `SELECT date, SUM(study_min) as study_min, SUM(speak_min) as speak_min FROM speaking_stats
         WHERE student_id IN (${placeholders}) GROUP BY date ORDER BY date DESC LIMIT 30`
      )
      .all(...memberIds);
  }

  const goals = db.prepare('SELECT * FROM group_goals WHERE group_id = ? ORDER BY week_start DESC').all(req.params.id);

  const totalStudy = dailyStats.reduce((a, d) => a + d.study_min, 0);
  const totalSpeak = dailyStats.reduce((a, d) => a + d.speak_min, 0);

  res.json({ group, members, dailyStats, goals, summary: { totalStudy, totalSpeak } });
});

router.post('/groups/:id/goals', (req, res) => {
  const { weekStart, studyGoal = 0, speakGoal = 0 } = req.body || {};
  if (!weekStart) return res.status(400).json({ error: 'weekStart is required' });
  db.prepare('INSERT INTO group_goals (group_id, week_start, study_goal, speak_goal, achieved) VALUES (?, ?, ?, ?, 0)').run(
    req.params.id,
    weekStart,
    studyGoal,
    speakGoal
  );
  res.json({ ok: true });
});

// ---- coaches ----
router.get('/coaches', (req, res) => {
  res.json(db.prepare('SELECT * FROM coaches ORDER BY id').all());
});

// ---- materials ----
router.get('/materials', (req, res) => {
  res.json(db.prepare('SELECT * FROM materials ORDER BY id DESC').all());
});

router.post('/materials', (req, res) => {
  const { title, week, status = 'draft' } = req.body || {};
  if (!title) return res.status(400).json({ error: 'title is required' });
  const info = db.prepare('INSERT INTO materials (title, week, status) VALUES (?, ?, ?)').run(title, week, status);
  res.json({ id: info.lastInsertRowid });
});

router.patch('/materials/:id', (req, res) => {
  const { status, title, week } = req.body || {};
  db.prepare('UPDATE materials SET status = COALESCE(?, status), title = COALESCE(?, title), week = COALESCE(?, week) WHERE id = ?').run(
    status ?? null,
    title ?? null,
    week ?? null,
    req.params.id
  );
  res.json({ ok: true });
});

// ---- announcements ----
router.get('/announcements', (req, res) => {
  res.json(db.prepare('SELECT * FROM announcements ORDER BY id DESC').all());
});

router.post('/announcements', (req, res) => {
  const { title, body, target = '全生徒', status = 'draft' } = req.body || {};
  if (!title) return res.status(400).json({ error: 'title is required' });
  const info = db
    .prepare('INSERT INTO announcements (title, body, target, status, created_at) VALUES (?, ?, ?, ?, ?)')
    .run(title, body, target, status, new Date().toISOString().slice(0, 10));
  res.json({ id: info.lastInsertRowid });
});

router.patch('/announcements/:id', (req, res) => {
  const { status, title, body } = req.body || {};
  db.prepare(
    'UPDATE announcements SET status = COALESCE(?, status), title = COALESCE(?, title), body = COALESCE(?, body) WHERE id = ?'
  ).run(status ?? null, title ?? null, body ?? null, req.params.id);
  res.json({ ok: true });
});

// ---- lectures（モバイルアプリの「動画」カテゴリで配信するYouTube動画） ----
// 管理画面側でもURLからIDを抽出しているが、古いキャッシュ済みJS等から生URLがそのまま
// 送られてくるケースに備えて、サーバー側でも同じ抽出をかけてから保存する（二重の安全網）
function extractYoutubeId(input) {
  const trimmed = String(input || '').trim();
  try {
    const url = new URL(trimmed);
    if (url.hostname.includes('youtu.be')) {
      return url.pathname.split('/').filter(Boolean)[0] || trimmed;
    }
    if (url.hostname.includes('youtube.com')) {
      const v = url.searchParams.get('v');
      if (v) return v;
      const match = url.pathname.match(/\/(embed|shorts)\/([^/?]+)/);
      if (match) return match[2];
    }
  } catch {
    // URLとして解釈できない場合はIDそのものとして扱う
  }
  return trimmed;
}

router.get('/lectures', (req, res) => {
  res.json(db.prepare('SELECT * FROM lectures ORDER BY sort_order, id').all());
});

router.post('/lectures', (req, res) => {
  const { youtubeId, title, instructor = '', category = '', sortOrder = 0 } = req.body || {};
  if (!youtubeId || !title) return res.status(400).json({ error: 'youtubeId and title are required' });
  const info = db
    .prepare('INSERT INTO lectures (youtube_id, title, instructor, category, sort_order, created_at) VALUES (?, ?, ?, ?, ?, ?)')
    .run(extractYoutubeId(youtubeId), title, instructor, category, sortOrder, new Date().toISOString().slice(0, 10));
  res.json({ id: info.lastInsertRowid });
});

router.patch('/lectures/:id', (req, res) => {
  const { youtubeId, title, instructor, category, sortOrder } = req.body || {};
  db.prepare(
    `UPDATE lectures SET
      youtube_id = COALESCE(?, youtube_id), title = COALESCE(?, title), instructor = COALESCE(?, instructor),
      category = COALESCE(?, category), sort_order = COALESCE(?, sort_order)
     WHERE id = ?`
  ).run(
    youtubeId ? extractYoutubeId(youtubeId) : null,
    title ?? null,
    instructor ?? null,
    category ?? null,
    sortOrder === undefined ? null : sortOrder,
    req.params.id
  );
  res.json({ ok: true });
});

router.delete('/lectures/:id', (req, res) => {
  db.prepare('DELETE FROM lectures WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// ---- ad banners（モバイルアプリのホーム画面に表示するバナー広告） ----
router.get('/ads', (req, res) => {
  res.json(db.prepare('SELECT * FROM ad_banners ORDER BY sort_order, id').all());
});

// バナー画像のアップロード。返ってきたurlをimageUrlとしてPOST/PATCH /adsに渡す
router.post('/ads/upload', adImageUpload.single('image'), (req, res) => {
  const file = req.file;
  if (!file) return res.status(400).json({ error: 'image file is required' });
  try {
    const ext = (path.extname(file.originalname || '') || '.jpg').toLowerCase();
    const safeExt = ['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext) ? ext : '.jpg';
    const filename = `${Date.now()}-${Math.round(Math.random() * 1e6)}${safeExt}`;
    const dest = path.join(AD_IMAGE_DIR, filename);
    try {
      fs.renameSync(file.path, dest);
    } catch (renameErr) {
      if (renameErr.code !== 'EXDEV') throw renameErr;
      fs.copyFileSync(file.path, dest);
      fs.unlink(file.path, () => {});
    }
    res.json({ url: `/ads/${filename}` });
  } catch (err) {
    console.error('ad image upload error:', err);
    fs.unlink(file.path, () => {});
    res.status(500).json({ error: 'upload_failed', detail: String(err.message || err) });
  }
});

router.post('/ads', (req, res) => {
  const { imageUrl, linkUrl = '', placement = 'home', enabled = true, sortOrder = 0 } = req.body || {};
  if (!imageUrl) return res.status(400).json({ error: 'imageUrl is required' });
  const info = db
    .prepare('INSERT INTO ad_banners (image_url, link_url, placement, enabled, sort_order, created_at) VALUES (?, ?, ?, ?, ?, ?)')
    .run(imageUrl, linkUrl, placement, enabled ? 1 : 0, sortOrder, new Date().toISOString().slice(0, 10));
  res.json({ id: info.lastInsertRowid });
});

router.patch('/ads/:id', (req, res) => {
  const { imageUrl, linkUrl, placement, enabled, sortOrder } = req.body || {};
  db.prepare(
    `UPDATE ad_banners SET
      image_url = COALESCE(?, image_url), link_url = COALESCE(?, link_url), placement = COALESCE(?, placement),
      enabled = COALESCE(?, enabled), sort_order = COALESCE(?, sort_order)
     WHERE id = ?`
  ).run(
    imageUrl ?? null,
    linkUrl ?? null,
    placement ?? null,
    enabled === undefined ? null : enabled ? 1 : 0,
    sortOrder === undefined ? null : sortOrder,
    req.params.id
  );
  res.json({ ok: true });
});

router.delete('/ads/:id', (req, res) => {
  db.prepare('DELETE FROM ad_banners WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
