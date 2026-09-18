const test = require('node:test');
const assert = require('node:assert');
const { clientToday } = require('../dateUtil');

const NOW = new Date('2026-09-19T03:00:00Z'); // JSTでは 2026-09-19

test('clientToday: サーバーの日付から±1日以内なら端末の日付を採用する', () => {
  assert.strictEqual(clientToday('2026-09-19', NOW), '2026-09-19');
  assert.strictEqual(clientToday('2026-09-18', NOW), '2026-09-18');
  assert.strictEqual(clientToday('2026-09-20', NOW), '2026-09-20');
});

test('clientToday: 1日を超えてずれた日付はサーバーの日付にする（過去日の偽装対策）', () => {
  assert.strictEqual(clientToday('2026-09-01', NOW), '2026-09-19');
  assert.strictEqual(clientToday('2026-09-22', NOW), '2026-09-19');
});

test('clientToday: 不正な値・存在しない日付はサーバーの日付にする', () => {
  assert.strictEqual(clientToday(undefined, NOW), '2026-09-19');
  assert.strictEqual(clientToday('abc', NOW), '2026-09-19');
  assert.strictEqual(clientToday('2026-13-45', NOW), '2026-09-19');
  assert.strictEqual(clientToday('2026-02-31', NOW), '2026-09-19');
});
