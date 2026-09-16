export type WeeklyMaterial = { week: number; topic: string; paragraphsEN: string[]; paragraphsJP: string[] };

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
    paragraphsJP: [
      '私の強みは大きく2つあります。データ分析に基づく戦略立案と、効果的なチームリーダーシップです。現在IT企業でマーケティングマネージャーを務めており、日々この2つのスキルを活用しています。',
      'もう一つの強みはコミュニケーション能力です。チームメンバーと効果的にコミュニケーションを取ることは非常に重要で、私はチーム内で協力的な関係を築くことを得意としています。',
      '一方で、弱みとして、細部にこだわりすぎる傾向があります。この点を自覚し、詳細な分析と迅速な行動のバランスを取れるよう、意思決定力の向上に取り組んでいます。',
      '今後のキャリアとしては、グローバルマーケティングディレクターになることを目指しています。戦略分析力とリーダーシップという強みを活かしつつ、自信を持ってキャリアを前進させたいと思います。',
    ],
  };
}

