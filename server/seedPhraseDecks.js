// フレーズ教材のモックデータ投入: node seedPhraseDecks.js
// 既存の教材・フレーズ・フォルダを全て削除してから、運営提供（重要構文／お役立ちフレーズ、レベル別）と
// カスタマイズ教材（職業・趣味別）を作り直し、オンボーディング完了済みの生徒に配布する
const db = require('./db');
const { syncDecks } = require('./phraseDecks');

const KOUBUN = {
  1: [
    ['I am ~.', '私は〜です。'],
    ['I have ~.', '私は〜を持っています。'],
    ['I want to ~.', '私は〜したいです。'],
    ['I like ~ing.', '私は〜するのが好きです。'],
    ['Can I ~?', '〜してもいいですか？'],
    ['Could you ~?', '〜していただけますか？'],
    ['There is ~.', '〜があります。'],
    ['I am going to ~.', '私は〜するつもりです。'],
  ],
  2: [
    ['I would like to ~.', '〜したいと思います。'],
    ['I am looking forward to ~ing.', '〜するのを楽しみにしています。'],
    ['It depends on ~.', 'それは〜次第です。'],
    ['I am used to ~ing.', '〜することに慣れています。'],
    ['How about ~ing?', '〜するのはどうですか？'],
    ['I have been ~ing for + 期間.', '〜の間ずっと〜しています。'],
    ['I am in charge of ~.', '私は〜を担当しています。'],
    ['Thank you for ~ing.', '〜してくれてありがとう。'],
  ],
  3: [
    ['I would appreciate it if you could ~.', '〜していただけるとありがたいです。'],
    ['As far as I am concerned, ~.', '私に関する限り、〜です。'],
    ['The reason why ~ is that ...', '〜な理由は…だからです。'],
    ['Not only ~ but also ...', '〜だけでなく…も。'],
    ['It is important to ~.', '〜することが大切です。'],
    ['I am afraid that ~.', '残念ながら〜です。'],
    ['What matters is ~.', '重要なのは〜です。'],
    ['Regardless of ~, ...', '〜に関係なく…。'],
  ],
  4: [
    ['Given that ~, ...', '〜を考えると、…。'],
    ['Having said that, ~.', 'そうは言っても、〜。'],
    ['Provided that ~, ...', '〜という条件であれば、…。'],
    ['It goes without saying that ~.', '〜は言うまでもありません。'],
    ['Were it not for ~, ...', '〜がなければ、…。'],
    ['The point I would like to make is that ~.', '私が言いたいのは〜という点です。'],
    ['In light of ~, ...', '〜を踏まえて、…。'],
    ['To the extent that ~, ...', '〜の範囲では、…。'],
  ],
  5: [
    ['Notwithstanding ~, ...', '〜にもかかわらず、…。'],
    ['It is incumbent upon us to ~.', '〜することは我々の責務です。'],
    ['Suffice it to say that ~.', '〜とだけ言っておきましょう。'],
    ['Be that as it may, ~.', 'それはそうかもしれませんが、〜。'],
    ['Insofar as ~, ...', '〜である限りにおいて、…。'],
    ['Little did I realize that ~.', '〜とは全く気づきませんでした。'],
    ['So much so that ~.', '非常に〜なので…。'],
    ['That being said, ~.', 'とはいえ、〜。'],
  ],
};

