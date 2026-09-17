export type Lecture = {
  id: string;
  youtubeId: string;
  title: string;
  instructor: string;
  category: string;
};

export function youtubeThumbnail(youtubeId: string) {
  return `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`;
}
