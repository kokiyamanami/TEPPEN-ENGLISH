export type Lecture = {
  id: string;
  youtubeId: string;
  title: string;
  instructor: string;
  category: string;
};

// TEPPEN ENGLISH公式YouTubeチャンネルの実動画
// https://www.youtube.com/@TEPPENENGLISH/videos
export const LECTURES: Lecture[] = [
  {
    id: 'l1',
    youtubeId: 'HXH-qL4DltE',
    title: 'TOEIC700～800点でも話せない理由と仕事で使える英語へのロードマップ',
    instructor: 'TEPPEN ENGLISH',
    category: '学習法',
  },
  {
    id: 'l2',
    youtubeId: 'JYZVWfsASeU',
    title: '英語は何時間勉強すれば話せる？本当に大切なのは時間ではありません',
    instructor: 'TEPPEN ENGLISH',
    category: '学習法',
  },
  {
    id: 'l3',
    youtubeId: 'Ae0dyicbGsw',
    title: 'ビジネス英語とは？本当に必要なレベルを解説します',
    instructor: 'TEPPEN ENGLISH',
    category: 'ビジネス英語',
  },
  {
    id: 'l4',
    youtubeId: '7ld-qzNW_-s',
    title: '「I think…」ばかりになっていませんか？同じ表現の繰り返しから抜け出す方法',
    instructor: 'TEPPEN ENGLISH',
    category: 'スピーキング',
  },
  {
    id: 'l5',
    youtubeId: 'mONOTQydDDw',
    title: '通勤時間だけで英語が話せるようになる「独り言英語」',
    instructor: 'TEPPEN ENGLISH',
    category: 'スピーキング',
  },
];

export function youtubeThumbnail(youtubeId: string) {
  return `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`;
}
