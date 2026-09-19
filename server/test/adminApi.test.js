// 管理画面APIの統合テスト（役割による権限分離・初期パスワードの変更強制・ログイン試行制限）
const os = require('node:os');
const path = require('node:path');
const fs = require('node:fs');
const test = require('node:test');
const assert = require('node:assert');

const dbFile = path.join(os.tmpdir(), `teppen-admin-test-${process.pid}-${Date.now()}.sqlite`);
process.env.DB_PATH = dbFile;
process.env.OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'test-key';
process.env.NODE_ENV = 'test';
delete process.env.ADMIN_EMAIL;
delete process.env.ADMIN_INITIAL_PASSWORD;

const express = require('express');
const db = require('../db');
const adminRoutes = require('../adminRoutes');

let server;
let base;

test.before(async () => {
  const app = express();
  app.use(express.json());
  app.use('/api/admin', adminRoutes);
  await new Promise((resolve) => {
    server = app.listen(0, resolve);
  });
  base = `http://127.0.0.1:${server.address().port}/api/admin`;
});

test.after(() => {
  server.close();
  db.close();
  for (const suffix of ['', '-wal', '-shm']) fs.rmSync(dbFile + suffix, { force: true });
});

async function call(method, url, { token, body } = {}) {
  const res = await fetch(base + url, {
    method,
    headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return { status: res.status, body: await res.json().catch(() => null) };
}

async function login(email, password) {
  return call('POST', '/login', { body: { email, password } });
}

const DEV_ADMIN = { email: 'coach@teppen-english.com', password: 'teppen2026' };
const NEW_PASSWORD = 'a-much-longer-password-1';

async function adminToken() {
  return (await login(DEV_ADMIN.email, DEV_ADMIN.password)).body.token;
}

// スタッフを作り、初回ログイン時のパスワード変更まで済ませてトークンを返す
async function createStaff(admin, { email, role }) {
  const created = await call('POST', '/staff', { token: admin, body: { name: `${role} user`, email, role, password: 'initial-password-1' } });
  assert.strictEqual(created.status, 200);
  const first = await login(email, 'initial-password-1');
  assert.strictEqual(first.body.user.mustChangePassword, true);
  const change = await call('POST', '/me/password', { token: first.body.token, body: { currentPassword: 'initial-password-1', newPassword: NEW_PASSWORD } });
  assert.strictEqual(change.status, 200);
  return { id: created.body.id, token: first.body.token };
}

test('生徒一覧: 週の発話時間・Monthly履歴・目標が、まとめて集計されて返る（N+1の書き換えの回帰テスト）', async () => {
  const admin = await adminToken();
  const list = (await call('GET', '/students', { token: admin })).body;
  assert.ok(list.length >= 25);
  for (const s of list) {
    assert.strictEqual(typeof s.weeklySpeakMin, 'number');
    assert.ok(Array.isArray(s.monthlyMissions));
    assert.strictEqual(s.studyGoal, 90, '目標が未設定なら既定値');
  }
  const withMonthly = list.find((s) => s.monthlyMissions.length > 0);
  assert.ok(withMonthly, 'シードデータではMonthlyの履歴がある');
  const months = withMonthly.monthlyMissions.map((m) => m.month);
  assert.deepStrictEqual(months, [...months].sort().reverse(), '新しい月が先頭');

  // 目標を設定した生徒には、その目標が反映される
  db.prepare('INSERT INTO goal_history (student_id, effective_from, study_goal, speak_goal) VALUES (?, ?, ?, ?)').run(withMonthly.id, '2026-01-01', 45, 15);
  const after = (await call('GET', '/students', { token: admin })).body.find((s) => s.id === withMonthly.id);
  assert.deepStrictEqual([after.studyGoal, after.speakGoal], [45, 15]);
});

test('認証: トークンなしは401、削除されたアカウントのトークンは無効になる', async () => {
  assert.strictEqual((await call('GET', '/students')).status, 401);
  const admin = await adminToken();
  const staff = await createStaff(admin, { email: 'gone@example.com', role: 'coach' });
  assert.strictEqual((await call('GET', '/students', { token: staff.token })).status, 200);
  assert.strictEqual((await call('DELETE', `/staff/${staff.id}`, { token: admin })).status, 200);
  assert.strictEqual((await call('GET', '/students', { token: staff.token })).status, 401);
});

test('初期パスワード: 変更するまで他の操作はできず、弱いパスワードには変更できない', async () => {
  const admin = await adminToken();
  await call('POST', '/staff', { token: admin, body: { name: 'New', email: 'newbie@example.com', role: 'coach', password: 'initial-password-1' } });
  const { body } = await login('newbie@example.com', 'initial-password-1');
  const token = body.token;

  const blocked = await call('GET', '/students', { token });
  assert.strictEqual(blocked.status, 403);
  assert.strictEqual(blocked.body.error, 'password_change_required');
  assert.strictEqual((await call('GET', '/me', { token })).status, 200, '変更のために自分の情報は取得できる');

  for (const weak of ['short', 'teppen2026', 'initial-password-1']) {
    const r = await call('POST', '/me/password', { token, body: { currentPassword: 'initial-password-1', newPassword: weak } });
    assert.strictEqual(r.status, 400, `${weak} は拒否される`);
  }
  assert.strictEqual((await call('POST', '/me/password', { token, body: { currentPassword: 'wrong', newPassword: NEW_PASSWORD } })).status, 400);

  assert.strictEqual((await call('POST', '/me/password', { token, body: { currentPassword: 'initial-password-1', newPassword: NEW_PASSWORD } })).status, 200);
  assert.strictEqual((await call('GET', '/students', { token })).status, 200);
  assert.strictEqual((await login('newbie@example.com', 'initial-password-1')).status, 401, '古いパスワードは使えない');
  assert.strictEqual((await login('newbie@example.com', NEW_PASSWORD)).status, 200);
});

test('権限分離: コーチは生徒運用のみ、教材・動画・広告・コーチ管理・一括操作・スタッフ管理は運営管理者のみ', async () => {
  const admin = await adminToken();
  const coach = await createStaff(admin, { email: 'coach-role@example.com', role: 'coach' });
  const t = coach.token;

  // できる: 閲覧と生徒・グループの運用
  assert.strictEqual((await call('GET', '/lectures', { token: t })).status, 200);
  assert.strictEqual((await call('POST', '/students', { token: t, body: { name: '追加テスト' } })).status, 200);
  assert.strictEqual((await call('POST', '/groups', { token: t, body: { name: 'テストグループ' } })).status, 200);
  assert.strictEqual((await call('POST', '/students/1/chat', { token: t, body: { text: 'こんにちは' } })).status, 200);

  // できない: 運営管理者のみの操作
  const forbidden = [
    ['POST', '/lectures', { youtubeId: 'HXH-qL4DltE', title: 'x' }],
    ['DELETE', '/lectures/1'],
    ['POST', '/ads', { imageUrl: '/ads/x.png' }],
    ['DELETE', '/ads/1'],
    ['POST', '/announcements', { title: 'x' }],
    ['POST', '/materials', { title: 'x' }],
    ['POST', '/coaches', { name: 'x' }],
    ['DELETE', '/coaches/1'],
    ['POST', '/phrase-decks', { name: 'x', level: 1 }],
    ['POST', '/students/bulk', { rows: [{ name: 'x' }] }],
    ['POST', '/students/bulk-status', { ids: [1], status: 'inactive' }],
    ['DELETE', '/groups/1'],
    ['GET', '/staff'],
    ['POST', '/staff', { name: 'x', email: 'x@example.com', password: 'initial-password-1' }],
  ];
  for (const [method, url, body] of forbidden) {
    const r = await call(method, url, { token: t, body });
    assert.strictEqual(r.status, 403, `${method} ${url} はコーチには禁止`);
  }

  // 運営管理者は同じ操作ができる
  assert.strictEqual((await call('POST', '/lectures', { token: admin, body: { youtubeId: 'HXH-qL4DltE', title: 'x' } })).status, 200);
});

test('役割の変更は、発行済みトークンにも即時に反映される', async () => {
  const admin = await adminToken();
  const other = await createStaff(admin, { email: 'promoted@example.com', role: 'admin' });
  assert.strictEqual((await call('GET', '/staff', { token: other.token })).status, 200);
  await call('PATCH', `/staff/${other.id}`, { token: admin, body: { role: 'coach' } });
  assert.strictEqual((await call('GET', '/staff', { token: other.token })).status, 403);
});

test('スタッフ管理: 最後の運営管理者は削除・降格できず、自分自身も削除できない', async () => {
  const admin = await adminToken();
  const me = (await call('GET', '/me', { token: admin })).body;
  const others = (await call('GET', '/staff', { token: admin })).body.filter((u) => u.role === 'admin' && u.id !== me.id);
  for (const o of others) await call('DELETE', `/staff/${o.id}`, { token: admin });

  assert.strictEqual((await call('DELETE', `/staff/${me.id}`, { token: admin })).status, 400);
  const demote = await call('PATCH', `/staff/${me.id}`, { token: admin, body: { role: 'coach' } });
  assert.strictEqual(demote.status, 400);
  assert.strictEqual((await call('POST', '/staff', { token: admin, body: { name: 'dup', email: 'COACH@teppen-english.com', role: 'coach', password: 'initial-password-1' } })).status, 409);
});

test('パスワードのリセット: 再発行したパスワードは初回ログイン時に変更を強制する', async () => {
  const admin = await adminToken();
  const staff = await createStaff(admin, { email: 'reset@example.com', role: 'coach' });
  assert.strictEqual((await call('POST', `/staff/${staff.id}/reset-password`, { token: admin, body: { password: 'reissued-password-1' } })).status, 200);
  const r = await login('reset@example.com', 'reissued-password-1');
  assert.strictEqual(r.body.user.mustChangePassword, true);
  assert.strictEqual((await call('GET', '/students', { token: r.body.token })).status, 403);
});

test('ログイン試行制限: 同じIP×メールで11回目以降は429（他のメールには影響しない）', async () => {
  const email = 'bruteforce@example.com';
  let last;
  for (let i = 0; i < 10; i++) last = await login(email, 'wrong-password');
  assert.strictEqual(last.status, 401);
  assert.strictEqual((await login(email, 'wrong-password')).status, 429);
  assert.strictEqual((await login(DEV_ADMIN.email, DEV_ADMIN.password)).status, 200, '別のアカウントは制限されない');
});
