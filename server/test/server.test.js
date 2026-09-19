// サーバー本体（index.js）を実際に起動して、非機能まわり（ヘッダ・圧縮・CORS・ヘルスチェック・終了処理）を確認する
const os = require('node:os');
const path = require('node:path');
const fs = require('node:fs');
const net = require('node:net');
const { spawn } = require('node:child_process');
const test = require('node:test');
const assert = require('node:assert');

const serverDir = path.join(__dirname, '..');

function freePort() {
  return new Promise((resolve) => {
    const s = net.createServer().listen(0, () => {
      const { port } = s.address();
      s.close(() => resolve(port));
    });
  });
}

async function startServer(extraEnv = {}) {
  const port = await freePort();
  const dbFile = path.join(os.tmpdir(), `teppen-server-test-${process.pid}-${port}.sqlite`);
  const child = spawn(process.execPath, ['index.js'], {
    cwd: serverDir,
    env: { PATH: process.env.PATH, PORT: String(port), DB_PATH: dbFile, OPENAI_API_KEY: 'test-key', NODE_ENV: 'test', ...extraEnv },
    stdio: 'ignore',
  });
  const base = `http://127.0.0.1:${port}`;
  for (let i = 0; i < 100; i++) {
    try {
      if ((await fetch(`${base}/api/health`)).ok) break;
    } catch {
      await new Promise((r) => setTimeout(r, 100));
    }
  }
  const stop = () => {
    child.kill('SIGKILL');
    for (const suffix of ['', '-wal', '-shm']) fs.rmSync(dbFile + suffix, { force: true });
  };
  return { base, child, stop };
}

test('ヘルスチェック・セキュリティヘッダ・リクエストID', async () => {
  const { base, stop } = await startServer();
  try {
    const res = await fetch(`${base}/api/health`);
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.ok, true);
    assert.strictEqual(res.headers.get('x-content-type-options'), 'nosniff', 'helmetのヘッダが付く');
    assert.ok(!res.headers.get('x-powered-by'), 'Expressのバージョン情報を出さない');
    assert.match(res.headers.get('x-request-id'), /^[0-9a-f-]{36}$/);

    const unauth = await fetch(`${base}/api/grade`, { method: 'POST' });
    assert.strictEqual(unauth.status, 401);
    assert.notStrictEqual(unauth.headers.get('x-request-id'), res.headers.get('x-request-id'), 'リクエストごとに別のID');
  } finally {
    stop();
  }
});

test('圧縮: gzipに対応したクライアントには圧縮して返す', async () => {
  const { base, stop } = await startServer();
  try {
    const res = await fetch(`${base}/api/ranking`, { headers: { 'accept-encoding': 'gzip' } });
    assert.strictEqual(res.headers.get('content-encoding'), 'gzip');
    assert.ok((await res.json()).users.length > 0, '展開すると中身が読める');
  } finally {
    stop();
  }
});

test('CORS: CORS_ORIGINS を設定すると、許可したオリジンだけがブラウザから読める', async () => {
  const { base, stop } = await startServer({ CORS_ORIGINS: 'https://admin.example.com' });
  try {
    const allowed = await fetch(`${base}/api/health`, { headers: { origin: 'https://admin.example.com' } });
    assert.strictEqual(allowed.headers.get('access-control-allow-origin'), 'https://admin.example.com');
    const other = await fetch(`${base}/api/health`, { headers: { origin: 'https://evil.example.com' } });
    assert.strictEqual(other.headers.get('access-control-allow-origin'), null);
  } finally {
    stop();
  }
});

test('終了処理: SIGTERM を受けると、後始末をして正常終了(コード0)する', async () => {
  const { base, child, stop } = await startServer();
  try {
    const exited = new Promise((resolve) => child.on('exit', (code, signal) => resolve({ code, signal })));
    child.kill('SIGTERM');
    const result = await Promise.race([exited, new Promise((r) => setTimeout(() => r('timeout'), 5000))]);
    assert.deepStrictEqual(result, { code: 0, signal: null });
    await assert.rejects(fetch(`${base}/api/health`), '終了後は接続できない');
  } finally {
    stop();
  }
});
