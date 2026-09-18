const test = require('node:test');
const assert = require('node:assert');
const { createRateLimiter } = require('../rateLimit');

function run(limiter, studentId) {
  const res = { headers: {}, setHeader(k, v) { this.headers[k] = v; }, status(c) { this.code = c; return this; }, json(b) { this.body = b; return this; } };
  let passed = false;
  limiter({ studentId }, res, () => { passed = true; });
  return { passed, res };
}

test('rateLimit: 上限までは通し、超えたら429を返す', () => {
  const limiter = createRateLimiter({ windowMs: 60000, max: 3 });
  for (let i = 0; i < 3; i++) assert.strictEqual(run(limiter, 1).passed, true);
  const blocked = run(limiter, 1);
  assert.strictEqual(blocked.passed, false);
  assert.strictEqual(blocked.res.code, 429);
  assert.ok(Number(blocked.res.headers['Retry-After']) > 0);
});

test('rateLimit: 生徒ごとに別カウント', () => {
  const limiter = createRateLimiter({ windowMs: 60000, max: 1 });
  assert.strictEqual(run(limiter, 1).passed, true);
  assert.strictEqual(run(limiter, 2).passed, true);
  assert.strictEqual(run(limiter, 1).passed, false);
});
