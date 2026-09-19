// 生徒ごとの簡易レート制限（メモリ上・単一プロセス前提）。
// OpenAI課金が発生するエンドポイントの連打・濫用対策。requireAuthの後ろに置くこと
// keyFn を渡すと、生徒ID以外（例: IP+メールアドレス）をキーにできる（ログインの総当たり対策など）
function createRateLimiter({ windowMs = 60 * 1000, max = 30, keyFn } = {}) {
  const hits = new Map(); // key -> 直近windowMs内のリクエスト時刻

  return function rateLimit(req, res, next) {
    const key = String(keyFn ? keyFn(req) : req.studentId ?? req.ip);
    const now = Date.now();
    const recent = (hits.get(key) || []).filter((t) => now - t < windowMs);
    if (recent.length >= max) {
      hits.set(key, recent);
      res.setHeader('Retry-After', Math.ceil((recent[0] + windowMs - now) / 1000));
      return res.status(429).json({ error: 'rate_limited' });
    }
    recent.push(now);
    hits.set(key, recent);
    // Mapが膨らみ続けないよう、たまに古いキーを掃除する
    if (hits.size > 1000) {
      for (const [k, times] of hits) if (times.every((t) => now - t >= windowMs)) hits.delete(k);
    }
    next();
  };
}

module.exports = { createRateLimiter };
