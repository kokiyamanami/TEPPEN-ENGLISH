const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const OpenAI = require('openai');
const db = require('./db');
const { todayStr, mondayOfStr, clientToday } = require('./dateUtil');
const { createRateLimiter } = require('./rateLimit');

const aiLimiter = createRateLimiter({ windowMs: 60 * 1000, max: 30 });
// 総当たり・大量登録対策（ログインは同じIP×メールアドレスで15分に10回、新規登録は同じIPで15分に20回まで）
const emailOf = (req) => String(req.body?.email || '').trim().toLowerCase();
const loginLimiter = createRateLimiter({ windowMs: 15 * 60 * 1000, max: 10, keyFn: (req) => `${req.ip}|${emailOf(req)}` });
const signupLimiter = createRateLimiter({ windowMs: 15 * 60 * 1000, max: 20, keyFn: (req) => req.ip });
const { lookupDictionary } = require('./dictionary');
const { syncDecks } = require('./phraseDecks');
const { generateCurated, isGenerating } = require('./curated');
const { REST_LIMIT_PER_MONTH, goalHistory, restDays, currentGoal } = require('./goals');

const router = express.Router();
if (!process.env.STUDENT_JWT_SECRET && process.env.NODE_ENV === 'production') {
  throw new Error('STUDENT_JWT_SECRET must be set in production');
}
const JWT_SECRET = process.env.STUDENT_JWT_SECRET || 'teppen-english-student-dev-secret';

const AVATAR_DIR = path.join(__dirname, 'public', 'avatars');
fs.mkdirSync(AVATAR_DIR, { recursive: true });
const avatarUpload = multer({ dest: '/tmp/teppen-uploads/', limits: { fileSize: 10 * 1024 * 1024 } });

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const DEFAULT_MY_FOLDER = 'マイフレーズ';
const DEFAULT_MY_WORD_FOLDER = 'マイ単語';

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

// ---- auth ----
router.post('/signup', signupLimiter, (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'email and password are required' });
  if (typeof email !== 'string' || typeof password !== 'string') return res.status(400).json({ error: 'invalid input' });
  const normalizedEmail = email.trim().toLowerCase();
  if (password.length < 8) return res.status(400).json({ error: 'パスワードは8文字以上にしてください' });

  // 管理画面でメールアドレス付きの生徒レコードが先に作られている場合があるため、
  // password_hash未設定（＝まだ本人がサインアップしていない）ならそのレコードを引き継ぐ
  const existing = db.prepare('SELECT id, password_hash FROM students WHERE lower(email) = ?').get(normalizedEmail);
  if (existing && existing.password_hash) return res.status(409).json({ error: 'このメールアドレスは既に登録されています' });

  const hash = bcrypt.hashSync(password, 10);
  let studentId;
  if (existing) {
    db.prepare('UPDATE students SET password_hash = ?, status = ?, last_login = ? WHERE id = ?').run(hash, 'active', todayStr(), existing.id);
    studentId = existing.id;
  } else {
    const info = db
      .prepare('INSERT INTO students (name, email, password_hash, phase, status, last_login, profile_json) VALUES (?, ?, ?, 1, ?, ?, ?)')
      .run('', normalizedEmail, hash, 'active', todayStr(), '{}');
    studentId = info.lastInsertRowid;
  }

  const hasFolders = db.prepare('SELECT id FROM phrase_folders WHERE student_id = ? LIMIT 1').get(studentId);
  if (!hasFolders) {
    db.prepare('INSERT INTO phrase_folders (student_id, name, source, content_type) VALUES (?, ?, ?, ?)').run(studentId, DEFAULT_MY_FOLDER, 'custom', 'phrase');
    db.prepare('INSERT INTO phrase_folders (student_id, name, source, content_type) VALUES (?, ?, ?, ?)').run(studentId, DEFAULT_MY_WORD_FOLDER, 'custom', 'word');
  }

  const token = jwt.sign({ id: studentId }, JWT_SECRET, { expiresIn: '365d' });
  res.json({ token, studentId });
});

router.post('/login', loginLimiter, (req, res) => {
  const { email, password } = req.body || {};
  if (typeof email !== 'string') return res.status(401).json({ error: 'メールアドレスまたはパスワードが正しくありません' });
  const student = db.prepare('SELECT * FROM students WHERE lower(email) = ?').get(email.trim().toLowerCase());
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
    res.status(500).json({ error: 'avatar_upload_failed' });
  }
});

