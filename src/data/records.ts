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

export type RecordScope = 'personal' | 'group';
export type RecordPeriod = 'day' | 'week' | 'month' | 'all';

export type ChartBucket = { label: string; studyMin: number; speakMin: number; days: number };

export function recordChartBuckets(scope: RecordScope, period: RecordPeriod, offset: number, personalData?: DailyStat[]): ChartBucket[] {
  const arr = scope === 'personal' ? personalData ?? personalDailyStats : groupDailyStatsRecords;
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

export function recordChartTotalBuckets(scope: RecordScope, period: RecordPeriod, personalData?: DailyStat[]): number {
  const personalArr = personalData ?? personalDailyStats;
  if (period === 'day') return (scope === 'personal' ? personalArr : groupDailyStatsRecords).length;
  if (period === 'week') {
    const set = new Set((scope === 'personal' ? personalArr : groupDailyStatsRecords).map((x) => weekKey(x.date)));
    return set.size;
  }
  if (period === 'month') {
    const set = new Set((scope === 'personal' ? personalArr : groupDailyStatsRecords).map((x) => monthKey(x.date)));
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

// ランキングの全ユーザー/他グループデータはバックエンド(/api/ranking)から取得する。
// 以下はオフライン等でAPIが取得できなかった場合のフォールバック値（固定・非ランダム）
export const ALL_USERS_MOCK_FALLBACK = [
  { name: '中村 早紀', weeklyStudyMin: 612 },
  { name: '小林 陽介', weeklyStudyMin: 145 },
  { name: '吉田 蓮', weeklyStudyMin: 388 },
  { name: '山本 直樹', weeklyStudyMin: 522 },
  { name: '加藤 沙織', weeklyStudyMin: 201 },
  { name: '斎藤 拓也', weeklyStudyMin: 467 },
  { name: '清水 美咲', weeklyStudyMin: 333 },
  { name: '井上 大和', weeklyStudyMin: 289 },
  { name: '木村 遥', weeklyStudyMin: 578 },
  { name: '林 健二', weeklyStudyMin: 176 },
  { name: '橋本 彩', weeklyStudyMin: 421 },
  { name: '近藤 亮', weeklyStudyMin: 254 },
  { name: '石田 優子', weeklyStudyMin: 495 },
  { name: '村上 隼人', weeklyStudyMin: 312 },
  { name: '原田 千尋', weeklyStudyMin: 158 },
  { name: '松田 亮太', weeklyStudyMin: 440 },
  { name: '藤田 恵', weeklyStudyMin: 367 },
  { name: '岡田 翔', weeklyStudyMin: 229 },
  { name: '西村 麻衣', weeklyStudyMin: 503 },
  { name: '後藤 太一', weeklyStudyMin: 194 },
  { name: '杉山 真央', weeklyStudyMin: 356 },
  { name: '三浦 陸', weeklyStudyMin: 271 },
  { name: '宮本 美穂', weeklyStudyMin: 488 },
  { name: '長谷川 蓮', weeklyStudyMin: 132 },
  { name: '福田 沙也', weeklyStudyMin: 399 },
  { name: '酒井 光', weeklyStudyMin: 245 },
  { name: '平野 美由紀', weeklyStudyMin: 561 },
  { name: '高木 涼太', weeklyStudyMin: 218 },
  { name: '大野 千夏', weeklyStudyMin: 305 },
  { name: '中川 悠斗', weeklyStudyMin: 452 },
];

export const OTHER_GROUPS_MOCK_FALLBACK = [
  { name: 'bグループ', memberCount: 6, weeklyStudyMin: 1840 },
  { name: 'cグループ', memberCount: 4, weeklyStudyMin: 1420 },
  { name: 'dグループ', memberCount: 5, weeklyStudyMin: 1965 },
  { name: 'eグループ', memberCount: 7, weeklyStudyMin: 2210 },
  { name: 'fグループ', memberCount: 5, weeklyStudyMin: 1580 },
];

export function memberTotalForRankingPeriod(weeklyMin: number, period: RecordPeriod): number {
  if (period === 'day') return Math.round(weeklyMin / 7);
  if (period === 'week') return weeklyMin;
  if (period === 'month') return Math.round(weeklyMin * 4.3);
  return Math.round(weeklyMin * 12);
}

export function personalTotalForRankingPeriod(period: RecordPeriod, personalData?: DailyStat[]): number {
  const arr = personalData ?? personalDailyStats;
  if (arr.length === 0) return 0;
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

export type StudyLogEntry = { id?: number; category: string; subcategories: string[]; minutes: number; memo: string };

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
// kind:'daily'|'weekly'|'monthly'は /api/mobile/mission-history の実データ、
// kind:'other'（フリー練習）は永続化テーブルが未実装のためまだモック
export type SpeakingLogItem = { date: Date; title: string; kind: 'other' | 'daily' | 'weekly' | 'monthly'; pass?: boolean };

export const FREE_PRACTICE_LOG_MOCK: SpeakingLogItem[] = Array.from({ length: 22 }).map((_, i) => {
  const d = addDays(new Date(), -Math.floor(i * 1.4));
  d.setHours(8 + Math.floor(Math.random() * 14), Math.floor(Math.random() * 60));
  return { date: d, title: SPEAKING_LOG_TYPES[i % SPEAKING_LOG_TYPES.length] + (i % 5 === 0 ? ` DAY${89 - i}` : ''), kind: 'other' };
});
