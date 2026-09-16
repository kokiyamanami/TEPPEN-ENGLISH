export type DialogueLine = { from: 'me' | 'them'; text: string; textJP: string };
export type Dialogue = { counterpart: string; lines: DialogueLine[] };

export const DIALOGUE_SCENES = ['社内ミーティング', '同僚との会話', '社外でのやりとり'] as const;
export type DialogueScene = (typeof DIALOGUE_SCENES)[number];

// TODO(Phase10): LLMによるプロフィール反映生成に置き換え。現状はプロトタイプ同様の固定2バリアント
export function generateDialogue(scene: string, variant: number): Dialogue {
  if (scene === '同僚との会話') {
    if (variant === 1) {
      return {
        counterpart: 'Mike（同僚）',
        lines: [
          { from: 'them', text: 'Do you have a second? I heard the client pushed back on the timeline.', textJP: '少し時間ある？クライアントがスケジュールに難色を示してるって聞いたんだけど。' },
          { from: 'me', text: 'Yeah, they want to move the launch up by two weeks.', textJP: 'うん、リリースを2週間前倒ししたいって言われてる。' },
          { from: 'them', text: "That's tight. Is it even possible on our end?", textJP: 'それはきついね。こっちで対応できそう？' },
          { from: 'me', text: "As a manager, I'd need to check with the team, but I don't think it's realistic without cutting scope.", textJP: 'マネージャーとしてチームに確認は必要だけど、範囲を削らないと現実的じゃないと思う。' },
          { from: 'them', text: "Let's flag that in tomorrow's check-in before we commit to anything.", textJP: '明日のミーティングで一度共有してから、正式に決めよう。' },
        ],
      };
    }
    return {
      counterpart: 'Mike（同僚）',
      lines: [
        { from: 'them', text: 'Hey, do you have a minute? I wanted to ask about the client meeting yesterday.', textJP: 'ねえ、ちょっといい？昨日のクライアントとの打ち合わせについて聞きたくて。' },
        { from: 'me', text: 'Sure. It went well overall, but they had some concerns about the pricing.', textJP: 'いいよ。全体的には良かったけど、価格面で少し懸念を示されたよ。' },
        { from: 'them', text: 'Ah, I see. Did they mention anything specific?', textJP: 'なるほど。何か具体的に言われた？' },
        { from: 'me', text: 'Yeah, I told them we could offer more flexible terms, but I need to check with the team first.', textJP: 'うん、もう少し柔軟な条件を出せると伝えたけど、まずチームに確認しないといけない。' },
        { from: 'them', text: 'Got it. Let me know if you need backup for the follow-up call.', textJP: '了解。フォローアップの電話でサポートが必要なら言ってね。' },
      ],
    };
  }
  if (scene === '社内ミーティング') {
    if (variant === 1) {
      return {
        counterpart: 'Sarah（進行役）',
        lines: [
          { from: 'them', text: "Let's move on to risks. Anything that could slip this quarter?", textJP: '次はリスクについて話しましょう。今期ずれ込みそうなものはある？' },
          { from: 'me', text: 'The biggest risk is approval delays on new contracts.', textJP: '一番のリスクは新規契約の承認が遅れていることです。' },
          { from: 'them', text: 'How much of a delay are we talking about?', textJP: 'どのくらいの遅れが出ていますか？' },
          { from: 'me', text: "Usually a week or two, but it's added up across several deals.", textJP: '通常1〜2週間程度ですが、複数の案件で積み重なっています。' },
          { from: 'them', text: "Okay, let's raise that with legal separately.", textJP: '分かりました、それは別途法務チームに共有しましょう。' },
        ],
      };
    }
    return {
      counterpart: 'Sarah（進行役）',
      lines: [
        { from: 'them', text: "Let's start with updates from the sales side. Could you share where things stand?", textJP: 'では営業側の状況から始めましょう。現状を共有してもらえますか？' },
        { from: 'me', text: "Sure. As a manager on the team, I've been focusing on the new accounts this quarter.", textJP: 'はい。チームのマネージャーとして、今期は新規口座に注力してきました。' },
        { from: 'them', text: 'Any blockers we should know about?', textJP: '何か障害になっていることはありますか？' },
        { from: 'me', text: "Mainly the pricing approval process — it's slowing down a few deals.", textJP: '主に価格承認のプロセスです。いくつかの案件で進行が遅れています。' },
        { from: 'them', text: "Noted. Let's circle back on that after the meeting.", textJP: '分かりました。それはミーティング後に改めて話しましょう。' },
      ],
    };
  }
  // 社外でのやりとり
  if (variant === 1) {
    return {
      counterpart: 'Ms. Chen（取引先）',
      lines: [
        { from: 'them', text: 'Before we finalize, I wanted to check on the support terms after launch.', textJP: '最終決定の前に、リリース後のサポート条件について確認したかったんです。' },
        { from: 'me', text: 'Good question — we typically include three months of support as standard.', textJP: '良い質問ですね。通常は標準で3ヶ月のサポートを含んでいます。' },
        { from: 'them', text: 'Would it be possible to extend that a bit, given the scope?', textJP: '規模を考えると、少し延長することは可能でしょうか？' },
        { from: 'me', text: 'I think so. Let me confirm internally and get back to you by tomorrow.', textJP: '可能だと思います。社内で確認して、明日までにご連絡します。' },
        { from: 'them', text: 'Perfect, that works on our end.', textJP: '完璧です、こちらとしても問題ありません。' },
      ],
    };
  }
  return {
    counterpart: 'Ms. Chen（取引先）',
    lines: [
      { from: 'them', text: 'Thanks for jumping on this call. We wanted to revisit the proposal you sent last week.', textJP: 'お電話ありがとうございます。先週いただいたご提案について改めて確認したく思います。' },
      { from: 'me', text: "Of course. Happy to walk you through it again — is there a specific part you'd like to focus on?", textJP: 'もちろんです。改めてご説明しますが、特に確認したい部分はありますか？' },
      { from: 'them', text: 'Mainly the implementation timeline. It feels a bit tight on our end.', textJP: '主に導入スケジュールについてです。こちらとしては少しタイトに感じています。' },
      { from: 'me', text: 'That’s fair. Let me check internally and circle back with an adjusted schedule.', textJP: 'おっしゃる通りですね。社内で確認して、調整したスケジュールでご連絡します。' },
      { from: 'them', text: 'That would be great, thank you.', textJP: 'それは助かります、ありがとうございます。' },
    ],
  };
}

