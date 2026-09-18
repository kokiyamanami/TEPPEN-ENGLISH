// 日本時間(JST)基準の日付ユーティリティ。
// Date#toISOString()はUTC基準のため、JSTの0〜9時に「前日」扱いになってしまう
const JST_OFFSET_MS = 9 * 60 * 60 * 1000;

function jstDate(d = new Date()) {
  return new Date(new Date(d).getTime() + JST_OFFSET_MS);
}

// YYYY-MM-DD（JST）
function todayStr(d = new Date()) {
  return jstDate(d).toISOString().slice(0, 10);
}

// その日が属する週の月曜日（JST・YYYY-MM-DD）
function mondayOfStr(d = new Date()) {
  const x = jstDate(d);
  const day = x.getUTCDay();
  x.setUTCDate(x.getUTCDate() + (day === 0 ? -6 : 1 - day));
  return x.toISOString().slice(0, 10);
}

const DAY_MS = 24 * 60 * 60 * 1000;

// クライアントが送ってくる「今日」（端末のローカル日付）を検証して返す。
// 端末のタイムゾーン差は最大±1日なので、サーバーの日付から1日を超えてずれた値・不正な日付は
// 無視してサーバーの日付を使う（過去日を「今日」と偽って、お休み日や目標履歴を後出しで作るのを防ぐ）
function clientToday(value, now = new Date()) {
  const server = todayStr(now);
  const v = String(value ?? '');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return server;
  const t = Date.parse(`${v}T00:00:00Z`);
  if (Number.isNaN(t) || new Date(t).toISOString().slice(0, 10) !== v) return server;
  return Math.abs(t - Date.parse(`${server}T00:00:00Z`)) <= DAY_MS ? v : server;
}

module.exports = { jstDate, todayStr, mondayOfStr, clientToday };
