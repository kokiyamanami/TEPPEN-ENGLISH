import { addDays, dateKey, monthKey, mondayOf, shortMd, weekKey } from '../utils/dateHelpers';

export type DailyStat = { date: Date; studyMin: number; speakMin: number };

function buildDailyStats(days: number, studyBase: number, speakRatio: number): DailyStat[] {
  const arr: DailyStat[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = addDays(new Date(), -i);
    const study = Math.round(studyBase + (Math.random() * 40 - 15));
    const speak = Math.round(study * (speakRatio + Math.random() * 0.15));
    arr.push({ date: d, studyMin: Math.max(study, speak), speakMin: Math.min(speak, study) });
  }
  return arr;
}

// TODO(Phase10): 実際の学習ログAPIに置き換え
export const personalDailyStats = buildDailyStats(90, 80, 0.35);
export const groupDailyStatsRecords = buildDailyStats(90, 80 * 12, 0.35);

export const RECORD_GOALS = {
  personal: { study: 90, speak: 30 },
  group: { study: 90 * 12, speak: 30 * 12 },
};

export type RecordScope = 'personal' | 'group';
export type RecordPeriod = 'day' | 'week' | 'month' | 'all';

export type ChartBucket = { label: string; studyMin: number; speakMin: number; days: number };

export function recordChartBuckets(scope: RecordScope, period: RecordPeriod, offset: number): ChartBucket[] {
  const arr = scope === 'personal' ? personalDailyStats : groupDailyStatsRecords;
  const WINDOW = period === 'day' ? 7 : period === 'week' ? 6 : Infinity;

  if (period === 'day') {
    const daily = arr.map((x) => ({
      label: ['日', '月', '火', '水', '木', '金', '土'][x.date.getDay()],
      studyMin: x.studyMin,
      speakMin: x.speakMin,
      days: 1,
    }));
    const end = Math.max(0, daily.length - offset * WINDOW);
    const start = Math.max(0, end - WINDOW);
    return daily.slice(start, end);
  }
  if (period === 'week') {
    const map: Record<string, ChartBucket> = {};
    const order: string[] = [];
    arr.forEach((x) => {
      const k = weekKey(x.date);
      if (!map[k]) {
        map[k] = { label: shortMd(mondayOf(x.date)), studyMin: 0, speakMin: 0, days: 0 };
        order.push(k);
      }
      map[k].studyMin += x.studyMin;
      map[k].speakMin += x.speakMin;
      map[k].days++;
    });
    const all = order.map((k) => map[k]);
    const end = Math.max(0, all.length - offset * WINDOW);
    const start = Math.max(0, end - WINDOW);
    return all.slice(start, end);
  }
  if (period === 'month') {
    const map: Record<string, ChartBucket> = {};
    const order: string[] = [];
    arr.forEach((x) => {
      const k = monthKey(x.date);
      if (!map[k]) {
        map[k] = { label: `${x.date.getMonth() + 1}月`, studyMin: 0, speakMin: 0, days: 0 };
        order.push(k);
      }
      map[k].studyMin += x.studyMin;
      map[k].speakMin += x.speakMin;
      map[k].days++;
    });
    return order.map((k) => map[k]);
  }
  // all
  const total = arr.reduce((a, x) => ({ studyMin: a.studyMin + x.studyMin, speakMin: a.speakMin + x.speakMin }), { studyMin: 0, speakMin: 0 });
  return [{ label: '全期間', studyMin: total.studyMin, speakMin: total.speakMin, days: arr.length }];
}

export function recordChartTotalBuckets(scope: RecordScope, period: RecordPeriod): number {
  if (period === 'day') return (scope === 'personal' ? personalDailyStats : groupDailyStatsRecords).length;
  if (period === 'week') {
    const set = new Set((scope === 'personal' ? personalDailyStats : groupDailyStatsRecords).map((x) => weekKey(x.date)));
    return set.size;
  }
  if (period === 'month') {
    const set = new Set((scope === 'personal' ? personalDailyStats : groupDailyStatsRecords).map((x) => monthKey(x.date)));
    return set.size;
  }
  return 1;
}

