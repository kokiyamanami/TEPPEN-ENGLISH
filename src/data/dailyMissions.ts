export type DailyMissionType = 'photo' | 'question';

export type DailyMission = {
  label: string;
  prompt: string;
  promptJP: string;
  sampleEN: string;
  sampleJP: string;
};

export const DAILY_MISSIONS: Record<DailyMissionType, DailyMission> = {
  photo: {
    label: '写真描写ミッション',
    prompt: 'Describe the picture below.',
    promptJP: '写真を見て、状況を英語で説明してください。',
    sampleEN:
      'This photo shows a busy open-plan office where several people are working at their desks. In the foreground, a woman is looking at her laptop screen while talking on the phone. Behind her, two colleagues appear to be discussing something in front of a whiteboard covered in sticky notes. The overall atmosphere looks focused but collaborative.',
    sampleJP:
      'この写真には、何人かがデスクで作業しているオープンオフィスが写っています。手前の女性はノートパソコンの画面を見ながら電話で話しています。その後ろでは、2人の同僚がふせんだらけのホワイトボードの前で何かを話し合っているようです。全体的に集中しつつも協力的な雰囲気が伝わってきます。',
  },
  question: {
    label: '質問回答ミッション',
    prompt: "What's one skill you'd like to improve this year, and why?",
    promptJP: '今年伸ばしたいスキルを1つ挙げるとしたら何ですか？その理由も教えてください。',
    sampleEN:
      "One skill I'd like to improve this year is public speaking. In my current role, I'm often asked to present ideas to senior stakeholders, and I sometimes feel less confident than I'd like when speaking in front of a large group. I think improving this skill would help me communicate my ideas more clearly and make a stronger impression in important meetings.",
    sampleJP:
      '今年伸ばしたいスキルは人前で話す力です。今の仕事では上層部にアイデアをプレゼンする機会が多いのですが、大人数の前で話すときに自信を持てないことがあります。このスキルを伸ばせば、自分の考えをより明確に伝えられ、重要な会議でより強い印象を残せると思います。',
  },
};

// TODO(Phase10): STT+LLMによる実添削に置き換え。現状は固定コメントからランダム表示
export const AI_FEEDBACK_POOL = [
  { pass: true, comment: '文法・語彙ともに正確で、内容も具体的に伝わりました。' },
  { pass: true, comment: '話す速度がちょうど良く、聞き取りやすい発話でした。' },
  { pass: false, comment: '内容は伝わりましたが、途中で言葉に詰まる箇所がありました。もう一度挑戦してみましょう。' },
];

export function randomFeedback() {
  return AI_FEEDBACK_POOL[Math.floor(Math.random() * AI_FEEDBACK_POOL.length)];
}
