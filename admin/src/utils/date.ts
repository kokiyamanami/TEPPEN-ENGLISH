// ブラウザのローカル時間（日本のスタッフが使う前提でJST）基準の日付文字列。
// Date#toISOString()はUTC基準のため、日本時間の0〜9時に前日・前月になってしまう
function pad(n: number) {
  return String(n).padStart(2, '0');
}

export function todayStr(d = new Date()): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function monthStr(d = new Date()): string {
  return todayStr(d).slice(0, 7);
}

// その日が属する週の月曜日
export function mondayStr(d = new Date()): string {
  const monday = new Date(d);
  const day = monday.getDay();
  monday.setDate(monday.getDate() - (day === 0 ? 6 : day - 1));
  return todayStr(monday);
}
