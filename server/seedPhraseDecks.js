// フレーズ教材のモックデータ投入: node seedPhraseDecks.js
// 既存の教材・フレーズ・フォルダを全て削除してから、運営提供（重要構文／お役立ちフレーズ、レベル別）を作り直す。
// カスタマイズ教材はAIがプロフィールから自動生成する（curated.js）
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
})();

db.prepare('SELECT id FROM students').all().forEach((s) => {
  db.prepare("INSERT INTO phrase_folders (student_id, name, source) VALUES (?, 'マイフレーズ', 'custom')").run(s.id);
  syncDecks(s.id);
});
console.log('decks:', db.prepare('SELECT COUNT(*) c FROM phrase_decks').get().c, 'items:', db.prepare('SELECT COUNT(*) c FROM phrase_deck_items').get().c);
