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
  recommendMin?: number; // これより短いとやさしく追記をお願いする（エラーにはしない）
  placeholder?: string; // 入力例（薄く表示）
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
const FREE_TEXT_RECOMMEND = 60;

// 仕様書 1.2 オンボーディング5問（プロトタイプのonboardStepsと同一構成）
export const onboardSteps: OnboardStep[] = [
  {
    key: 'ob1',
    title: 'まずはあなたについて',
    sub: 'プロフィールはAIが教材を作る土台になります。後からいつでも編集できます。',
    fields: [
      { type: 'text', field: 'name', label: 'お名前', placeholder: '例）山田 太郎' },
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
      { type: 'multi', field: 'job', label: '職業', options: JOB_OPTIONS, placeholder: '例）法務、物流（選択肢にない場合）' },
      { type: 'multi', field: 'position', label: '職位', options: POSITION_OPTIONS, single: true },
      { type: 'textarea', field: 'jobDetail', label: '職業詳細', placeholder: '例）BtoB SaaSの法人営業として、製造業のお客様を10社担当しています。提案資料の作成から契約後のフォローまで一貫して行っており、最近は海外拠点の担当者とオンライン会議をする機会が増えました。英語での説明や質疑応答に自信を持ちたいです。', maxLength: FREE_TEXT_MAX, recommendMin: FREE_TEXT_RECOMMEND },
    ],
  },
  {
    key: 'ob3',
    title: 'あなたの人物像',
    sub: '性格や経歴を伝えるほど、自然な会話設問が作れます。',
    fields: [
      { type: 'textarea', field: 'personality', label: '性格', placeholder: '例）慎重で、まず相手の話をよく聞いてから考えるタイプです。初対面では口数が少なめですが、慣れると冗談も言います。頼まれたことは最後までやり切る責任感があり、一方で急な変更には焦ってしまうことがあります。', maxLength: FREE_TEXT_MAX, recommendMin: FREE_TEXT_RECOMMEND },
      { type: 'multi', field: 'hobby', label: '趣味', options: HOBBY_OPTIONS, placeholder: '例）釣り、サウナ（選択肢にない場合）' },
      { type: 'textarea', field: 'career', label: '経歴', placeholder: '例）新卒で商社に入社し、5年間アジア向けの海外営業を担当しました。2022年に現職のIT企業へ転職し、法人営業チームのリーダーを務めています。海外出張は年2回ほどで、英語は主にメールと簡単な会議で使ってきました。', maxLength: FREE_TEXT_MAX, recommendMin: FREE_TEXT_RECOMMEND },
    ],
  },
  {
    key: 'ob4',
    title: '強み・実績',
    sub: '成功体験は、自信を持って話せる教材のネタになります。',
    fields: [
      { type: 'textarea', field: 'successStory', label: '成功体験', placeholder: '例）新規開拓に力を入れ、年間目標の120%を達成して社内表彰を受けました。きっかけは、お客様の課題を丁寧にヒアリングして、他社にはない提案を出せたことです。チームにも進め方を共有し、部署全体の受注が伸びました。', maxLength: FREE_TEXT_MAX, recommendMin: FREE_TEXT_RECOMMEND },
      { type: 'textarea', field: 'strengths', label: '強み・弱み', placeholder: '例）強み: 相手の課題を引き出す質問力と、資料を分かりやすくまとめる力です。弱み: 急に意見を求められると英語が出てこないことと、完璧を求めて発言をためらってしまうことです。', maxLength: FREE_TEXT_MAX, recommendMin: FREE_TEXT_RECOMMEND },
    ],
  },
  {
    key: 'ob5',
    title: 'キャリアと今の課題',
    sub: '将来像や課題感を伝えるほど、教材の質が上がります。',
    fields: [
      { type: 'textarea', field: 'futureCareer', label: 'キャリア（将来像）', placeholder: '例）3年後に海外拠点のマネージャーとして、現地チームを率いたいです。英語で自分の考えを伝えながら、現地のメンバーと信頼関係を築き、日本と海外の橋渡し役として事業の成長に貢献したいと考えています。', maxLength: FREE_TEXT_MAX, recommendMin: FREE_TEXT_RECOMMEND },
      { type: 'textarea', field: 'workChallenge', label: '仕事課題', placeholder: '例）英語の会議で議論のスピードについていけず、発言のタイミングを逃してしまいます。また、海外のお客様への提案では、伝えたいニュアンスが英語でうまく表現できず、説得力が弱くなっていると感じています。', maxLength: FREE_TEXT_MAX, recommendMin: FREE_TEXT_RECOMMEND },
    ],
  },
];

// 5プロフィールステップ + 1許可ステップ（obperm）
export const TOTAL_OB_STEPS = 6;
