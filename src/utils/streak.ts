import { addDays, dateKey } from './dateHelpers';

export type GoalPoint = { from: string; study: number; speak: number };
export const DEFAULT_GOAL = { study: 90, speak: 30 };

// 履歴（適用開始日の昇順）から、その日に有効だった目標を返す。目標を変えても過去の日は当時の目標で判定される
export function goalOn(history: GoalPoint[], date: string) {
  let g: { study: number; speak: number } = DEFAULT_GOAL;
  for (const h of history) {
    if (h.from <= date) g = h;
    else break;
  }
  return g;
}

export type StreakResult = {
  achieved: Set<string>;
  current: number;
  best: number;
  todayAchieved: boolean;
  remainingMin: number;
};

// 目標達成日を数える。お休み日は連続を途切れさせず、日数にも加算しない。
// 今日まだ達成していなくても、日付が変わるまでは連続を途切れさせない
export function computeStreak(minutesOf: Record<string, number>, history: GoalPoint[], restDays: Set<string>, today: Date): StreakResult {
  const achieved = new Set<string>();
  Object.keys(minutesOf).forEach((k) => {
    if (minutesOf[k] >= goalOn(history, k).study) achieved.add(k);
  });
  const todayKey = dateKey(today);
  const keys = Object.keys(minutesOf).sort();
  let run = 0;
  let best = 0;
  if (keys.length) {
    const [y, m, d] = keys[0].split('-').map(Number);
    for (let cur = new Date(y, m - 1, d); dateKey(cur) <= todayKey; cur = addDays(cur, 1)) {
      const k = dateKey(cur);
      if (achieved.has(k)) {
        run++;
        best = Math.max(best, run);
      } else if (!restDays.has(k) && k !== todayKey) {
        run = 0;
      }
    }
  }
  const todayAchieved = achieved.has(todayKey);
  return {
    achieved,
    current: run,
    best,
    todayAchieved,
    remainingMin: Math.max(0, goalOn(history, todayKey).study - (minutesOf[todayKey] ?? 0)),
  };
}
