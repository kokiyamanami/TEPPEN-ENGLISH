import { createContext, ReactNode, useContext, useState } from 'react';

type LectureContextValue = {
  watchedIds: Set<string>;
  markWatched: (id: string) => void;
};

const LectureContext = createContext<LectureContextValue | null>(null);

export function LectureProvider({ children }: { children: ReactNode }) {
  const [watchedIds, setWatchedIds] = useState<Set<string>>(new Set());

  const markWatched = (id: string) => {
    setWatchedIds((prev) => new Set(prev).add(id));
  };

  return <LectureContext.Provider value={{ watchedIds, markWatched }}>{children}</LectureContext.Provider>;
}

export function useLectures() {
  const ctx = useContext(LectureContext);
  if (!ctx) throw new Error('useLectures must be used within LectureProvider');
  return ctx;
}
