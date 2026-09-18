import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { apiGet } from '../api/mobileAuth';
import { dateKey } from '../utils/dateHelpers';
import { useSession } from './SessionContext';

type StatsContextValue = {
  totalStudyMinutes: number;
  todayStudyMinutes: number;
  todaySpeakMinutes: number;
  reload: () => void;
};

const StatsContext = createContext<StatsContextValue | null>(null);

// トレーニング画面の登頂標高（1時間の学習=1M）は、この累計学習時間から算出する
export function StatsProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useSession();
  const [totalStudyMinutes, setTotalStudyMinutes] = useState(0);
  const [todayStudyMinutes, setTodayStudyMinutes] = useState(0);
  const [todaySpeakMinutes, setTodaySpeakMinutes] = useState(0);

  const reload = () => {
    apiGet<{ totalStudyMinutes: number; todayStudyMinutes: number; todaySpeakMinutes: number }>(`/study-summary?today=${dateKey(new Date())}`)
      .then((res) => {
        setTotalStudyMinutes(res.totalStudyMinutes);
        setTodayStudyMinutes(res.todayStudyMinutes);
        setTodaySpeakMinutes(res.todaySpeakMinutes);
      })
      .catch(() => {});
  };

  useEffect(() => {
    if (isAuthenticated) reload();
    else {
      setTotalStudyMinutes(0);
      setTodayStudyMinutes(0);
      setTodaySpeakMinutes(0);
    }
  }, [isAuthenticated]);

  return <StatsContext.Provider value={{ totalStudyMinutes, todayStudyMinutes, todaySpeakMinutes, reload }}>{children}</StatsContext.Provider>;
}

export function useStats() {
  const ctx = useContext(StatsContext);
  if (!ctx) throw new Error('useStats must be used within StatsProvider');
  return ctx;
}