const USEFUL = {
  1: [
    ['Nice to meet you.', 'はじめまして。'],
    ['How are you?', 'お元気ですか？'],
    ['Thank you very much.', 'どうもありがとうございます。'],
    ['Excuse me.', 'すみません（呼びかけ）。'],
    ['I am sorry.', 'ごめんなさい。'],
    ['Could you say that again?', 'もう一度言っていただけますか？'],
    ['I do not understand.', '分かりません。'],
    ['See you tomorrow.', 'また明日。'],
  ],
  2: [
    ['Could you speak more slowly?', 'もう少しゆっくり話していただけますか？'],
    ['What do you mean by that?', 'それはどういう意味ですか？'],
    ['Sounds good to me.', '良さそうですね。'],
    ['Let me check and get back to you.', '確認して折り返します。'],
    ['I will keep you posted.', '進捗をお知らせします。'],
    ['Do you have a minute?', '少しお時間ありますか？'],
    ['That makes sense.', 'なるほど、納得です。'],
    ['I am not sure about that.', 'それはよく分かりません。'],
  ],
  3: [
    ['Let me walk you through the numbers.', '数字についてご説明させてください。'],
    ['Could you elaborate on that?', 'もう少し詳しく教えていただけますか？'],
    ['Let us circle back to this later.', 'この件は後で改めて話しましょう。'],
    ['I will follow up with you by Friday.', '金曜日までにご連絡します。'],
    ['Let me confirm my understanding.', '私の理解を確認させてください。'],
    ['We are on the same page.', '認識は一致しています。'],
    ['Let us take a step back.', '一度立ち止まって考えましょう。'],
    ['I will loop you in on the email.', 'メールにあなたも入れておきます。'],
  ],
  4: [
    ['I see where you are coming from, but ~.', 'お考えは分かりますが、〜。'],
    ['Let me play devil\'s advocate.', 'あえて反対の立場から言わせてください。'],
    ['That is a fair point.', 'もっともなご指摘です。'],
    ['I would like to push back on that.', 'その点には異議があります。'],
    ['Let us table that for now.', 'その件は一旦保留にしましょう。'],
    ['We need to align on the priorities.', '優先順位をすり合わせる必要があります。'],
    ['That is outside the scope of this project.', 'それはこのプロジェクトの範囲外です。'],
    ['Let me put it in perspective.', '大局的に説明させてください。'],
  ],
  5: [
    ['I would like to reiterate our commitment.', '私たちのコミットメントを改めてお伝えします。'],
    ['We are well positioned to ~.', '私たちは〜するのに好位置にいます。'],
    ['This is a make-or-break moment.', 'これは成否を分ける局面です。'],
    ['Let us not lose sight of the bigger picture.', '全体像を見失わないようにしましょう。'],
    ['I would be remiss not to mention ~.', '〜に触れないわけにはいきません。'],
    ['The ball is in our court.', '次は私たちが動く番です。'],
    ['We need to move the needle on ~.', '〜で成果を出す必要があります。'],
    ['Let me close the loop on this.', 'この件に決着をつけさせてください。'],
  ],
};

const JOB = {
  営業: [['We are pleased to submit our proposal.', '提案書をご提出できて嬉しく思います。'], ['What is your budget for this project?', 'このプロジェクトのご予算はいくらですか？'], ['We can offer a volume discount.', '数量割引をご提供できます。'], ['Let me schedule a follow-up meeting.', 'フォローアップの打ち合わせを設定させてください。'], ['What are your main pain points?', '主なお悩みは何ですか？'], ['We are aiming to close the deal this month.', '今月中の成約を目指しています。']],
  マーケティング: [['What is our target audience?', '私たちのターゲット層は誰ですか？'], ['The campaign generated a lot of leads.', 'そのキャンペーンは多くのリードを生みました。'], ['Let us look at the conversion rate.', 'コンバージョン率を見てみましょう。'], ['We need to differentiate our brand.', 'ブランドを差別化する必要があります。'], ['Engagement has increased by 20 percent.', 'エンゲージメントが20%増えました。'], ['Let us run an A/B test.', 'A/Bテストを実施しましょう。']],
  エンジニア: [['We need to fix this bug before the release.', 'リリース前にこのバグを直す必要があります。'], ['The system is currently down.', 'システムは現在ダウンしています。'], ['Let me walk you through the architecture.', 'アーキテクチャを説明させてください。'], ['Could you review my pull request?', 'プルリクエストをレビューしてもらえますか？'], ['This will improve the performance.', 'これでパフォーマンスが向上します。'], ['We should write more unit tests.', 'ユニットテストをもっと書くべきです。']],
  人事: [['We are looking to hire a new team member.', '新しいメンバーを採用しようとしています。'], ['Let us schedule a performance review.', '人事評価の面談を設定しましょう。'], ['Could you tell me about your career goals?', 'あなたのキャリア目標を教えていただけますか？'], ['We offer flexible working hours.', '柔軟な勤務時間を提供しています。'], ['The onboarding process takes two weeks.', 'オンボーディングは2週間かかります。'], ['Employee retention is a priority.', '従業員の定着は優先事項です。']],
  '経理・財務': [['Let me go over the quarterly results.', '四半期の結果を説明します。'], ['We are within the budget.', '予算内に収まっています。'], ['The invoice is due by the end of the month.', '請求書の期限は月末です。'], ['Cash flow is our main concern.', 'キャッシュフローが主な懸念です。'], ['Revenue grew by 10 percent year over year.', '売上は前年比10%増加しました。'], ['We need to reduce costs.', 'コストを削減する必要があります。']],
  企画: [['Let me share the outline of the plan.', '企画の概要を共有させてください。'], ['What is the goal of this project?', 'このプロジェクトの目的は何ですか？'], ['We need to define the scope first.', 'まず範囲を定める必要があります。'], ['Let us brainstorm some ideas.', 'アイデアを出し合いましょう。'], ['The timeline is quite tight.', 'スケジュールはかなり厳しいです。'], ['Let us validate this hypothesis.', 'この仮説を検証しましょう。']],
  カスタマーサポート: [['Thank you for contacting us.', 'お問い合わせありがとうございます。'], ['I apologize for the inconvenience.', 'ご不便をおかけして申し訳ありません。'], ['Could you tell me more about the issue?', '問題について詳しく教えていただけますか？'], ['I will escalate this to our technical team.', '技術チームにエスカレーションします。'], ['Is there anything else I can help you with?', '他にお手伝いできることはありますか？'], ['We will get back to you within 24 hours.', '24時間以内にご連絡します。']],
  コンサルタント: [['Let me summarize our key findings.', '主な調査結果をまとめます。'], ['What is the root cause of the problem?', '問題の根本原因は何ですか？'], ['We recommend a phased approach.', '段階的なアプローチをお勧めします。'], ['Let us prioritize the initiatives.', '施策に優先順位をつけましょう。'], ['This will deliver measurable value.', 'これは測定可能な価値を生みます。'], ['Let us align on the next steps.', '次のステップをすり合わせましょう。']],
  '経営・役員': [['Our strategic priority is to expand overseas.', '私たちの戦略的優先事項は海外展開です。'], ['We are committed to long-term growth.', '私たちは長期的な成長にコミットしています。'], ['Let us review the risk factors.', 'リスク要因を確認しましょう。'], ['This aligns with our vision.', 'これは私たちのビジョンに合致します。'], ['We must make a decision by the end of this quarter.', '今四半期末までに決断する必要があります。'], ['I would like to thank the team for their hard work.', 'チームの皆さんの努力に感謝します。']],
};

