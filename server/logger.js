const crypto = require('crypto');

// 1行1JSONの構造化ログ（ログ収集基盤にそのまま取り込める形）。テスト中は出力しない
const silent = () => process.env.NODE_ENV === 'test';

function write(level, msg, fields = {}) {
  if (silent()) return;
  const line = JSON.stringify({ time: new Date().toISOString(), level, msg, ...fields });
  (level === 'error' ? console.error : console.log)(line);
}

const errorFields = (err) => (err ? { err: err.message || String(err), stack: err.stack } : {});

const logger = {
  info: (msg, fields) => write('info', msg, fields),
  warn: (msg, fields) => write('warn', msg, fields),
  // error(msg, err, fields)
  error: (msg, err, fields) => write('error', msg, { ...errorFields(err), ...fields }),
};

// リクエストごとにIDを振り（X-Request-Id ヘッダでも返す）、完了時に メソッド・パス・ステータス・所要時間 を記録する。
// クエリ文字列・リクエスト本文は個人情報を含みうるため記録しない
function requestLogger(req, res, next) {
  req.id = crypto.randomUUID();
  res.setHeader('X-Request-Id', req.id);
  const start = process.hrtime.bigint();
  res.on('finish', () => {
    if (req.originalUrl === '/api/health') return;
    logger.info('request', {
      id: req.id,
      method: req.method,
      path: req.originalUrl.split('?')[0],
      status: res.statusCode,
      ms: Math.round(Number(process.hrtime.bigint() - start) / 1e5) / 10,
      studentId: req.studentId,
      adminId: req.admin?.id,
    });
  });
  next();
}

module.exports = { logger, requestLogger };
