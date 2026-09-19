// 主要クエリの性能を、大きめのダミーデータ（生徒3000人・学習記録18万件など）で計測する。
// 使い方: node scripts/bench.js   （一時ファイルのDBを使うので、本番用DBには触れない）
const os = require('os');
const path = require('path');
const fs = require('fs');

const dbFile = path.join(os.tmpdir(), `teppen-bench-${process.pid}.sqlite`);
process.env.DB_PATH = dbFile;
process.env.OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'bench';
const db = require('../db');

const STUDENTS = 3000;
const RECORDS_PER = 60;
const PHRASES_PER = 30;

function seed() {
  const day = (i) => new Date(Date.UTC(2026, 0, 1) + i * 86400000).toISOString().slice(0, 10);
  const insStudent = db.prepare("INSERT INTO students (name, email, password_hash, phase, status, last_login, profile_json, onboarding_complete) VALUES (?, ?, 'x', 1, 'active', ?, '{}', 1)");
  const insStat = db.prepare('INSERT INTO speaking_stats (student_id, date, study_min, speak_min) VALUES (?, ?, 30, 10)');
  const insFolder = db.prepare("INSERT INTO phrase_folders (student_id, name, source, content_type) VALUES (?, 'f', 'custom', 'phrase')");
  const insPhrase = db.prepare('INSERT INTO phrases (student_id, folder_id, text, text_jp, learned) VALUES (?, ?, ?, ?, 0)');
  const insChat = db.prepare("INSERT INTO chat_messages (student_id, sender, text, time) VALUES (?, 'coach', 'hi', '2026-01-01')");
  const insMonthly = db.prepare("INSERT INTO monthly_mission_results (student_id, month, pass, date) VALUES (?, ?, 1, '2026-01-01')");
  const insDaily = db.prepare("INSERT INTO daily_mission_results (student_id, date, type, pass) VALUES (?, ?, 'photo', 1)");
  db.transaction(() => {
    for (let s = 0; s < STUDENTS; s++) {
      const id = insStudent.run(`生徒${s}`, `bench${s}@example.com`, '2026-01-01').lastInsertRowid;
      for (let d = 0; d < RECORDS_PER; d++) insStat.run(id, day(d));
      const folder = insFolder.run(id).lastInsertRowid;
      for (let p = 0; p < PHRASES_PER; p++) insPhrase.run(id, folder, `phrase ${p}`, '訳');
      for (let c = 0; c < 10; c++) insChat.run(id);
      for (let m = 1; m <= 6; m++) insMonthly.run(id, `2026-0${m}`);
      for (let d = 0; d < 30; d++) insDaily.run(id, day(d));
    }
  })();
}

function time(label, fn, times = 200) {
  fn(); // ウォームアップ
  const start = process.hrtime.bigint();
  for (let i = 0; i < times; i++) fn();
  const ms = Number(process.hrtime.bigint() - start) / 1e6 / times;
  console.log(`${label.padEnd(44)} ${ms.toFixed(3).padStart(9)} ms`);
  return ms;
}

seed();
const mid = Math.floor(STUDENTS / 2) + 25;
const email = `bench${Math.floor(STUDENTS / 2)}@example.com`;
console.log(`データ: 生徒${STUDENTS} / 学習記録${STUDENTS * RECORDS_PER} / フレーズ${STUDENTS * PHRASES_PER}\n`);

time('ログイン: メールで生徒を検索', () => db.prepare('SELECT * FROM students WHERE lower(email) = ?').get(email));
time('学習記録の取得 (GET /records)', () => db.prepare('SELECT id, date, study_min, speak_min, category, subcategories, memo FROM speaking_stats WHERE student_id = ? ORDER BY date, id').all(mid));
time('累計学習時間 (GET /study-summary)', () => db.prepare('SELECT COALESCE(SUM(study_min), 0) as total FROM speaking_stats WHERE student_id = ?').get(mid));
time('フレーズ一覧 (GET /phrases)', () => db.prepare('SELECT * FROM phrases WHERE student_id = ? AND mastered_at IS NULL ORDER BY id').all(mid));
time('コーチとのチャット (GET /chat)', () => db.prepare('SELECT id, sender, text, time FROM chat_messages WHERE student_id = ? ORDER BY id').all(mid));
time('ミッション履歴 (GET /mission-history)', () => db.prepare('SELECT date, type, pass FROM daily_mission_results WHERE student_id = ? ORDER BY date DESC').all(mid));
time('Monthlyミッションの存在確認', () => db.prepare('SELECT id FROM monthly_mission_results WHERE student_id = ? AND month = ?').get(mid, '2026-03'));

// 管理画面の生徒一覧: 生徒ごとに2クエリ（N+1）していた旧実装 vs 集計してまとめて取得する新実装
const students = db.prepare('SELECT id FROM students').all();
time(
  '管理: 生徒一覧の統計（旧: 生徒ごとに2クエリ）',
  () => {
    students.forEach((s) => {
      db.prepare("SELECT COALESCE(SUM(speak_min),0) t FROM speaking_stats WHERE student_id = ? AND date >= date('now','-7 day')").get(s.id);
      db.prepare('SELECT month, pass, date FROM monthly_mission_results WHERE student_id = ? ORDER BY month DESC').all(s.id);
    });
  },
  3
);
time(
  '管理: 生徒一覧の統計（新: まとめて2クエリ）',
  () => {
    db.prepare("SELECT student_id, COALESCE(SUM(speak_min),0) t FROM speaking_stats WHERE date >= date('now','-7 day') GROUP BY student_id").all();
    db.prepare('SELECT student_id, month, pass, date FROM monthly_mission_results ORDER BY month DESC').all();
  },
  3
);

db.close();
for (const suffix of ['', '-wal', '-shm']) fs.rmSync(dbFile + suffix, { force: true });