export type GroupMember = {
  id: string;
  name: string;
  weeklyStudyMin: number;
  weeklySpeakMin: number;
  speakingHistory: { date: Date; title: string }[];
};

const SPEAKING_LOG_TYPES = [
  'フリー練習（音読）',
  'フリー練習（英語ピッチ）',
  'フリー練習（発音練習）',
  'フリー練習（ロールプレイ）',
  'フリー練習（シャドーイング）',
  'シチュエーション別課題',
];

export const groupMembers: GroupMember[] = [
  { id: 'm1', name: '鈴木 花子', weeklyStudyMin: 410, weeklySpeakMin: 95 },
  { id: 'm2', name: '高橋 修', weeklyStudyMin: 280, weeklySpeakMin: 60 },
  { id: 'm3', name: '田村 美咲', weeklyStudyMin: 520, weeklySpeakMin: 140 },
  { id: 'm4', name: '伊藤 大輔', weeklyStudyMin: 190, weeklySpeakMin: 35 },
  { id: 'm5', name: '渡辺 亜美', weeklyStudyMin: 360, weeklySpeakMin: 80 },
].map((m, mi) => ({
  ...m,
  speakingHistory: Array.from({ length: 6 }).map((_, i) => ({
    date: addDays(new Date(), -i * 2),
    title: SPEAKING_LOG_TYPES[(i + mi) % SPEAKING_LOG_TYPES.length],
  })),
}));

const ALL_USERS_NAME_POOL = [
  '中村 早紀', '小林 陽介', '吉田 蓮', '山本 直樹', '加藤 沙織', '斎藤 拓也', '清水 美咲', '井上 大和',
  '木村 遥', '林 健二', '橋本 彩', '近藤 亮', '石田 優子', '村上 隼人', '原田 千尋', '松田 亮太',
  '藤田 恵', '岡田 翔', '西村 麻衣', '後藤 太一', '杉山 真央', '三浦 陸', '宮本 美穂', '長谷川 蓮',
  '福田 沙也', '酒井 光', '平野 美由紀', '高木 涼太', '大野 千夏', '中川 悠斗',
];
export const ALL_USERS_MOCK = ALL_USERS_NAME_POOL.map((name) => ({
  name,
  weeklyStudyMin: Math.round(120 + Math.random() * 520),
}));

export const OTHER_GROUPS_MOCK = [
  { name: 'bグループ', memberCount: 6, weeklyStudyMin: Math.round(1200 + Math.random() * 900) },
  { name: 'cグループ', memberCount: 4, weeklyStudyMin: Math.round(1200 + Math.random() * 900) },
  { name: 'dグループ', memberCount: 5, weeklyStudyMin: Math.round(1200 + Math.random() * 900) },
  { name: 'eグループ', memberCount: 7, weeklyStudyMin: Math.round(1200 + Math.random() * 900) },
  { name: 'fグループ', memberCount: 5, weeklyStudyMin: Math.round(1200 + Math.random() * 900) },
];

export function memberTotalForRankingPeriod(weeklyMin: number, period: RecordPeriod): number {
  if (period === 'day') return Math.round(weeklyMin / 7);
  if (period === 'week') return weeklyMin;
  if (period === 'month') return Math.round(weeklyMin * 4.3);
  return Math.round(weeklyMin * 12);
}

export function personalTotalForRankingPeriod(period: RecordPeriod): number {
  const arr = personalDailyStats;
  if (period === 'day') return arr[arr.length - 1].studyMin;
  if (period === 'week') return arr.slice(-7).reduce((a, x) => a + x.studyMin, 0);
  if (period === 'month') return arr.slice(-30).reduce((a, x) => a + x.studyMin, 0);
  return arr.reduce((a, x) => a + x.studyMin, 0);
}

