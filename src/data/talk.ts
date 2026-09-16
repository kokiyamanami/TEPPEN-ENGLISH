export type TalkKind = 'ai' | 'human' | 'official' | 'group';

export type TalkMessage = { from: 'me' | 'them'; sender?: string; text: string; time: string };

export type TalkThread = {
  key: string;
  name: string;
  kind: TalkKind;
  letter: string | null;
  color: string;
  callable: boolean;
  unread: number;
  bio: string;
  messages: TalkMessage[];
};

export const TALK_ORDER = ['groupchat', 'announce', 'justin', 'bob', 'sara', 'selen', 'tutor', 'tutor2', 'support'];

// TODO(Phase10): 実際のメッセージ配信・WebRTC通話基盤に置き換え
export const TALK_THREADS_SEED: Record<string, TalkThread> = {
  groupchat: {
    key: 'groupchat',
    name: 'aグループ',
    kind: 'group',
    letter: null,
    color: '#1D4A73',
    callable: false,
    unread: 2,
    bio: 'aグループのメンバーで交流できるグループチャットです。',
    messages: [
      { from: 'them', sender: '鈴木 花子', text: '今週のWeeklyミッション、もう提出した人いる？', time: '昨日 20:10' },
      { from: 'them', sender: '高橋 修', text: 'まだです…今夜やります！', time: '昨日 20:15' },
      { from: 'me', text: '私は今朝提出しました！質問回答の方、難しかったです', time: '昨日 20:22' },
      { from: 'them', sender: '田村 美咲', text: 'わかります、あれ結構考えさせられますよね', time: '今日 8:05' },
    ],
  },
  announce: {
    key: 'announce',
    name: '運営からのお知らせ',
    kind: 'official',
    letter: null,
    color: '#14365A',
    callable: false,
    unread: 1,
    bio: 'Base Camp運営からのお知らせを配信する公式アカウントです。こちらへの返信はできません。',
    messages: [
      { from: 'them', text: '【お知らせ】9/1よりフリー練習に「シャドーイング」カテゴリを追加しました。', time: '昨日' },
      { from: 'them', text: '来週のMonthlyミッション提出期限は9/7(月)23:59までです。お忘れなく！', time: '今日 9:02' },
    ],
  },
  justin: {
    key: 'justin',
    name: 'Justin（AI）',
    kind: 'ai',
    letter: 'J',
    color: '#E8825F',
    callable: true,
    unread: 2,
    bio: '英語で気軽にチャット・通話できるAI友達です。日常会話の練習相手にどうぞ。',
    messages: [
      { from: 'them', text: "Hey! Ready for today's speaking practice?", time: 'Today 8:10' },
      { from: 'them', text: 'By the way, your use of "circle back" in yesterday’s roleplay sounded really natural!', time: 'Today 8:11' },
    ],
  },
  bob: {
    key: 'bob',
    name: 'Bob（AI）',
    kind: 'ai',
    letter: 'B',
    color: '#2F5FA8',
    callable: true,
    unread: 1,
    bio: '英語で気軽にチャット・通話できるAI友達です。雑談から練習まで幅広く付き合ってくれます。',
    messages: [{ from: 'them', text: 'Hey! Long time no chat. How was your week?', time: 'Today 7:40' }],
  },
  sara: {
    key: 'sara',
    name: 'Sara（AI）',
    kind: 'ai',
    letter: 'S',
    color: '#8E4E9C',
    callable: true,
    unread: 0,
    bio: '英語で気軽にチャット・通話できるAI友達です。プレゼンやスピーチの練習にも付き合ってくれます。',
    messages: [{ from: 'them', text: "I heard you're working on a presentation. Want to practice the intro with me?", time: '昨日 21:05' }],
  },
  selen: {
    key: 'selen',
    name: 'セレン（AI）',
    kind: 'ai',
    letter: 'セ',
    color: '#2E7A66',
    callable: true,
    unread: 1,
    bio: '日本語で気軽にチャット・通話できるAI友達です。学習の相談や雑談にどうぞ。',
    messages: [{ from: 'them', text: 'こんにちは！今日も学習お疲れさまです。最近、英語の勉強で困っていることはありますか？', time: '今日 7:15' }],
  },
  tutor: {
    key: 'tutor',
    name: '田中コーチ',
    kind: 'human',
    letter: '田',
    color: '#1D4A73',
    callable: false,
    unread: 0,
    bio: 'あなたの専属コーチです。学習の進め方やMonthlyミッションについて相談できます。',
    messages: [{ from: 'them', text: '今週のMYピッチ提出お待ちしています。準備で困っていることがあればいつでもどうぞ。', time: '昨日 18:40' }],
  },
  tutor2: {
    key: 'tutor2',
    name: '佐藤チューター',
    kind: 'human',
    letter: '佐',
    color: '#1D4A73',
    callable: false,
    unread: 1,
    bio: 'あなたの専属チューターです。発音やイントネーションなど、細かい部分のフィードバックをしてくれます。',
    messages: [{ from: 'them', text: '先週のフリー練習の発音、かなり良くなってますね！次はイントネーションを一緒に見ていきましょう。', time: '今日 7:30' }],
  },
  support: {
    key: 'support',
    name: 'カスタマーサポート',
    kind: 'human',
    letter: 'サ',
    color: '#4B5A68',
    callable: false,
    unread: 0,
    bio: '不具合のご報告やご要望、操作方法のご質問など、お気軽にご連絡ください。',
    messages: [
      { from: 'them', text: 'いつもBase Campをご利用いただきありがとうございます。不具合やご要望、操作方法のご質問など、お気軽にこちらにメッセージしてください。', time: '先週' },
    ],
  },
};

export const KIND_LABEL: Record<TalkKind, (key: string) => string> = {
  ai: () => 'AI友達',
  human: (key) => (key === 'support' ? 'サポート' : 'コーチ・チューター'),
  official: () => '公式アカウント',
  group: () => 'グループチャット',
};
