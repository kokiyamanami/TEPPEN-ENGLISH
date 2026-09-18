import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { apiGet } from '../api/mobileAuth';
import { Lecture } from '../data/lectures';
import { useLiveRefresh } from '../hooks/useLiveRefresh';
import { useSession } from './SessionContext';

type LectureContextValue = {
  lectures: Lecture[];
  loading: boolean;
  watchedIds: Set<string>;
  markWatched: (id: string) => void;
  reload: (silent?: boolean) => void;
};

const LectureContext = createContext<LectureContextValue | null>(null);

export function LectureProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useSession();
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

  // 未ログインの間は取得が401になるため、ログイン（またはセッション復元）後に取得し直す。
  // ログアウト時は前のアカウントの視聴済み表示が残らないようクリアする
  useEffect(() => {
    if (isAuthenticated) reload();
    else setWatchedIds(new Set());
  }, [isAuthenticated]);

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
