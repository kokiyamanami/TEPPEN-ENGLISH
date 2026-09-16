import { createContext, ReactNode, useContext, useMemo, useState } from 'react';
import { CURRENT_TERM_LABEL, TERM_GOAL_HISTORY_SEED, TermGoal } from '../data/goals';

type GoalsContextValue = {
  studyGoal: number;
  speakGoal: number;
  setDailyGoals: (study: number, speak: number) => void;
  termGoalHistory: TermGoal[];
  addTermGoal: (goal: string) => void;
};

const GoalsContext = createContext<GoalsContextValue | null>(null);

export function GoalsProvider({ children }: { children: ReactNode }) {
  const [studyGoal, setStudyGoal] = useState(90);
  const [speakGoal, setSpeakGoal] = useState(30);
  const [termGoalHistory, setTermGoalHistory] = useState<TermGoal[]>(TERM_GOAL_HISTORY_SEED);

  const setDailyGoals = (study: number, speak: number) => {
    setStudyGoal(study);
    setSpeakGoal(speak);
  };

  const addTermGoal = (goal: string) => {
    const today = new Date();
    const setDate = `${today.getFullYear()}/${today.getMonth() + 1}/${today.getDate()}`;
    setTermGoalHistory((prev) => [...prev.map((g) => ({ ...g, current: false })), { term: CURRENT_TERM_LABEL, goal, setDate, current: true }]);
  };

  const value = useMemo(
    () => ({ studyGoal, speakGoal, setDailyGoals, termGoalHistory, addTermGoal }),
    [studyGoal, speakGoal, termGoalHistory]
  );

  return <GoalsContext.Provider value={value}>{children}</GoalsContext.Provider>;
}

export function useGoals() {
  const ctx = useContext(GoalsContext);
  if (!ctx) throw new Error('useGoals must be used within GoalsProvider');
  return ctx;
}