const HOBBY = {
  読書: [['I recently finished a great novel.', '最近素晴らしい小説を読み終えました。'], ['I read before going to bed.', '寝る前に読書をします。'], ['Have you read any good books lately?', '最近何か良い本を読みましたか？'], ['It is a page-turner.', '読み始めたら止まらない本です。'], ['I prefer paperbacks to e-books.', '電子書籍より紙の本が好きです。'], ['Who is your favorite author?', '好きな作家は誰ですか？']],
  映画鑑賞: [['What kind of movies do you like?', 'どんな映画が好きですか？'], ['I watched it on the big screen.', '大きなスクリーンで観ました。'], ['The plot was really moving.', 'ストーリーにとても感動しました。'], ['I highly recommend it.', 'とてもお勧めです。'], ['It has great special effects.', '素晴らしい特殊効果があります。'], ['I am not a fan of horror movies.', 'ホラー映画は苦手です。']],
  旅行: [['I love exploring new places.', '新しい場所を探検するのが大好きです。'], ['Where would you like to go next?', '次はどこに行きたいですか？'], ['I booked a flight to ~.', '〜行きの航空券を予約しました。'], ['We stayed at a small local inn.', '小さな地元の旅館に泊まりました。'], ['The scenery was breathtaking.', '景色は息をのむほど美しかったです。'], ['I traveled light.', '荷物を少なくして旅行しました。']],
  スポーツ観戦: [['Who is your favorite team?', '好きなチームはどこですか？'], ['It was a close game.', '接戦でした。'], ['They won by a landslide.', '大差で勝ちました。'], ['I watch every home game.', 'ホームゲームは全部観ます。'], ['The atmosphere in the stadium was amazing.', 'スタジアムの雰囲気は最高でした。'], ['They finally made it to the finals.', 'ついに決勝に進みました。']],
  ゴルフ: [['I play golf on weekends.', '週末にゴルフをします。'], ['What is your handicap?', 'ハンデはいくつですか？'], ['I hit a great drive.', '素晴らしいドライバーショットが打てました。'], ['I shot a 90 today.', '今日は90で回りました。'], ['Let us grab a drink after the round.', 'ラウンドの後に一杯やりましょう。'], ['The greens were fast today.', '今日のグリーンは速かったです。']],
  料理: [['I enjoy cooking for my family.', '家族のために料理するのが好きです。'], ['This recipe is easy to follow.', 'このレシピは簡単に作れます。'], ['Add a pinch of salt.', '塩をひとつまみ加えます。'], ['I made it from scratch.', 'ゼロから作りました。'], ['It needs to simmer for 20 minutes.', '20分煮込む必要があります。'], ['What is your signature dish?', '得意料理は何ですか？']],
  音楽: [['What kind of music do you listen to?', 'どんな音楽を聴きますか？'], ['I play the guitar in my free time.', '暇なときにギターを弾きます。'], ['I went to a live concert last month.', '先月ライブに行きました。'], ['This song gets stuck in my head.', 'この曲は頭から離れません。'], ['I have been a fan for years.', '何年もファンです。'], ['She has an incredible voice.', '彼女は素晴らしい声の持ち主です。']],
  ゲーム: [['I stay up late playing games.', '夜更かしをしてゲームをします。'], ['Which console do you have?', 'どのゲーム機を持っていますか？'], ['I am stuck on the final boss.', 'ラスボスで詰まっています。'], ['Let us play online together.', '一緒にオンラインで遊びましょう。'], ['The graphics are stunning.', 'グラフィックが見事です。'], ['I have put over 100 hours into this game.', 'このゲームに100時間以上費やしました。']],
  カフェ巡り: [['I love trying out new cafes.', '新しいカフェを試すのが大好きです。'], ['They serve great coffee here.', 'ここは美味しいコーヒーを出します。'], ['It has a cozy atmosphere.', '居心地の良い雰囲気です。'], ['I will have a latte, please.', 'ラテをお願いします。'], ['This place is a hidden gem.', 'ここは隠れた名店です。'], ['Their cheesecake is a must-try.', 'ここのチーズケーキは絶対に食べるべきです。']],
  ランニング: [['I run five kilometers every morning.', '毎朝5キロ走っています。'], ['I am training for a marathon.', 'マラソンに向けてトレーニングしています。'], ['I beat my personal best.', '自己ベストを更新しました。'], ['Running helps me clear my mind.', '走ると頭がすっきりします。'], ['I need a new pair of running shoes.', '新しいランニングシューズが必要です。'], ['Let us go for a run together.', '一緒に走りに行きましょう。']],
  ヨガ: [['I do yoga to relax.', 'リラックスするためにヨガをします。'], ['It helps improve my flexibility.', '柔軟性の向上に役立ちます。'], ['Take a deep breath in and out.', '深く息を吸って、吐いてください。'], ['I attend a class twice a week.', '週に2回クラスに通っています。'], ['It is good for stress relief.', 'ストレス解消に良いです。'], ['Hold this pose for 30 seconds.', 'このポーズを30秒キープしてください。']],
  写真: [['I enjoy taking photos of landscapes.', '風景の写真を撮るのが好きです。'], ['What kind of camera do you use?', 'どんなカメラを使っていますか？'], ['The lighting is perfect here.', 'ここは光が完璧です。'], ['I edit my photos on my laptop.', 'ノートパソコンで写真を編集します。'], ['This shot turned out great.', 'この写真はうまく撮れました。'], ['I shared it on social media.', 'SNSでシェアしました。']],
};