// ---- calendar ----
export const STUDY_CATEGORIES = [
  { key: 'grammar', label: '文法', icon: 'create-outline' as const },
  { key: 'listening', label: 'リスニング', icon: 'headset-outline' as const },
  { key: 'speaking', label: 'スピーキング', icon: 'mic-outline' as const },
  { key: 'other', label: 'その他', icon: 'book-outline' as const },
];
export const STUDY_SUBCATEGORIES = ['単語暗記', '文法問題', 'リスニング教材', 'シャドーイング', 'MYフレーズ復習', 'その他'];

export type StudyLogEntry = { category: string; subcategories: string[]; minutes: number; memo: string };

export const studyLogEntries: Record<string, StudyLogEntry> = {};
personalDailyStats.forEach((x) => {
  if (x.date > new Date()) return;
  if (Math.random() < 0.78) {
    const cat = STUDY_CATEGORIES[Math.floor(Math.random() * STUDY_CATEGORIES.length)];
    const subs = STUDY_SUBCATEGORIES.filter(() => Math.random() < 0.4);
    studyLogEntries[dateKey(x.date)] = {
      category: cat.key,
      subcategories: subs.length ? subs : [STUDY_SUBCATEGORIES[0]],
      minutes: x.studyMin,
      memo: '',
    };
  }
});

// ---- unified speaking log ----
export type SpeakingLogItem = { date: Date; title: string; kind: 'other' | 'daily' | 'weekly' | 'monthly'; pass?: boolean };

const speakingHistoryLog: SpeakingLogItem[] = Array.from({ length: 22 }).map((_, i) => {
  const d = addDays(new Date(), -Math.floor(i * 1.4));
  d.setHours(8 + Math.floor(Math.random() * 14), Math.floor(Math.random() * 60));
  return { date: d, title: SPEAKING_LOG_TYPES[i % SPEAKING_LOG_TYPES.length] + (i % 5 === 0 ? ` DAY${89 - i}` : ''), kind: 'other' };
});

const dailyMissionResults = Array.from({ length: 10 }).map((_, idx) => {
  const d = 10 - idx;
  const day = addDays(new Date(), -d);
  return { day: 99 - d, date: day, pass: Math.random() > 0.2, type: Math.random() > 0.5 ? 'photo' : 'question' };
});

const weeklyAssignmentResults = Array.from({ length: 8 }).map((_, idx) => {
  const w = 8 - idx;
  const monday = mondayOf(addDays(new Date(), -w * 7));
  return { week: 14 - w, weekStart: monday, pass: Math.random() > 0.25 };
});

const monthlyMissionResults = Array.from({ length: 6 }).map((_, idx) => {
  const m = 6 - idx;
  const d = new Date();
  d.setMonth(d.getMonth() - m, 1);
  return { month: 8 - m, monthDate: d, pass: Math.random() > 0.2 };
});

export function buildUnifiedSpeakingLog(): SpeakingLogItem[] {
  const daily: SpeakingLogItem[] = dailyMissionResults.map((d) => ({
    date: d.date,
    title: `Dailyミッション（${d.type === 'photo' ? '写真描写' : '質問回答'}）DAY${d.day}`,
    kind: 'daily',
    pass: d.pass,
  }));
  const weekly: SpeakingLogItem[] = weeklyAssignmentResults.map((w) => ({
    date: w.weekStart,
    title: `Weeklyミッション WEEK${w.week}`,
    kind: 'weekly',
    pass: w.pass,
  }));
  const monthly: SpeakingLogItem[] = monthlyMissionResults.map((m) => ({
    date: m.monthDate,
    title: `Monthlyミッション MONTH${m.month}`,
    kind: 'monthly',
    pass: m.pass,
  }));
  return [...speakingHistoryLog, ...daily, ...weekly, ...monthly].sort((a, b) => b.date.getTime() - a.date.getTime());
}
