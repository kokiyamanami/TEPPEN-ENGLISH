export type Lecture = {
  id: string;
  title: string;
  instructor: string;
  duration: string;
  category: string;
  color: string;
};

// TODO(Phase10): 実講座動画への差し替え
export const LECTURES: Lecture[] = [
  { id: 'l1', title: 'ビジネス英語の基礎：メールの書き方', instructor: '田中コーチ', duration: '12:34', category: 'ライティング', color: '#1D4A73' },
  { id: 'l2', title: '会議で使える便利フレーズ集', instructor: '佐藤チューター', duration: '8:20', category: 'スピーキング', color: '#E8825F' },
  { id: 'l3', title: '発音矯正：LとRの違いを克服する', instructor: '田中コーチ', duration: '15:02', category: '発音', color: '#4CA98C' },
  { id: 'l4', title: 'プレゼンの構成：伝わる話し方の型', instructor: '佐藤チューター', duration: '10:47', category: 'スピーキング', color: '#8E4E9C' },
  { id: 'l5', title: 'ビジネスシーンの敬語表現まとめ', instructor: '田中コーチ', duration: '9:15', category: 'ライティング', color: '#4B5A68' },
];

export const LECTURE_SAMPLE_VIDEO = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
