export type Milestone = { order: number; name: string; altitudeM: number; image: string };

// 仕様書 2.1 登頂ギミック（ASCENT_MILESTONES）
// imageはサーバーの /milestones/{order}.png（AI生成のイラスト）を指す
export const ASCENT_MILESTONES: Milestone[] = [
  { order: 1, name: 'キリン', altitudeM: 5, image: '/milestones/1.png' },
  { order: 2, name: '金閣寺（舎利殿）', altitudeM: 12.5, image: '/milestones/2.png' },
  { order: 3, name: '大阪城（天守閣）', altitudeM: 58, image: '/milestones/3.png' },
  { order: 4, name: '通天閣', altitudeM: 108, image: '/milestones/4.png' },
  { order: 5, name: '東京タワー', altitudeM: 333, image: '/milestones/5.png' },
  { order: 6, name: '東京スカイツリー', altitudeM: 634, image: '/milestones/6.png' },
  { order: 7, name: '六甲山', altitudeM: 931, image: '/milestones/7.png' },
  { order: 8, name: '富士山', altitudeM: 3776, image: '/milestones/8.png' },
  { order: 9, name: 'キリマンジャロ', altitudeM: 5895, image: '/milestones/9.png' },
  { order: 10, name: 'エベレスト', altitudeM: 8848, image: '/milestones/10.png' },
];

// TODO(Phase10): 実データ（累計学習時間）に置き換え
export const MOCK_TOTAL_STUDY_MINUTES = 620;

export function getCurrentAltitudeM(totalMinutes: number): number {
  return Math.round(totalMinutes / 60);
}

export function getNextMilestone(altitudeM: number): Milestone | null {
  return ASCENT_MILESTONES.find((m) => m.altitudeM > altitudeM) ?? null;
}

export function getPrevMilestone(altitudeM: number): Milestone | null {
  return [...ASCENT_MILESTONES].reverse().find((m) => m.altitudeM <= altitudeM) ?? null;
}

export const ASCENT_SUMMIT_M = ASCENT_MILESTONES[ASCENT_MILESTONES.length - 1].altitudeM;

export type PathPoint = { x: number; y: number };

// 仕様書2.1: SVGで山の稜線＋点線の登山ルートを描画。viewBox 0 0 260 420 を想定
export const ASCENT_PATH: PathPoint[] = [
  { x: 44, y: 392 },
  { x: 104, y: 320 },
  { x: 56, y: 238 },
  { x: 132, y: 168 },
  { x: 78, y: 96 },
  { x: 150, y: 26 },
];

export function pointAlongAscentPath(t: number): PathPoint {
  const clamped = Math.max(0, Math.min(1, t));
  const segs = ASCENT_PATH.length - 1;
  const scaled = clamped * segs;
  const i = Math.min(segs - 1, Math.floor(scaled));
  const lt = scaled - i;
  const a = ASCENT_PATH[i];
  const b = ASCENT_PATH[i + 1];
  return { x: a.x + (b.x - a.x) * lt, y: a.y + (b.y - a.y) * lt };
}
