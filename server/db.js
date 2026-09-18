const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');

const db = new Database(path.join(__dirname, 'admin.sqlite'));
db.pragma('journal_mode = WAL');

db.exec(`
CREATE TABLE IF NOT EXISTS admin_users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'coach',
  notify_email INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS groups (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active'
);

CREATE TABLE IF NOT EXISTS coaches (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT,
  specialty TEXT
);

CREATE TABLE IF NOT EXISTS students (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  phone TEXT,
  password_hash TEXT,
  profile_json TEXT,
  group_id INTEGER REFERENCES groups(id),
  phase INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'active',
  last_login TEXT,
  onboarding_step TEXT NOT NULL DEFAULT 'ob1',
  onboarding_complete INTEGER NOT NULL DEFAULT 0,
  avatar_url TEXT
);

-- 1日の目標の変更履歴。変更した日から有効で、過去の日は当時の目標で判定する
CREATE TABLE IF NOT EXISTS goal_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL REFERENCES students(id),
  effective_from TEXT NOT NULL,
  study_goal INTEGER NOT NULL,
  speak_goal INTEGER NOT NULL
);

-- お休み（凍結）日。連続達成日数を途切れさせない
CREATE TABLE IF NOT EXISTS rest_days (
  student_id INTEGER NOT NULL REFERENCES students(id),
  date TEXT NOT NULL,
  PRIMARY KEY (student_id, date)
);

-- 運営が用意するフレーズ教材。kind='official'はレベル(Phase)別、'curated'はプロフィール(職業・趣味・性格・経歴)に合わせたカスタマイズ教材
CREATE TABLE IF NOT EXISTS phrase_decks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kind TEXT NOT NULL,
  name TEXT NOT NULL,
  level INTEGER,
  attr TEXT,
  attr_value TEXT
);

CREATE TABLE IF NOT EXISTS phrase_deck_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  deck_id INTEGER NOT NULL REFERENCES phrase_decks(id),
  text TEXT NOT NULL,
  text_jp TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0
);

-- 1日に複数件登録できるよう、student_id×dateのUNIQUE制約は付けない
CREATE TABLE IF NOT EXISTS speaking_stats (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER REFERENCES students(id),
  date TEXT NOT NULL,
  study_min INTEGER NOT NULL,
  speak_min INTEGER NOT NULL,
  category TEXT,
  subcategories TEXT,
  memo TEXT
);

CREATE TABLE IF NOT EXISTS phrase_folders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER REFERENCES students(id),
  name TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'custom'
);

CREATE TABLE IF NOT EXISTS monthly_mission_results (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER REFERENCES students(id),
  month TEXT NOT NULL,
  pass INTEGER NOT NULL,
  date TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS daily_mission_results (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER REFERENCES students(id),
  date TEXT NOT NULL,
  type TEXT NOT NULL,
  pass INTEGER NOT NULL
);

-- Weeklyミッションの教材ステップ(1〜6)＋テスト(7)の進捗。週(月曜始まり)ごとに1行
CREATE TABLE IF NOT EXISTS weekly_progress (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER REFERENCES students(id),
  week_start TEXT NOT NULL,
  completed_step INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS weekly_mission_results (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER REFERENCES students(id),
  week_start TEXT NOT NULL,
  pass INTEGER NOT NULL,
  date TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS phase_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER REFERENCES students(id),
  phase INTEGER NOT NULL,
  date TEXT NOT NULL,
  listening INTEGER,
  accuracy INTEGER,
  fluency INTEGER,
  clarity INTEGER
);

CREATE TABLE IF NOT EXISTS unit_submissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER REFERENCES students(id),
  unit INTEGER NOT NULL,
  submitted_at TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
);

CREATE TABLE IF NOT EXISTS chat_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER REFERENCES students(id),
  sender TEXT NOT NULL,
  text TEXT NOT NULL,
  time TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS phrases (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER REFERENCES students(id),
  folder_id INTEGER REFERENCES phrase_folders(id),
  text TEXT NOT NULL,
  text_jp TEXT,
  learned INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS group_goals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  group_id INTEGER REFERENCES groups(id),
  week_start TEXT NOT NULL,
  study_goal INTEGER,
  speak_goal INTEGER,
  achieved INTEGER
);

CREATE TABLE IF NOT EXISTS materials (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  week TEXT,
  status TEXT NOT NULL DEFAULT 'draft'
);

CREATE TABLE IF NOT EXISTS announcements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  body TEXT,
  target TEXT,
  target_group_id INTEGER REFERENCES groups(id),
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS lectures (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  youtube_id TEXT NOT NULL,
  title TEXT NOT NULL,
  instructor TEXT,
  category TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS ad_banners (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  image_url TEXT NOT NULL,
  link_url TEXT,
  placement TEXT NOT NULL DEFAULT 'home',
  enabled INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);
`);