// オンボーディング各ステップの「次へ」で呼び出し、途中離脱しても再開できるようにする
router.post('/onboarding-progress', (req, res) => {
  const { step } = req.body || {};
  if (typeof step !== 'string' || !/^ob[a-z0-9_]{1,20}$/.test(step)) return res.status(400).json({ error: 'invalid step' });
  db.prepare('UPDATE students SET onboarding_step = ? WHERE id = ?').run(step, req.studentId);
  res.json({ ok: true });
});

router.post('/onboarding-complete', (req, res) => {
  db.prepare("UPDATE students SET onboarding_complete = 1, onboarding_step = 'obdone' WHERE id = ?").run(req.studentId);
  syncDecks(req.studentId);
  generateCurated(req.studentId);
  res.json({ ok: true });
});

router.patch('/profile', (req, res) => {
  const student = db.prepare('SELECT * FROM students WHERE id = ?').get(req.studentId);
  if (!student) return res.status(404).json({ error: 'not_found' });
  const current = JSON.parse(student.profile_json || '{}');
  const incoming = req.body && typeof req.body === 'object' && !Array.isArray(req.body) ? req.body : {};
  if (JSON.stringify(incoming).length > 10000) return res.status(413).json({ error: 'profile too large' });
  const updated = { ...current, ...incoming };
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
  // 「今日」は端末のローカル日付で判定する（サーバーはUTCのため日本時間の午前0〜9時にずれる）
  const today = clientToday(req.query.today);
  const t = db
    .prepare('SELECT COALESCE(SUM(study_min), 0) as study, COALESCE(SUM(speak_min), 0) as speak FROM speaking_stats WHERE student_id = ? AND date = ?')
    .get(req.studentId, today);
  res.json({ totalStudyMinutes: row.total, todayStudyMinutes: t.study, todaySpeakMinutes: t.speak });
});

