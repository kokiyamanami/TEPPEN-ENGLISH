const OpenAI = require('openai');

// 全エンドポイントで共有するOpenAIクライアント。
// 既定のタイムアウトは10分で、OpenAI側が詰まるとリクエストが溜まり続けるため、明示的に短くする。
// 一時的な失敗（429・5xx・接続エラー）は自動で2回まで再試行する
module.exports = new OpenAI({ apiKey: process.env.OPENAI_API_KEY, timeout: 60 * 1000, maxRetries: 2 });
