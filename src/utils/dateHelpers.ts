export function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

export function mondayOf(d: Date): Date {
  const x = new Date(d);
  const day = x.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  x.setDate(x.getDate() + diff);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function shortMd(d: Date): string {
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export function weekKey(d: Date): string {
  return shortMd(mondayOf(d));
}

export function monthKey(d: Date): string {
  return `${d.getFullYear()}/${d.getMonth() + 1}`;
}

export function dateKey(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

export function formatMin(min: number): string {
  if (min >= 60) {
    const h = Math.floor(min / 60);
    const m = Math.round(min % 60);
    return m > 0 ? `${h}時間${m}分` : `${h}時間`;
  }
  return `${Math.round(min)}分`;
}
