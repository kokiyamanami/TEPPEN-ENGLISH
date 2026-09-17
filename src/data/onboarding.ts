import { Profile } from '../store/ProfileContext';

type FieldType = 'text' | 'textarea' | 'chips' | 'slider' | 'multi';

export type OnboardField = {
  type: FieldType;
  field: keyof Profile;
  label: string;
  options?: string[];
  min?: number;
  max?: number;
  maxLength?: number;
  single?: boolean; // type:'multi'で、実質1つしか選べないようにする場合true（例: 職位）
};

export type OnboardStep = {
  key: string;
  title: string;
  sub: string;
  fields: OnboardField[];
};

export const JOB_OPTIONS = ['営業', 'マーケティング', 'エンジニア', '人事', '経理・財務', '企画', 'カスタマーサポート', 'コンサルタント', '経営・役員'];
export const POSITION_OPTIONS = ['一般社員', '主任', '係長', '課長', '部長', 'マネージャー', '執行役員', '経営層'];
export const HOBBY_OPTIONS = ['読書', '映画鑑賞', '旅行', 'スポーツ観戦', 'ゴルフ', '料理', '音楽', 'ゲーム', 'カフェ巡り', 'ランニング', 'ヨガ', '写真'];

const FREE_TEXT_MAX = 200;

// 仕様書 1.2 オンボーディング5問（プロトタイプのonboardStepsと同一構成）
export const onboardSteps: OnboardStep[] = [
  {
    key: 'ob1',
    title: 'まずはあなたについて',
    sub: 'プロフィールはAIが教材を作る土台になります。後からいつでも編集できます。',
    fields: [
      { type: 'text', field: 'name', label: 'お名前' },
      { type: 'chips', field: 'gender', label: '性別', options: ['男性', '女性', '回答しない'] },
      { type: 'slider', field: 'age', label: '年齢', min: 18, max: 70 },
      { type: 'chips', field: 'voiceGender', label: '読み上げ音声の性別', options: ['男性', '女性'] },
    ],
  },
  {
    key: 'ob2',
    title: 'お仕事について',
    sub: '業種・役職に合わせたビジネスシーン教材を自動生成します。選択肢になければ自由入力もできます（複数選択可）。',
    fields: [
      { type: 'multi', field: 'job', label: '職業', options: JOB_OPTIONS },
      { type: 'multi', field: 'position', label: '職位', options: POSITION_OPTIONS, single: true },
      { type: 'textarea', field: 'jobDetail', label: '職業詳細', maxLength: FREE_TEXT_MAX },
    ],
  },
  {
    key: 'ob3',
    title: 'あなたの人物像',
    sub: '性格や経歴を伝えるほど、自然な会話設問が作れます。',
    fields: [
      { type: 'textarea', field: 'personality', label: '性格', maxLength: FREE_TEXT_MAX },
      { type: 'multi', field: 'hobby', label: '趣味', options: HOBBY_OPTIONS },
      { type: 'textarea', field: 'career', label: '経歴', maxLength: FREE_TEXT_MAX },
    ],
  },
  {
    key: 'ob4',
    title: '強み・実績',
    sub: '成功体験は、自信を持って話せる教材のネタになります。',
    fields: [
      { type: 'textarea', field: 'successStory', label: '成功体験', maxLength: FREE_TEXT_MAX },
      { type: 'textarea', field: 'strengths', label: '強み・弱み', maxLength: FREE_TEXT_MAX },
    ],
  },
  {
    key: 'ob5',
    title: 'キャリアと今の課題',
    sub: '将来像や課題感を伝えるほど、教材の質が上がります。',
    fields: [
      { type: 'textarea', field: 'futureCareer', label: 'キャリア（将来像）', maxLength: FREE_TEXT_MAX },
      { type: 'textarea', field: 'workChallenge', label: '仕事課題', maxLength: FREE_TEXT_MAX },
    ],
  },
];

// 5プロフィールステップ + 1許可ステップ（obperm）
export const TOTAL_OB_STEPS = 6;
