import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { apiDelete, apiGet, apiPost, apiPut } from '../api/mobileAuth';
import { CURRENT_TERM_LABEL, TERM_GOAL_HISTORY_SEED, TermGoal } from '../data/goals';
import { dateKey } from '../utils/dateHelpers';
import { DEFAULT_GOAL, GoalPoint } from '../utils/streak';
import { useSession } from './SessionContext';

type GoalsPayload = { current: { study: number; speak: number }; history: GoalPoint[]; restDays: string[]; restLimitPerMonth: number };

type GoalsContextValue = {
  studyGoal: number;
  speakGoal: number;
  goalHistory: GoalPoint[];
  restDays: string[];
  restLimitPerMonth: number;
  setDailyGoals: (study: number, speak: number) => void;
  setRestDay: (date: string, on: boolean) => Promise<void>;
  termGoalHistory: TermGoal[];
  addTermGoal: (goal: string) => void;
};

const GoalsContext = createContext<GoalsContextValue | null>(null);

export function GoalsProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useSession();
  const [goals, setGoals] = useState<GoalsPayload>({ current: DEFAULT_GOAL, history: [], restDays: [], restLimitPerMonth: 4 });
  const [termGoalHistory, setTermGoalHistory] = useState<TermGoal[]>(TERM_GOAL_HISTORY_SEED);

  useEffect(() => {
    if (isAuthenticated) apiGet<GoalsPayload>('/goals').then(setGoals).catch(() => {});
    else setGoals({ current: DEFAULT_GOAL, history: [], restDays: [], restLimitPerMonth: 4 });
  }, [isAuthenticated]);

  const setDailyGoals = useCallback((study: number, speak: number) => {
    apiPut<GoalsPayload>('/goals', { studyGoal: study, speakGoal: speak, today: dateKey(new Date()) })
      .then(setGoals)
      .catch(() => {});
  }, []);

  // 失敗時はサーバーのエラーコード（limit_reached など）をメッセージにして投げる
  const setRestDay = useCallback(async (date: string, on: boolean) => {
    const today = dateKey(new Date());
    try {
      const next = on
        ? await apiPost<GoalsPayload>('/rest-days', { date, today })
        : await apiDelete<GoalsPayload>(`/rest-days/${date}?today=${today}`);
      setGoals(next);
    } catch (e) {
      const status = String((e as Error).message);
      throw new Error(status.includes('(400)') ? 'rejected' : 'network');
    }
  }, []);

  const addTermGoal = (goal: string) => {
    const today = new Date();
    const setDate = `${today.getFullYear()}/${today.getMonth() + 1}/${today.getDate()}`;
    setTermGoalHistory((prev) => [...prev.map((g) => ({ ...g, current: false })), { term: CURRENT_TERM_LABEL, goal, setDate, current: true }]);
  };

  const value = useMemo(
    () => ({
      studyGoal: goals.current.study,
      speakGoal: goals.current.speak,
      goalHistory: goals.history,
      restDays: goals.restDays,
      restLimitPerMonth: goals.restLimitPerMonth,
      setDailyGoals,
      setRestDay,
      termGoalHistory,
      addTermGoal,
    }),
    [goals, termGoalHistory, setDailyGoals, setRestDay]
  );

  return <GoalsContext.Provider value={value}>{children}</GoalsContext.Provider>;
}

export function useGoals() {
  const ctx = useContext(GoalsContext);
  if (!ctx) throw new Error('useGoals must be used within GoalsProvider');
  return ctx;
}