export type Presentation = { topic: string; paragraphsEN: string[]; paragraphsJP: string[] };

export function generatePresentation(variant: number): Presentation {
  if (variant === 1) {
    return {
      topic: '新サービス提案',
      paragraphsEN: [
        'Good morning, everyone, and thank you for making time for this today. My name is Kenta Sato, and I work as a Sales Manager here on the team.',
        "I'd like to start by talking about a challenge we've been running into recently. Our approval process for new client proposals has been taking longer than expected, and in a few cases, it's put pressure on our delivery timelines. This isn't a small issue — it's something that's come up in almost every project this quarter.",
        "To address this, I'd like to propose a simpler, more flexible process. Instead of routing every proposal through the same multi-step approval chain, we could introduce a fast-track option for smaller deals, while keeping the full process for larger ones. This way, we reduce delays without lowering our standards.",
        "That's a quick overview of the problem and what I think we should do about it. I know this is a bit of a shift from how we currently operate, so I'd really appreciate your questions and honest feedback before we move forward.",
      ],
      paragraphsJP: [
        '皆さん、おはようございます。本日はお時間をいただきありがとうございます。私はマーケティングチームでマネージャーをしております。',
        'まず、最近直面している課題についてお話しさせてください。新規の顧客提案に関する承認プロセスに想定以上の時間がかかっており、案件によっては納期に影響が出ています。これは小さな問題ではなく、今期ほぼすべてのプロジェクトで発生しています。',
        'この課題に対して、よりシンプルで柔軟なプロセスを提案したいと思います。すべての提案を同じ多段階の承認フローに通すのではなく、小規模案件には迅速承認のルートを設け、大規模案件には従来通りのフルプロセスを維持する、という形です。こうすることで、水準を下げずに遅延を減らせます。',
        '以上が課題の概要と、私が考える対応策です。今のやり方から少し変える提案になりますので、皆さんからのご質問や率直なフィードバックをいただけると助かります。',
      ],
    };
  }
  return {
    topic: '四半期の振り返りと提案',
    paragraphsEN: [
      'Good morning, everyone. Thanks for joining today. My name is Kenta Sato, and I currently work as a Sales Manager.',
      "This quarter, our team has been focused on strengthening relationships with our key accounts, and I'd like to walk you through where things currently stand. Overall, we've made steady progress, and client satisfaction scores have improved slightly compared to last quarter.",
      "That said, there are still a few areas where I think we can do better. Based on what we've learned so far, I believe we should prioritize a more flexible, client-specific approach going into next quarter, rather than applying the same playbook to every account.",
      "That's a quick summary of where we are and where I think we should focus next. Thank you again for your time today — I'm happy to take any questions you might have.",
    ],
    paragraphsJP: [
      '皆さん、おはようございます。本日はお集まりいただきありがとうございます。私は現在マーケティングチームでマネージャーを務めております。',
      '今期、私たちのチームは主要顧客との関係強化に注力してきました。現状について共有させてください。全体として着実に進捗しており、顧客満足度のスコアも前四半期からわずかに改善しています。',
      'とはいえ、まだ改善できる部分がいくつかあると考えています。これまでの学びを踏まえると、来期はすべての顧客に同じやり方を当てはめるのではなく、顧客ごとに合わせた柔軟なアプローチを優先すべきだと思います。',
      '以上が現状と今後注力すべき点の概要です。本日はお時間をいただきありがとうございました。ご質問があればぜひお聞かせください。',
    ],
  };
}

export type SituationalHistoryItem = {
  scene: string;
  date: string;
  type: 'ダイアログ' | 'プレゼン';
  nav: 'situational_dialogue' | 'presentation_material';
};

export const situationalHistory: SituationalHistoryItem[] = [
  { scene: '同僚との会話', date: '9/1', type: 'ダイアログ', nav: 'situational_dialogue' },
  { scene: 'プレゼンテーション', date: '8/25', type: 'プレゼン', nav: 'presentation_material' },
  { scene: '社内ミーティング', date: '8/18', type: 'ダイアログ', nav: 'situational_dialogue' },
  { scene: '社外でのやりとり', date: '8/11', type: 'ダイアログ', nav: 'situational_dialogue' },
  { scene: 'プレゼンテーション', date: '8/4', type: 'プレゼン', nav: 'presentation_material' },
  { scene: '同僚との会話', date: '7/28', type: 'ダイアログ', nav: 'situational_dialogue' },
  { scene: '社内ミーティング', date: '7/21', type: 'ダイアログ', nav: 'situational_dialogue' },
  { scene: 'プレゼンテーション', date: '7/14', type: 'プレゼン', nav: 'presentation_material' },
];
