import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { apiGet } from '../api/mobileAuth';
import { Lecture } from '../data/lectures';
import { useLiveRefresh } from '../hooks/useLiveRefresh';

type LectureContextValue = {
  lectures: Lecture[];
  loading: boolean;
  watchedIds: Set<string>;
  markWatched: (id: string) => void;
  reload: (silent?: boolean) => void;
};

const LectureContext = createContext<LectureContextValue | null>(null);

export function LectureProvider({ children }: { children: ReactNode }) {
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [loading, setLoading] = useState(true);
  const [watchedIds, setWatchedIds] = useState<Set<string>>(new Set());

  // 管理画面で登録された動画一覧をサーバーから取得。silent=trueの時は既存表示を維持したまま裏で更新する
  const reload = (silent = false) => {
    if (!silent) setLoading(true);
    apiGet<Lecture[]>('/lectures')
      .then(setLectures)
      .catch(() => {
        if (!silent) setLectures([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    reload();
  }, []);

  useLiveRefresh(() => reload(true));

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