function addDeck(kind, name, level, attr, attrValue, items) {
  const id = db.prepare('INSERT INTO phrase_decks (kind, name, level, attr, attr_value) VALUES (?, ?, ?, ?, ?)').run(kind, name, level, attr, attrValue).lastInsertRowid;
  items.forEach(([text, jp], i) => db.prepare('INSERT INTO phrase_deck_items (deck_id, text, text_jp, sort_order) VALUES (?, ?, ?, ?)').run(id, text, jp, i));
}

db.transaction(() => {
  ['phrases', 'phrase_folders', 'phrase_deck_items', 'phrase_decks'].forEach((t) => db.prepare(`DELETE FROM ${t}`).run());
  for (let lv = 1; lv <= 5; lv++) {
    addDeck('official', `重要構文 Lv${lv}`, lv, null, null, KOUBUN[lv]);
    addDeck('official', `お役立ちフレーズ Lv${lv}`, lv, null, null, USEFUL[lv]);
  }
  Object.entries(JOB).forEach(([v, items]) => addDeck('curated', `${v}で使う表現`, null, 'job', v, items));
  Object.entries(HOBBY).forEach(([v, items]) => addDeck('curated', `${v}を話す表現`, null, 'hobby', v, items));
})();

db.prepare('SELECT id FROM students').all().forEach((s) => {
  db.prepare("INSERT INTO phrase_folders (student_id, name, source) VALUES (?, 'マイフレーズ', 'custom')").run(s.id);
  syncDecks(s.id);
});
console.log('decks:', db.prepare('SELECT COUNT(*) c FROM phrase_decks').get().c, 'items:', db.prepare('SELECT COUNT(*) c FROM phrase_deck_items').get().c);