// ---- goals（1日の目標。変更履歴を持ち、過去の日は当時の目標で判定する）・お休み日 ----
const isDate = (v) => /^\d{4}-\d{2}-\d{2}$/.test(String(v));
const dayShift = (dateStr, n) => {
  const d = new Date(dateStr + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

function goalsPayload(studentId) {
  const history = goalHistory(studentId);
  const cur = currentGoal(history);
  return { current: { study: cur.study, speak: cur.speak }, history, restDays: restDays(studentId), restLimitPerMonth: REST_LIMIT_PER_MONTH };
}

router.get('/goals', (req, res) => res.json(goalsPayload(req.studentId)));

router.put('/goals', (req, res) => {
  const { studyGoal, speakGoal } = req.body || {};
  const today = clientToday(req.body?.today);
  const ok = (v) => Number.isInteger(v) && v >= 1 && v <= 1440;
  if (!ok(studyGoal) || !ok(speakGoal)) return res.status(400).json({ error: 'invalid_goal' });
  const existing = db.prepare('SELECT id FROM goal_history WHERE student_id = ? AND effective_from = ?').get(req.studentId, today);
  if (existing) db.prepare('UPDATE goal_history SET study_goal = ?, speak_goal = ? WHERE id = ?').run(studyGoal, speakGoal, existing.id);
  else db.prepare('INSERT INTO goal_history (student_id, effective_from, study_goal, speak_goal) VALUES (?, ?, ?, ?)').run(req.studentId, today, studyGoal, speakGoal);
  res.json(goalsPayload(req.studentId));
});

// お休みは、2日前〜未来の日に月4回まで設定できる（後出しで連続記録を守るのを防ぐ）
router.post('/rest-days', (req, res) => {
  const { date } = req.body || {};
  const today = clientToday(req.body?.today);
  if (!isDate(date)) return res.status(400).json({ error: 'invalid_date' });
  if (date < dayShift(today, -2)) return res.status(400).json({ error: 'too_old' });
  const month = date.slice(0, 7);
  const rests = restDays(req.studentId);
  if (rests.includes(date)) return res.json(goalsPayload(req.studentId));
  if (rests.filter((d) => d.startsWith(month)).length >= REST_LIMIT_PER_MONTH) return res.status(400).json({ error: 'limit_reached' });
  db.prepare('INSERT INTO rest_days (student_id, date) VALUES (?, ?)').run(req.studentId, date);
  res.json(goalsPayload(req.studentId));
});

router.delete('/rest-days/:date', (req, res) => {
  const today = clientToday(req.query.today);
  if (!isDate(req.params.date)) return res.status(400).json({ error: 'invalid_date' });
  if (req.params.date < today) return res.status(400).json({ error: 'past_locked' });
  db.prepare('DELETE FROM rest_days WHERE student_id = ? AND date = ?').run(req.studentId, req.params.date);
  res.json(goalsPayload(req.studentId));
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
  const minutes = Math.round(Number(body.minutes ?? 0));
  const memo = body.memo ?? '';
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(String(date))) return res.status(400).json({ error: 'date must be YYYY-MM-DD' });
  if (!Number.isFinite(minutes) || minutes < 0 || minutes > 1440) return res.status(400).json({ error: 'minutes must be 0-1440' });
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
  syncDecks(req.studentId);
  generateCurated(req.studentId); // まだ無いカスタマイズ教材のフォルダだけ作る（既存は変更しない）
  // 単語用のマイフォルダが無い生徒（フレーズ/単語の区分を追加する前からの生徒）には既定のものを作る
  if (!db.prepare("SELECT id FROM phrase_folders WHERE student_id = ? AND source = 'custom' AND content_type = 'word' LIMIT 1").get(req.studentId)) {
    db.prepare("INSERT INTO phrase_folders (student_id, name, source, content_type) VALUES (?, ?, 'custom', 'word')").run(req.studentId, DEFAULT_MY_WORD_FOLDER);
  }
  res.json(db.prepare('SELECT * FROM phrase_folders WHERE student_id = ? ORDER BY id').all(req.studentId));
});

router.post('/phrase-folders', (req, res) => {
  const { name } = req.body || {};
  if (!name || typeof name !== 'string' || name.length > 100) return res.status(400).json({ error: 'name is required (max 100 chars)' });
  const info = db.prepare("INSERT INTO phrase_folders (student_id, name, source) VALUES (?, ?, 'custom')").run(req.studentId, name);
  res.json({ id: info.lastInsertRowid });
});

// マイフォルダ（custom）だけ、生徒が名前変更・削除できる。運営提供・カスタマイズ教材は変更不可
router.patch('/phrase-folders/:id', (req, res) => {
  const name = String(req.body?.name || '').trim();
  if (!name) return res.status(400).json({ error: 'name is required' });
  const info = db.prepare("UPDATE phrase_folders SET name = ? WHERE id = ? AND student_id = ? AND source = 'custom'").run(name, req.params.id, req.studentId);
  if (!info.changes) return res.status(404).json({ error: 'not_found' });
  res.json({ ok: true });
});

router.delete('/phrase-folders/:id', (req, res) => {
  const folder = db.prepare("SELECT id FROM phrase_folders WHERE id = ? AND student_id = ? AND source = 'custom'").get(req.params.id, req.studentId);
  if (!folder) return res.status(404).json({ error: 'not_found' });
  db.prepare('DELETE FROM phrases WHERE folder_id = ? AND student_id = ?').run(folder.id, req.studentId);
  db.prepare('DELETE FROM phrase_folders WHERE id = ?').run(folder.id);
  res.json({ ok: true });
});

// 「AIで新しく作る」: プロフィールを元に、カスタマイズ教材へ新しいフレーズ・単語を追加する（既存は消さない）
router.post('/phrase-generate', aiLimiter, async (req, res) => {
  if (isGenerating(req.studentId)) return res.status(202).json({ status: 'busy' });
  const started = generateCurated(req.studentId, { more: true });
  const early = await Promise.race([started, new Promise((r) => setTimeout(() => r('started'), 50))]);
  if (early === 'cooldown') return res.status(429).json({ error: 'cooldown' });
  if (early === 'not_ready') return res.status(400).json({ error: 'onboarding_required' });
  res.status(202).json({ status: 'started' });
});

router.get('/phrases', (req, res) => {
  syncDecks(req.studentId);
  // 3回覚えたフレーズは一覧から外れ、履歴（/phrase-history）に移る
  res.json(db.prepare('SELECT * FROM phrases WHERE student_id = ? AND mastered_at IS NULL ORDER BY id').all(req.studentId));
});

const MASTER_COUNT = 3;

// 「覚えた」を1回記録する。同じ日に何度押しても1回まで。3回目で一覧から外れて履歴に入る
router.post('/phrases/:id/learn', (req, res) => {
  const p = db
    .prepare(
      `SELECT p.*, f.name as folder_name, f.content_type FROM phrases p JOIN phrase_folders f ON f.id = p.folder_id
       WHERE p.id = ? AND p.student_id = ? AND p.mastered_at IS NULL`
    )
    .get(req.params.id, req.studentId);
  if (!p) return res.status(404).json({ error: 'not_found' });
  // 1日1回の判定は端末の日付を信用せず、サーバーのJST日付で行う（端末の日付を任意に送れると同じ日に何度でも数えられる）
  const today = todayStr();
  if (p.learned_on && p.learned_on >= today) return res.json({ learnedCount: p.learned_count, mastered: false, already: true });
  const count = p.learned_count + 1;
  if (count < MASTER_COUNT) {
    db.prepare('UPDATE phrases SET learned_count = ?, learned = 1, learned_on = ? WHERE id = ?').run(count, today, p.id);
    return res.json({ learnedCount: count, mastered: false, already: false });
  }
  db.transaction(() => {
    db.prepare('UPDATE phrases SET learned_count = ?, learned = 1, learned_on = ?, mastered_at = ? WHERE id = ?').run(count, today, today, p.id);
    db.prepare('INSERT INTO phrase_history (student_id, phrase_id, text, text_jp, content_type, folder_name, mastered_at) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
      req.studentId, p.id, p.text, p.text_jp || '', p.content_type, p.folder_name, today
    );
  })();
  res.json({ learnedCount: count, mastered: true, already: false });
});

router.get('/phrase-history', (req, res) => {
  res.json(db.prepare('SELECT * FROM phrase_history WHERE student_id = ? ORDER BY mastered_at DESC, id DESC').all(req.studentId));
});

// 履歴から復習に戻す。元のフレーズが残っていればカウントをリセットして戻し、無ければマイフォルダに作り直す
router.post('/phrase-history/:id/restore', (req, res) => {
  const h = db.prepare('SELECT * FROM phrase_history WHERE id = ? AND student_id = ?').get(req.params.id, req.studentId);
  if (!h) return res.status(404).json({ error: 'not_found' });
  db.transaction(() => {
    const p = h.phrase_id ? db.prepare('SELECT id FROM phrases WHERE id = ? AND student_id = ?').get(h.phrase_id, req.studentId) : null;
    if (p) {
      db.prepare('UPDATE phrases SET learned_count = 0, learned = 0, learned_on = NULL, mastered_at = NULL WHERE id = ?').run(p.id);
    } else {
      const folder = db
        .prepare("SELECT id FROM phrase_folders WHERE student_id = ? AND source = 'custom' AND content_type = ? ORDER BY id LIMIT 1")
        .get(req.studentId, h.content_type);
      if (!folder) throw new Error('no_folder');
      db.prepare('INSERT INTO phrases (student_id, folder_id, text, text_jp, learned) VALUES (?, ?, ?, ?, 0)').run(req.studentId, folder.id, h.text, h.text_jp);
    }
    db.prepare('DELETE FROM phrase_history WHERE id = ?').run(h.id);
  })();
  res.json({ ok: true });
});

router.post('/phrases', (req, res) => {
  const { folderId, text, textJP = '' } = req.body || {};
  if (!folderId || !text) return res.status(400).json({ error: 'folderId and text are required' });
  if (typeof text !== 'string' || text.length > 1000 || typeof textJP !== 'string' || textJP.length > 1000) {
    return res.status(400).json({ error: 'text and textJP must be strings (max 1000 chars)' });
  }
  const folder = db.prepare("SELECT id FROM phrase_folders WHERE id = ? AND student_id = ? AND source = 'custom'").get(folderId, req.studentId);
  if (!folder) return res.status(404).json({ error: 'folder_not_found' });
  const info = db
    .prepare('INSERT INTO phrases (student_id, folder_id, text, text_jp, learned) VALUES (?, ?, ?, ?, 0)')
    .run(req.studentId, folderId, text, textJP);
  res.json({ id: info.lastInsertRowid });
});

router.patch('/phrases/:id', (req, res) => {
  const { learned, text, textJP, folderId } = req.body || {};
  const has = (k) => Object.prototype.hasOwnProperty.call(req.body || {}, k);
  const phrase = db
    .prepare('SELECT p.id, f.source FROM phrases p JOIN phrase_folders f ON f.id = p.folder_id WHERE p.id = ? AND p.student_id = ?')
    .get(req.params.id, req.studentId);
  if (!phrase) return res.status(404).json({ error: 'not_found' });
  // 運営提供・カスタマイズ教材の中身は変更できない（覚えた状態のみ切り替え可）
  if (phrase.source !== 'custom' && (has('text') || has('textJP') || has('folderId'))) return res.status(403).json({ error: 'read_only' });
  if (has('text') && !String(text || '').trim()) return res.status(400).json({ error: 'text_required' });
  if ((has('text') && String(text).length > 1000) || (has('textJP') && String(textJP ?? '').length > 1000)) {
    return res.status(400).json({ error: 'text too long (max 1000 chars)' });
  }
  if (has('folderId') && !db.prepare("SELECT id FROM phrase_folders WHERE id = ? AND student_id = ? AND source = 'custom'").get(folderId, req.studentId)) {
    return res.status(404).json({ error: 'folder_not_found' });
  }
  if (has('learned')) db.prepare('UPDATE phrases SET learned = ? WHERE id = ?').run(learned ? 1 : 0, phrase.id);
  if (has('text')) db.prepare('UPDATE phrases SET text = ? WHERE id = ?').run(String(text).trim(), phrase.id);
  if (has('textJP')) db.prepare('UPDATE phrases SET text_jp = ? WHERE id = ?').run(String(textJP ?? '').trim(), phrase.id);
  if (has('folderId')) db.prepare('UPDATE phrases SET folder_id = ? WHERE id = ?').run(folderId, phrase.id);
  res.json({ ok: true });
});

router.delete('/phrases/:id', (req, res) => {
  const info = db
    .prepare("DELETE FROM phrases WHERE id = ? AND student_id = ? AND folder_id IN (SELECT id FROM phrase_folders WHERE source = 'custom')")
    .run(req.params.id, req.studentId);
  if (!info.changes) return res.status(404).json({ error: 'not_found' });
  res.json({ ok: true });
});

// Daily/Weekly/Monthlyミッションの合否は、/api/grade がAI添削の結果からサーバー側で記録する（server/missions.js）

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

router.post('/chat-ai', aiLimiter, async (req, res) => {
  const { persona } = req.body || {};
  const history = Array.isArray(req.body?.history) ? req.body.history : [];
  const system = Object.prototype.hasOwnProperty.call(AI_PERSONAS, persona) ? AI_PERSONAS[persona] : null;
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

// ---- 単語の意味（英文中の単語を長押しした時の簡易辞書） ----
// まずローカルの英和辞書(EJDict)を引いて即返す（無料・高速）。辞書にない語、または mode:'ai' の時は
// 文脈に合った意味をLLMで返す
const wordLookupCache = new Map();

router.post('/word-lookup', async (req, res) => {
  const word = String(req.body?.word || '').trim().slice(0, 60);
  const sentence = String(req.body?.sentence || '').trim().slice(0, 400);
  if (!word) return res.status(400).json({ error: 'word is required' });

  if (req.body?.mode !== 'ai') {
    const hit = lookupDictionary(word);
    if (hit) return res.json({ source: 'dictionary', word: hit.word, senses: hit.senses });
  }

  const cacheKey = `${word.toLowerCase()}::${sentence}`;
  if (wordLookupCache.has(cacheKey)) return res.json(wordLookupCache.get(cacheKey));

  // 辞書の検索とキャッシュ命中は無料なので制限しない。OpenAIを呼ぶ場合だけレート制限をかける
  let allowed = false;
  aiLimiter(req, res, () => {
    allowed = true;
  });
  if (!allowed) return;

  try {
    const resp = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      max_tokens: 300,
      messages: [
        {
          role: 'system',
          content:
            'あなたは日本人英語学習者向けの英和辞書です。与えられた英単語について、与えられた文の文脈での意味を答えてください。' +
            '必ず次のJSON形式のみで回答: {"word": "見出し語（原形）", "pos": "品詞（日本語。例: 名詞・動詞・形容詞）", "meaning": "この文脈での簡潔な日本語の意味", "exampleEN": "短い英語の例文", "exampleJP": "例文の日本語訳"}',
        },
        { role: 'user', content: `単語: ${word}\n文: ${sentence || '(文脈なし)'}` },
      ],
    });
    const parsed = JSON.parse(resp.choices[0].message.content);
    const result = {
      source: 'ai',
      word: String(parsed.word || word),
      pos: String(parsed.pos || ''),
      meaning: String(parsed.meaning || ''),
      exampleEN: String(parsed.exampleEN || ''),
      exampleJP: String(parsed.exampleJP || ''),
    };
    if (wordLookupCache.size > 500) wordLookupCache.clear();
    wordLookupCache.set(cacheKey, result);
    res.json(result);
  } catch (err) {
    console.error('word-lookup error:', err);
    res.status(500).json({ error: 'word_lookup_failed' });
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
  if (!text || typeof text !== 'string' || text.length > 2000) return res.status(400).json({ error: 'text is required (max 2000 chars)' });
  const info = db
    .prepare('INSERT INTO chat_messages (student_id, sender, text, time) VALUES (?, ?, ?, ?)')
    .run(req.studentId, 'student', text, new Date().toISOString());
  res.json({ id: info.lastInsertRowid });
});

router.requireAuth = requireAuth;
module.exports = router;