// 既存DB（作成済みのadmin.sqlite）に新カラムを後付けするマイグレーション
const studentCols = db.prepare('PRAGMA table_info(students)').all().map((c) => c.name);
if (!studentCols.includes('onboarding_step')) {
  db.exec("ALTER TABLE students ADD COLUMN onboarding_step TEXT NOT NULL DEFAULT 'ob1'");
}
if (!studentCols.includes('onboarding_complete')) {
  db.exec('ALTER TABLE students ADD COLUMN onboarding_complete INTEGER NOT NULL DEFAULT 0');
}
if (!studentCols.includes('avatar_url')) {
  db.exec('ALTER TABLE students ADD COLUMN avatar_url TEXT');
}
if (!studentCols.includes('curated_hash')) {
  db.exec('ALTER TABLE students ADD COLUMN curated_hash TEXT');
}
const phraseFolderCols = db.prepare('PRAGMA table_info(phrase_folders)').all().map((c) => c.name);
if (!phraseFolderCols.includes('deck_id')) {
  db.exec('ALTER TABLE phrase_folders ADD COLUMN deck_id INTEGER REFERENCES phrase_decks(id)');
}
const phraseCols = db.prepare('PRAGMA table_info(phrases)').all().map((c) => c.name);
if (!phraseCols.includes('deck_item_id')) {
  db.exec('ALTER TABLE phrases ADD COLUMN deck_item_id INTEGER REFERENCES phrase_deck_items(id)');
}
const adBannerCols = db.prepare('PRAGMA table_info(ad_banners)').all().map((c) => c.name);
if (!adBannerCols.includes('placement')) {
  db.exec("ALTER TABLE ad_banners ADD COLUMN placement TEXT NOT NULL DEFAULT 'home'");
}
const announcementCols = db.prepare('PRAGMA table_info(announcements)').all().map((c) => c.name);
if (!announcementCols.includes('target_group_id')) {
  db.exec('ALTER TABLE announcements ADD COLUMN target_group_id INTEGER REFERENCES groups(id)');
}

// speaking_statsに旧UNIQUE(student_id, date)制約が残っている場合、1日複数件を許可するため
// 制約なしの新テーブルへ作り直す（SQLiteはALTER TABLEで制約を削除できないため）
const speakingStatsSql = db.prepare("SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'speaking_stats'").get();
if (speakingStatsSql && speakingStatsSql.sql.includes('UNIQUE')) {
  db.exec(`
    CREATE TABLE speaking_stats_new (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER REFERENCES students(id),
      date TEXT NOT NULL,
      study_min INTEGER NOT NULL,
      speak_min INTEGER NOT NULL,
      category TEXT,
      subcategories TEXT,
      memo TEXT
    );
    INSERT INTO speaking_stats_new (id, student_id, date, study_min, speak_min, category, subcategories, memo)
      SELECT id, student_id, date, study_min, speak_min, category, subcategories, memo FROM speaking_stats;
    DROP TABLE speaking_stats;
    ALTER TABLE speaking_stats_new RENAME TO speaking_stats;
  `);
}

