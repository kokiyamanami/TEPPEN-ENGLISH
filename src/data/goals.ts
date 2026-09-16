export type TermGoal = { term: string; goal: string; setDate: string; current?: boolean };

// TODO(Phase10): 実際のターム管理APIに置き換え
export const TERM_GOAL_HISTORY_SEED: TermGoal[] = [
  { term: 'Phase 1 · Term 1', goal: 'まずは日常会話に慣れる', setDate: '2026/1/6' },
  { term: 'Phase 2 · Term 1', goal: '職場の簡単なやり取りを英語でできるようにする', setDate: '2026/4/6' },
  { term: 'Phase 3 · Term 1', goal: '会議で自分の意見を英語で発言できるようにする', setDate: '2026/7/6' },
  { term: 'Phase 3 · Term 2', goal: '商談を英語で完結', setDate: '2026/9/1', current: true },
];

export const CURRENT_TERM_LABEL = 'Phase 3 · Term 2';
