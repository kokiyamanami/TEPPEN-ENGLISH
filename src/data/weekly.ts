export type VocabItem = { en: string; pos: string; jp: string };
export type WeeklyMaterial = { week: number; topic: string; paragraphsEN: string[]; paragraphsJP: string[]; vocab: VocabItem[] };

// Weeklyミッションの流れ。STEP1〜6を順番に完了するとSTEP7（AI添削つきの発話テスト）が解放される
export type WeeklyStepDef = { step: number; title: string; desc: string };
export const WEEKLY_STEPS: WeeklyStepDef[] = [
  { step: 1, title: '語彙・表現チェック', desc: '今週の教材に出てくる重要な語彙・表現を確認します' },
  { step: 2, title: '語彙・表現テスト', desc: 'STEP1の語彙・表現の意味を4択で確認します' },
  { step: 3, title: 'スラッシュリーディング', desc: '意味のかたまりごとに区切りながら英文を読みます' },
  { step: 4, title: '音読', desc: 'お手本音声を聞き、声に出して読みます' },
  { step: 5, title: 'シャドーイング', desc: '音声を追いかけるように、テキストを見ずに真似して話します' },
  { step: 6, title: '反訳トレーニング', desc: '日本語を見て英語で言い、英文で答え合わせします' },
  { step: 7, title: '発話テスト', desc: '通しで録音してAI添削を受けます（合格でWeeklyミッションクリア）' },
];
export const WEEKLY_TEST_STEP = 7;

// TODO(Phase10): LLMによる週替わり生成に置き換え
export function generateWeeklyMaterial(): WeeklyMaterial {
  return {
    week: 14,
    topic: '自分の強み・弱み・キャリアについて話す',
    paragraphsEN: [
      'My strengths lie in two key areas: strategic planning based on data analysis and effective team leadership. In my current role as a marketing manager at an IT company, I utilize these skills every day. I have developed the ability to evaluate marketing campaigns quantitatively, which allows me to measure the success of different projects. By analyzing this data, I can swiftly implement strategies that drive better results.',
      'Another significant strength I possess is my communication ability. Communicating effectively with team members is crucial, and I excel in building cooperative relationships within my team. This skill not only creates a positive work environment but also enhances productivity as everyone is on the same page and can work towards common goals efficiently.',
      'However, I do have a weakness, which is my tendency to focus too much on details. Sometimes, I can become so involved in the specifics of a project that I lose sight of the bigger picture. Recognizing this, I am working on improving my decision-making skills to better balance detailed analysis with the need for timely actions.',
      'Looking ahead, my career ambition is to become a global marketing director. I aim to lead my company’s overseas expansion and develop brand strategies for diverse markets. By applying my strengths in strategic analysis and leadership, while managing my attention to detail, I am confident in advancing my career.',
    ],
    vocab: [
      { en: 'strategic planning', pos: '名詞句', jp: '戦略立案' },
      { en: 'data analysis', pos: '名詞句', jp: 'データ分析' },
      { en: 'evaluate', pos: '動詞', jp: '評価する' },
      { en: 'quantitatively', pos: '副詞', jp: '定量的に' },
      { en: 'swiftly', pos: '副詞', jp: '迅速に' },
      { en: 'drive better results', pos: '表現', jp: 'より良い成果を生み出す' },
      { en: 'build cooperative relationships', pos: '表現', jp: '協力的な関係を築く' },
      { en: 'productivity', pos: '名詞', jp: '生産性' },
      { en: 'lose sight of the bigger picture', pos: '表現', jp: '全体像を見失う' },
      { en: 'balance A with B', pos: '表現', jp: 'AとBのバランスを取る' },
      { en: 'overseas expansion', pos: '名詞句', jp: '海外展開' },
      { en: 'attention to detail', pos: '名詞句', jp: '細部への注意' },
    ],
    paragraphsJP: [
      '私の強みは大きく2つあります。データ分析に基づく戦略立案と、効果的なチームリーダーシップです。現在IT企業でマーケティングマネージャーを務めており、日々この2つのスキルを活用しています。',
      'もう一つの強みはコミュニケーション能力です。チームメンバーと効果的にコミュニケーションを取ることは非常に重要で、私はチーム内で協力的な関係を築くことを得意としています。',
      '一方で、弱みとして、細部にこだわりすぎる傾向があります。この点を自覚し、詳細な分析と迅速な行動のバランスを取れるよう、意思決定力の向上に取り組んでいます。',
      '今後のキャリアとしては、グローバルマーケティングディレクターになることを目指しています。戦略分析力とリーダーシップという強みを活かしつつ、自信を持ってキャリアを前進させたいと思います。',
    ],
  };
}

