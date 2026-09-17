import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { apiGet } from '../api/mobileAuth';
import { Lecture } from '../data/lectures';

type LectureContextValue = {
  lectures: Lecture[];
  loading: boolean;
  watchedIds: Set<string>;
  markWatched: (id: string) => void;
  reload: () => void;
};

const LectureContext = createContext<LectureContextValue | null>(null);

export function LectureProvider({ children }: { children: ReactNode }) {
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [loading, setLoading] = useState(true);
  const [watchedIds, setWatchedIds] = useState<Set<string>>(new Set());

  // 管理画面で登録された動画一覧をサーバーから取得
  const reload = () => {
    setLoading(true);
    apiGet<Lecture[]>('/lectures')
      .then(setLectures)
      .catch(() => setLectures([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    reload();
  }, []);

  const markWatched = (id: string) => {
    setWatchedIds((prev) => new Set(prev).add(id));
  };

  return (
    <LectureContext.Provider value={{ lectures, loading, watchedIds, markWatched, reload }}>{children}</LectureContext.Provider>
  );
}

export function useLectures() {
  const ctx = useContext(LectureContext);
  if (!ctx) throw new Error('useLectures must be used within LectureProvider');
  return ctx;
}
