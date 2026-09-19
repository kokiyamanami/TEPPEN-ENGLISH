const os = require('node:os');
const path = require('node:path');
const fs = require('node:fs');
const test = require('node:test');
const assert = require('node:assert');
const { sweepDir } = require('../housekeeping');

function makeDir(files) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'teppen-sweep-'));
  const now = Date.now();
  for (const [name, { size, ageMs }] of Object.entries(files)) {
    const full = path.join(dir, name);
    fs.writeFileSync(full, Buffer.alloc(size));
    fs.utimesSync(full, new Date(now - ageMs), new Date(now - ageMs));
  }
  return dir;
}

const HOUR = 60 * 60 * 1000;

test('sweepDir: 期限より古いファイルだけ消す', () => {
  const dir = makeDir({ old: { size: 10, ageMs: 5 * HOUR }, fresh: { size: 10, ageMs: 10 * 60 * 1000 } });
  const r = sweepDir(dir, { maxAgeMs: HOUR });
  assert.deepStrictEqual(fs.readdirSync(dir), ['fresh']);
  assert.strictEqual(r.removed, 1);
  fs.rmSync(dir, { recursive: true });
});

test('sweepDir: 合計容量が上限を超えたら、古い順に消す', () => {
  const dir = makeDir({ a: { size: 100, ageMs: 3 * HOUR }, b: { size: 100, ageMs: 2 * HOUR }, c: { size: 100, ageMs: HOUR } });
  sweepDir(dir, { maxTotalBytes: 150 });
  assert.deepStrictEqual(fs.readdirSync(dir), ['c'], '新しいものを残し、合計が上限以下になるまで古い順に消える');
  fs.rmSync(dir, { recursive: true });
});

test('sweepDir: 上限内・期限内なら何も消さない／存在しないディレクトリでも落ちない', () => {
  const dir = makeDir({ a: { size: 10, ageMs: 1000 } });
  assert.strictEqual(sweepDir(dir, { maxAgeMs: HOUR, maxTotalBytes: 1000 }).removed, 0);
  fs.rmSync(dir, { recursive: true });
  assert.strictEqual(sweepDir(path.join(os.tmpdir(), 'no-such-dir-xyz'), { maxAgeMs: 1 }).removed, 0);
});
