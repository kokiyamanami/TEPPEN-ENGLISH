export type PastGroup = { group: string; from: string; to: string; current: boolean; members: string[] };

// TODO(Phase10): 実際のグループ在籍履歴APIに置き換え
export const pastGroups: PastGroup[] = [
  { group: 'aグループ', from: '2026/1', to: '2026/4', current: false, members: ['鈴木 花子', '高橋 修', '中村 早紀', '小林 陽介'] },
  { group: 'cグループ', from: '2026/4', to: '2026/7', current: false, members: ['田村 美咲', '伊藤 大輔', '吉田 蓮'] },
  { group: 'aグループ', from: '2026/7', to: '現在', current: true, members: ['鈴木 花子', '高橋 修', '田村 美咲', '伊藤 大輔', '渡辺 亜美'] },
];