function addDaysStr(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function seedIfEmpty() {
  const studentCount = db.prepare('SELECT COUNT(*) as c FROM students').get().c;
  if (studentCount > 0) return;

  console.log('Seeding admin database with mock data...');

  const insertGroup = db.prepare('INSERT INTO groups (name, status) VALUES (?, ?)');
  const groupNames = ['aグループ', 'bグループ', 'cグループ', 'dグループ', 'eグループ'];
  const groupIds = groupNames.map((name, i) => insertGroup.run(name, i === 4 ? 'inactive' : 'active').lastInsertRowid);

  const insertCoach = db.prepare('INSERT INTO coaches (name, email, specialty) VALUES (?, ?, ?)');
  insertCoach.run('田中コーチ', 'tanaka@teppen-english.com', 'ビジネス英語・プレゼンテーション');
  insertCoach.run('佐藤チューター', 'sato@teppen-english.com', '発音・イントネーション');

  const studentNames = [
    '鈴木 花子', '高橋 修', '田村 美咲', '伊藤 大輔', '渡辺 亜美',
    '中村 早紀', '小林 陽介', '吉田 蓮', '山本 直樹', '加藤 沙織',
    '斎藤 拓也', '清水 美咲', '井上 大和', '木村 遥', '林 健二',
    '橋本 彩', '近藤 亮', '石田 優子', '村上 隼人', '原田 千尋',
    '松田 亮太', '藤田 恵', '岡田 翔', '西村 麻衣', '後藤 太一',
  ];

  const insertStudent = db.prepare(
    `INSERT INTO students (name, email, phone, group_id, phase, status, last_login, onboarding_complete)
     VALUES (?, ?, ?, ?, ?, ?, ?, 1)`
  );
  const insertStat = db.prepare('INSERT INTO speaking_stats (student_id, date, study_min, speak_min) VALUES (?, ?, ?, ?)');
  const insertMonthly = db.prepare('INSERT INTO monthly_mission_results (student_id, month, pass, date) VALUES (?, ?, ?, ?)');
  const insertPhaseHist = db.prepare(
    'INSERT INTO phase_history (student_id, phase, date, listening, accuracy, fluency, clarity) VALUES (?, ?, ?, ?, ?, ?, ?)'
  );
  const insertChat = db.prepare('INSERT INTO chat_messages (student_id, sender, text, time) VALUES (?, ?, ?, ?)');
  const insertUnit = db.prepare('INSERT INTO unit_submissions (student_id, unit, submitted_at, status) VALUES (?, ?, ?, ?)');

  studentNames.forEach((name, i) => {
    const groupId = groupIds[i % 4]; // 最初の4グループに分散、5つ目(非アクティブ)には所属させない
    const phase = 1 + (i % 5);
    const status = i % 11 === 0 ? 'inactive' : 'active';
    const lastLogin = addDaysStr(-(i % 6));
    const studentId = insertStudent.run(name, `student${i + 1}@example.com`, `090-0000-${String(1000 + i)}`, groupId, phase, status, lastLogin)
      .lastInsertRowid;

    for (let d = 29; d >= 0; d--) {
      const study = Math.round(50 + Math.random() * 60);
      const speak = Math.round(study * (0.25 + Math.random() * 0.2));
      insertStat.run(studentId, addDaysStr(-d), study, speak);
    }

    for (let m = 3; m >= 0; m--) {
      const dt = new Date();
      dt.setMonth(dt.getMonth() - m, 1);
      insertMonthly.run(studentId, dt.toISOString().slice(0, 7), Math.random() > 0.25 ? 1 : 0, dt.toISOString().slice(0, 10));
    }

    insertPhaseHist.run(
      studentId,
      phase,
      addDaysStr(-30),
      2 + Math.floor(Math.random() * 3),
      2 + Math.floor(Math.random() * 3),
      2 + Math.floor(Math.random() * 3),
      2 + Math.floor(Math.random() * 3)
    );

    insertChat.run(studentId, 'coach', 'MYピッチの提出お待ちしています。準備で困っていることがあればどうぞ。', addDaysStr(-1));
    if (i % 2 === 0) {
      insertChat.run(studentId, 'student', 'ありがとうございます、今週中に提出します！', addDaysStr(-1));
    }

    if (i % 4 === 0) {
      insertUnit.run(studentId, phase * 2, addDaysStr(-1), 'pending');
    }
  });

  const insertGoal = db.prepare('INSERT INTO group_goals (group_id, week_start, study_goal, speak_goal, achieved) VALUES (?, ?, ?, ?, ?)');
  groupIds.slice(0, 4).forEach((groupId) => {
    for (let w = 3; w >= 0; w--) {
      insertGoal.run(groupId, addDaysStr(-w * 7 - 7), 90, 30, Math.random() > 0.3 ? 1 : 0);
    }
  });

  const insertMaterial = db.prepare('INSERT INTO materials (title, week, status) VALUES (?, ?, ?)');
  insertMaterial.run('強み・弱み・キャリアについて話す', 'WEEK 14', 'published');
  insertMaterial.run('商談での価格交渉', 'WEEK 15', 'draft');
  insertMaterial.run('プロジェクトの進捗報告', 'WEEK 13', 'published');

  const insertAnnouncement = db.prepare('INSERT INTO announcements (title, body, target, status, created_at) VALUES (?, ?, ?, ?, ?)');
  insertAnnouncement.run(
    'フリー練習に「シャドーイング」を追加しました',
    '9/1よりフリー練習に「シャドーイング」カテゴリを追加しました。',
    '全生徒',
    'published',
    addDaysStr(-2)
  );
  insertAnnouncement.run(
    'Monthlyミッション提出期限のお知らせ',
    '来週のMonthlyミッション提出期限は月曜23:59までです。',
    '全生徒',
    'draft',
    addDaysStr(0)
  );

  const insertAdmin = db.prepare('INSERT INTO admin_users (name, email, password_hash, role, notify_email) VALUES (?, ?, ?, ?, ?)');
  insertAdmin.run('田中コーチ', 'coach@teppen-english.com', bcrypt.hashSync('teppen2026', 10), 'admin', 1);

  const insertLecture = db.prepare(
    'INSERT INTO lectures (youtube_id, title, instructor, category, sort_order, created_at) VALUES (?, ?, ?, ?, ?, ?)'
  );
  const seedLectures = [
    ['HXH-qL4DltE', 'TOEIC700～800点でも話せない理由と仕事で使える英語へのロードマップ', 'TEPPEN ENGLISH', '学習法'],
    ['JYZVWfsASeU', '英語は何時間勉強すれば話せる？本当に大切なのは時間ではありません', 'TEPPEN ENGLISH', '学習法'],
    ['Ae0dyicbGsw', 'ビジネス英語とは？本当に必要なレベルを解説します', 'TEPPEN ENGLISH', 'ビジネス英語'],
    ['7ld-qzNW_-s', '「I think…」ばかりになっていませんか？同じ表現の繰り返しから抜け出す方法', 'TEPPEN ENGLISH', 'スピーキング'],
    ['mONOTQydDDw', '通勤時間だけで英語が話せるようになる「独り言英語」', 'TEPPEN ENGLISH', 'スピーキング'],
  ];
  seedLectures.forEach(([youtubeId, title, instructor, category], i) => {
    insertLecture.run(youtubeId, title, instructor, category, i, new Date().toISOString().slice(0, 10));
  });

  const insertAd = db.prepare('INSERT INTO ad_banners (image_url, link_url, enabled, sort_order, created_at) VALUES (?, ?, ?, ?, ?)');
  insertAd.run(
    'https://placehold.jp/076fb3/ffffff/670x180.png?text=TEPPEN%20ENGLISH%20%E4%BD%93%E9%A8%93%E3%83%AC%E3%83%83%E3%82%B9%E3%83%B3',
    'https://teppen-english.com',
    1,
    0,
    new Date().toISOString().slice(0, 10)
  );

  console.log('Seed complete.');
}

seedIfEmpty();

module.exports = db;
