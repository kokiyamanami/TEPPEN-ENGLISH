export type Milestone = { order: number; name: string; altitudeM: number };

// 仕様書 2.1 登頂ギミック（ASCENT_MILESTONES）
export const ASCENT_MILESTONES: Milestone[] = [
  { order: 1, name: 'キリン', altitudeM: 5 },
  { order: 2, name: '金閣寺（舎利殿）', altitudeM: 12.5 },
  { order: 3, name: '大阪城（天守閣）', altitudeM: 58 },
  { order: 4, name: '通天閣', altitudeM: 108 },
  { order: 5, name: '東京タワー', altitudeM: 333 },
  { order: 6, name: '東京スカイツリー', altitudeM: 634 },
  { order: 7, name: '六甲山', altitudeM: 931 },
  { order: 8, name: '富士山', altitudeM: 3776 },
  { order: 9, name: 'キリマンジャロ', altitudeM: 5895 },
  { order: 10, name: 'エベレスト', altitudeM: 8848 },
];

// TODO(Phase10): 実データ（累計学習時間）に置き換え
export const MOCK_TOTAL_STUDY_MINUTES = 620;

export function getCurrentAltitudeM(totalMinutes: number): number {
  return Math.round(totalMinutes / 60);
}

export function getNextMilestone(altitudeM: number): Milestone | null {
  return ASCENT_MILESTONES.find((m) => m.altitudeM > altitudeM) ?? null;
}
