import { Profile } from '../store/ProfileContext';

type FieldType = 'text' | 'textarea' | 'chips';

export type OnboardField = {
  type: FieldType;
  field: keyof Profile;
  label: string;
  options?: string[];
};

export type OnboardStep = {
  key: string;
  title: string;
  sub: string;
  fields: OnboardField[];
};

// 仕様書 1.2 オンボーディング5問（プロトタイプのonboardStepsと同一構成）
export const onboardSteps: OnboardStep[] = [
  {
    key: 'ob1',
    title: 'まずはあなたについて',
    sub: 'プロフィールはAIが教材を作る土台になります。後からいつでも編集できます。',
    fields: [
      { type: 'text', field: 'name', label: 'お名前' },
      { type: 'chips', field: 'gender', label: '性別', options: ['男性', '女性', '回答しない'] },
      { type: 'text', field: 'age', label: '年齢' },
      { type: 'chips', field: 'voiceGender', label: '読み上げ音声の性別', options: ['男性', '女性'] },
    ],
  },
  {
    key: 'ob2',
    title: 'お仕事について',
    sub: '業種・役職に合わせたビジネスシーン教材を自動生成します。',
    fields: [
      { type: 'text', field: 'job', label: '職業' },
      { type: 'text', field: 'position', label: '職位' },
      { type: 'textarea', field: 'jobDetail', label: '職業詳細' },
    ],
  },
  {
    key: 'ob3',
    title: 'あなたの人物像',
    sub: '性格や経歴を伝えるほど、自然な会話設問が作れます。',
    fields: [
      { type: 'textarea', field: 'personality', label: '性格' },
      { type: 'text', field: 'hobby', label: '趣味' },
      { type: 'textarea', field: 'career', label: '経歴' },
    ],
  },
  {
    key: 'ob4',
    title: '強み・実績',
    sub: '成功体験は、自信を持って話せる教材のネタになります。',
    fields: [
      { type: 'textarea', field: 'successStory', label: '成功体験' },
      { type: 'textarea', field: 'strengths', label: '強み・弱み' },
    ],
  },
  {
    key: 'ob5',
    title: 'このタームの目標',
    sub: 'ここが今回のゴールです。ダッシュボードの目標としても表示されます。',
    fields: [
      { type: 'textarea', field: 'futureCareer', label: 'キャリア（将来像）' },
      { type: 'textarea', field: 'workChallenge', label: '仕事課題' },
      { type: 'text', field: 'termGoal', label: '今タームの目標' },
    ],
  },
];

// 5プロフィールステップ + 1許可ステップ（obperm）
export const TOTAL_OB_STEPS = 6;
