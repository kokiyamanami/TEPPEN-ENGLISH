// 本番起動時の管理者アカウントまわり（初期管理者の作成・既定パスワードの検出）。別プロセスで db.js を読み込んで確認する
const os = require('node:os');
const path = require('node:path');
const fs = require('node:fs');
const { spawnSync } = require('node:child_process');
const test = require('node:test');
const assert = require('node:assert');

const serverDir = path.join(__dirname, '..');

function run(env, script) {
  const dbFile = path.join(os.tmpdir(), `teppen-boot-${process.pid}-${Math.random().toString(36).slice(2)}.sqlite`);
  const result = spawnSync(process.execPath, ['-e', script], {
    cwd: serverDir,
    env: { PATH: process.env.PATH, DB_PATH: dbFile, ...env },
    encoding: 'utf8',
  });
  for (const suffix of ['', '-wal', '-shm']) fs.rmSync(dbFile + suffix, { force: true });
  return result;
}

const PRINT_ADMINS = "const db=require('./db');console.log(JSON.stringify(db.prepare('SELECT email,role,must_change_password m FROM admin_users').all()))";
const PRINT_COUNTS = "const db=require('./db');console.log(JSON.stringify({s:db.prepare('SELECT COUNT(*) c FROM students').get().c}))";

test('本番: ADMIN_EMAIL / ADMIN_INITIAL_PASSWORD が無いと起動できない', () => {
  const r = run({ NODE_ENV: 'production' }, PRINT_ADMINS);
  assert.notStrictEqual(r.status, 0);
  assert.match(r.stderr, /ADMIN_INITIAL_PASSWORD/);
});

test('本番: 10文字未満の初期パスワードでは起動できない', () => {
  const r = run({ NODE_ENV: 'production', ADMIN_EMAIL: 'boss@example.com', ADMIN_INITIAL_PASSWORD: 'short' }, PRINT_ADMINS);
  assert.notStrictEqual(r.status, 0);
});

test('本番: 初期管理者は環境変数から作られ、変更が強制され、モックデータは入らない', () => {
  const env = { NODE_ENV: 'production', ADMIN_EMAIL: 'Boss@Example.com', ADMIN_INITIAL_PASSWORD: 'long-enough-password' };
  const admins = JSON.parse(run(env, PRINT_ADMINS).stdout.trim().split('\n').pop());
  assert.deepStrictEqual(admins, [{ email: 'boss@example.com', role: 'admin', m: 1 }]);
  const counts = JSON.parse(run(env, PRINT_COUNTS).stdout.trim().split('\n').pop());
  assert.strictEqual(counts.s, 0, '本番では生徒のモックデータを入れない');
});

test('本番: ソースに載っている既定パスワードのままのアカウントは、変更を強制される', () => {
  // 開発モードで既定パスワードの管理者を作り、同じDBを本番として開き直す
  const dbFile = path.join(os.tmpdir(), `teppen-boot-legacy-${process.pid}.sqlite`);
  const base = { PATH: process.env.PATH, DB_PATH: dbFile };
  spawnSync(process.execPath, ['-e', "require('./db')"], { cwd: serverDir, env: { ...base, NODE_ENV: 'development' }, encoding: 'utf8' });
  const r = spawnSync(process.execPath, ['-e', PRINT_ADMINS], { cwd: serverDir, env: { ...base, NODE_ENV: 'production' }, encoding: 'utf8' });
  for (const suffix of ['', '-wal', '-shm']) fs.rmSync(dbFile + suffix, { force: true });
  const admins = JSON.parse(r.stdout.trim().split('\n').pop());
  assert.strictEqual(admins[0].m, 1);
});
