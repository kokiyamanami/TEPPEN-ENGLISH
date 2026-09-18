const test = require('node:test');
const assert = require('node:assert');
const { todayStr, mondayOfStr } = require('../dateUtil');

test('todayStr: JSTで日付を判定する（UTCの前日15時以降は翌日扱い）', () => {
  assert.strictEqual(todayStr(new Date('2026-09-18T15:00:00Z')), '2026-09-19');
  assert.strictEqual(todayStr(new Date('2026-09-18T14:59:59Z')), '2026-09-18');
});

test('mondayOfStr: 週の起点は月曜日', () => {
  assert.strictEqual(mondayOfStr(new Date('2026-09-14T03:00:00Z')), '2026-09-14'); // 月曜
  assert.strictEqual(mondayOfStr(new Date('2026-09-20T03:00:00Z')), '2026-09-14'); // 日曜は前の月曜
  assert.strictEqual(mondayOfStr(new Date('2026-09-19T03:00:00Z')), '2026-09-14'); // 土曜
});

test('mondayOfStr: JSTの月曜0時台はUTCでは日曜でも月曜として扱う', () => {
  assert.strictEqual(mondayOfStr(new Date('2026-09-13T15:30:00Z')), '2026-09-14');
});
