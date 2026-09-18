// 単語教材（運営提供・レベル別）のモックデータ投入: node seedWordDecks.js
// 既存データは消さず、同名の教材が無ければ追加する。オンボーディング完了済みの生徒に配布する
const db = require('./db');
const { syncDecks } = require('./phraseDecks');

const CORE = {
  1: [['schedule', '予定、スケジュール'], ['meeting', '会議'], ['report', '報告書'], ['customer', '顧客'], ['price', '価格'], ['deadline', '締め切り'], ['office', '事務所、職場'], ['colleague', '同僚']],
  2: [['agenda', '議題'], ['proposal', '提案'], ['budget', '予算'], ['feedback', 'フィードバック'], ['contract', '契約'], ['deliver', '届ける、納品する'], ['improve', '改善する'], ['available', '都合がつく、利用可能な']],
  3: [['negotiate', '交渉する'], ['revenue', '収益'], ['implement', '実施する'], ['stakeholder', '利害関係者'], ['priority', '優先事項'], ['forecast', '予測'], ['bottleneck', 'ボトルネック'], ['compliance', 'コンプライアンス、法令遵守']],
  4: [['leverage', '活用する'], ['scalable', '拡張性のある'], ['mitigate', '軽減する'], ['benchmark', '基準、指標'], ['streamline', '効率化する'], ['accountability', '説明責任'], ['contingency', '不測の事態への備え'], ['synergy', '相乗効果']],
  5: [['paradigm', '枠組み、パラダイム'], ['ubiquitous', 'どこにでもある'], ['exacerbate', '悪化させる'], ['ameliorate', '改善する'], ['pragmatic', '実務的な'], ['unprecedented', '前例のない'], ['reconcile', '調整する、両立させる'], ['discretion', '裁量']],
};

let added = 0;
for (let lv = 1; lv <= 5; lv++) {
  const name = `ビジネス頻出単語 Lv${lv}`;
  if (db.prepare('SELECT id FROM phrase_decks WHERE name = ?').get(name)) continue;
  const id = db.prepare("INSERT INTO phrase_decks (kind, name, level, content_type) VALUES ('official', ?, ?, 'word')").run(name, lv).lastInsertRowid;
  CORE[lv].forEach(([text, jp], i) => db.prepare('INSERT INTO phrase_deck_items (deck_id, text, text_jp, sort_order) VALUES (?, ?, ?, ?)').run(id, text, jp, i));
  added++;
}
db.prepare('SELECT id FROM students').all().forEach((s) => syncDecks(s.id));
console.log('word decks added:', added);
