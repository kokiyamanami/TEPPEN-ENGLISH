const db = require('./db');

// 生徒の教材フォルダを運営の教材に同期する。
// 運営提供（レベル別）の教材を、生徒のレベルに合わせて配布し、教材側の追加・変更・削除を反映する（覚えた状態は保持）。
// 一度配布した教材は、レベルが変わっても残す。カスタマイズ教材はプロフィールからAIが生成する（curated.js）
function syncDecks(studentId) {
  const student = db.prepare('SELECT phase, onboarding_complete FROM students WHERE id = ?').get(studentId);
  // プロフィールが入力されるオンボーディング完了後に配布する
  if (!student || !student.onboarding_complete) return;
  const decks = db.prepare("SELECT * FROM phrase_decks WHERE kind = 'official' ORDER BY id").all();
  const tx = db.transaction(() => {
    decks.forEach((deck) => {
      const applicable = deck.level === student.phase;
      let folder = db.prepare('SELECT id, name, source FROM phrase_folders WHERE student_id = ? AND deck_id = ?').get(studentId, deck.id);
      if (!folder) {
        if (!applicable) return;
        const info = db.prepare('INSERT INTO phrase_folders (student_id, name, source, deck_id) VALUES (?, ?, ?, ?)').run(studentId, deck.name, deck.kind, deck.id);
        folder = { id: info.lastInsertRowid, name: deck.name, source: deck.kind };
      } else if (folder.name !== deck.name || folder.source !== deck.kind) {
        db.prepare('UPDATE phrase_folders SET name = ?, source = ? WHERE id = ?').run(deck.name, deck.kind, folder.id);
      }
      const items = db.prepare('SELECT id, text, text_jp FROM phrase_deck_items WHERE deck_id = ? ORDER BY sort_order, id').all(deck.id);
      const owned = db.prepare('SELECT id, deck_item_id, text, text_jp FROM phrases WHERE student_id = ? AND folder_id = ?').all(studentId, folder.id);
      const byItem = new Map(owned.map((p) => [p.deck_item_id, p]));
      items.forEach((it) => {
        const p = byItem.get(it.id);
        if (!p) {
          db.prepare('INSERT INTO phrases (student_id, folder_id, text, text_jp, learned, deck_item_id) VALUES (?, ?, ?, ?, 0, ?)').run(studentId, folder.id, it.text, it.text_jp, it.id);
        } else if (p.text !== it.text || p.text_jp !== it.text_jp) {
          db.prepare('UPDATE phrases SET text = ?, text_jp = ? WHERE id = ?').run(it.text, it.text_jp, p.id);
        }
      });
      const live = new Set(items.map((it) => it.id));
      owned.filter((p) => !live.has(p.deck_item_id)).forEach((p) => db.prepare('DELETE FROM phrases WHERE id = ?').run(p.id));
    });
  });
  tx();
}

// 教材を削除したとき、配布済みの生徒のフォルダ・フレーズも消す
function removeDeck(deckId) {
  const tx = db.transaction(() => {
    const folderIds = db.prepare('SELECT id FROM phrase_folders WHERE deck_id = ?').all(deckId).map((f) => f.id);
    folderIds.forEach((id) => db.prepare('DELETE FROM phrases WHERE folder_id = ?').run(id));
    db.prepare('DELETE FROM phrase_folders WHERE deck_id = ?').run(deckId);
    db.prepare('DELETE FROM phrase_deck_items WHERE deck_id = ?').run(deckId);
    db.prepare('DELETE FROM phrase_decks WHERE id = ?').run(deckId);
  });
  tx();
}

module.exports = { syncDecks, removeDeck };
