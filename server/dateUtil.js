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

module.exports = { jstDate, todayStr, mondayOfStr };
