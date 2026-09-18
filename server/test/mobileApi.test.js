// モバイルAPIの統合テスト（認証・所有者チェック・「覚えた」の1日1回制限など）。
// 一時ファイルのDBに対して、実際にExpressを起動して検証する（OpenAIは呼ばない）
const os = require('node:os');
const path = require('node:path');
const fs = require('node:fs');
const test = require('node:test');
const assert = require('node:assert');

const dbFile = path.join(os.tmpdir(), `teppen-test-${process.pid}-${Date.now()}.sqlite`);
process.env.DB_PATH = dbFile;
process.env.OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'test-key';

const express = require('express');
const db = require('../db');
const mobileRoutes = require('../mobileRoutes');

let server;
let base;

test.before(async () => {
  const app = express();
  app.use(express.json());
  app.use('/api/mobile', mobileRoutes);
  await new Promise((resolve) => {
    server = app.listen(0, resolve);
  });
  base = `http://127.0.0.1:${server.address().port}/api/mobile`;
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

async function signup(email) {
  const r = await call('POST', '/signup', { body: { email, password: 'password123' } });
  assert.strictEqual(r.status, 200);
  return r.body.token;
}

test('認証: 弱いパスワードは拒否、メールは大文字小文字を区別せず重複を防ぐ', async () => {
  assert.strictEqual((await call('POST', '/signup', { body: { email: 'a@x.com', password: 'short' } })).status, 400);
  await signup(' Alice@Example.com ');
  assert.strictEqual((await call('POST', '/signup', { body: { email: 'alice@example.com', password: 'password123' } })).status, 409);
  assert.strictEqual((await call('POST', '/login', { body: { email: 'ALICE@example.com', password: 'password123' } })).status, 200);
  assert.strictEqual((await call('POST', '/login', { body: { email: 'alice@example.com', password: 'wrong-password' } })).status, 401);
});

test('認証: トークンなし・不正トークンは401', async () => {
  assert.strictEqual((await call('GET', '/records')).status, 401);
  assert.strictEqual((await call('GET', '/records', { token: 'bogus' })).status, 401);
});

test('所有者チェック: 他の生徒の学習記録・フレーズは操作できない', async () => {
  const alice = await signup('owner-a@example.com');
  const bob = await signup('owner-b@example.com');

  const rec = await call('POST', '/records', { token: alice, body: { date: '2026-09-19', minutes: 30 } });
  await call('DELETE', `/records/${rec.body.id}`, { token: bob });
  const aliceRecords = await call('GET', '/records', { token: alice });
  assert.strictEqual(aliceRecords.body.length, 1, 'Bobの削除でAliceの記録が消えてはいけない');

  const folders = await call('GET', '/phrase-folders', { token: alice });
  const custom = folders.body.find((f) => f.source === 'custom' && f.content_type === 'phrase');
  const phrase = await call('POST', '/phrases', { token: alice, body: { folderId: custom.id, text: 'Nice to meet you.' } });
  assert.strictEqual((await call('PATCH', `/phrases/${phrase.body.id}`, { token: bob, body: { learned: true } })).status, 404);
  assert.strictEqual((await call('POST', `/phrases/${phrase.body.id}/learn`, { token: bob })).status, 404);
  assert.strictEqual((await call('DELETE', `/phrases/${phrase.body.id}`, { token: bob })).status, 404);
  // Bobは他人のフォルダにフレーズを登録できない
  assert.strictEqual((await call('POST', '/phrases', { token: bob, body: { folderId: custom.id, text: 'x' } })).status, 404);
});

test('「覚えた」: 同じ日は1回だけ、日付をずらして送っても数えず、3回目で履歴に移る', async () => {
  const token = await signup('learn@example.com');
  const folders = await call('GET', '/phrase-folders', { token });
  const custom = folders.body.find((f) => f.source === 'custom' && f.content_type === 'phrase');
  const { body: { id } } = await call('POST', '/phrases', { token, body: { folderId: custom.id, text: 'Let me check.' } });

  const first = await call('POST', `/phrases/${id}/learn`, { token, body: { today: '2020-01-01' } });
  assert.deepStrictEqual([first.body.learnedCount, first.body.already], [1, false]);
  // 端末の日付を変えて送っても、同じ日の2回目は数えない
  for (const today of ['2020-01-02', '2099-01-01', undefined]) {
    const again = await call('POST', `/phrases/${id}/learn`, { token, body: { today } });
    assert.strictEqual(again.body.already, true);
    assert.strictEqual(again.body.learnedCount, 1);
  }

  // 日付が進んだことにして（DBを書き換えて）2回目・3回目
  db.prepare("UPDATE phrases SET learned_on = '2000-01-01' WHERE id = ?").run(id);
  assert.strictEqual((await call('POST', `/phrases/${id}/learn`, { token })).body.learnedCount, 2);
  db.prepare("UPDATE phrases SET learned_on = '2000-01-02' WHERE id = ?").run(id);
  const third = await call('POST', `/phrases/${id}/learn`, { token });
  assert.strictEqual(third.body.mastered, true);

  const list = await call('GET', '/phrases', { token });
  assert.ok(!list.body.some((p) => p.id === id), '習得済みは一覧から外れる');
  const history = await call('GET', '/phrase-history', { token });
  assert.strictEqual(history.body.length, 1);

  assert.strictEqual((await call('POST', `/phrase-history/${history.body[0].id}/restore`, { token })).status, 200);
  assert.ok((await call('GET', '/phrases', { token })).body.some((p) => p.id === id && p.learned_count === 0));
});

test('お休み・目標: 過去日を「今日」と偽っても後出しで設定できない', async () => {
  const token = await signup('rest@example.com');
  const r = await call('POST', '/rest-days', { token, body: { date: '2020-01-01', today: '2020-01-01' } });
  assert.strictEqual(r.status, 400);
  assert.strictEqual(r.body.error, 'too_old');

  const goal = await call('PUT', '/goals', { token, body: { studyGoal: 10, speakGoal: 5, today: '2020-01-01' } });
  assert.strictEqual(goal.status, 200);
  assert.ok(goal.body.history.every((h) => h.from > '2020-01-01'), '目標履歴を過去日付で作れてはいけない');
});

test('Weeklyの進捗: 前のステップを飛ばして進めない', async () => {
  const token = await signup('weekly@example.com');
  assert.strictEqual((await call('POST', '/weekly-progress', { token, body: { step: 3 } })).status, 400);
  assert.strictEqual((await call('POST', '/weekly-progress', { token, body: { step: 1 } })).status, 200);
  assert.strictEqual((await call('POST', '/weekly-progress', { token, body: { step: 2 } })).body.completedStep, 2);
});
