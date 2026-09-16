export type UnitStatus = 'locked' | 'current' | 'done';

export type UnitNode = {
  unit: number;
  altitudeM: number;
  status: UnitStatus;
  progress?: string;
};

// TODO(Phase10): ユーザーの実際の進捗データに置き換え
export const UNIT_MAP: UnitNode[] = [
  { unit: 12, altitudeM: 3000, status: 'locked' },
  { unit: 11, altitudeM: 2600, status: 'locked' },
  { unit: 10, altitudeM: 2140, status: 'current', progress: 'DAY 2 / 5 進行中' },
  { unit: 9, altitudeM: 1800, status: 'done' },
  { unit: 8, altitudeM: 1500, status: 'done' },
  { unit: 7, altitudeM: 1200, status: 'done' },
];

export const UNIT_DRILL_DAYS = ['DAY1', 'DAY2', 'DAY3', 'DAY4', 'DAY5'];

export type DrillSentence = { jp: string; en: string };

// TODO(Phase10): ユニット・日ごとの実教材データに置き換え
export const UNIT_DRILL_SENTENCES: DrillSentence[] = [
  { jp: '来週の会議の議題を教えてください。', en: 'Could you tell me the agenda for next week’s meeting?' },
  { jp: 'その提案について検討させてください。', en: 'Please let me consider that proposal.' },
];
