// 英和辞書（EJDict-hand: パブリックドメイン。https://github.com/kujirahand/EJDict）。
// 初回起動時に server/data/ejdict.txt から dictionary.sqlite を自動生成し、以降は単語をローカルで引く
const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const SRC_PATH = path.join(__dirname, 'data', 'ejdict.txt');
const DB_PATH = path.join(__dirname, 'dictionary.sqlite');

function buildIfNeeded() {
  const db = new Database(DB_PATH);
  db.exec('CREATE TABLE IF NOT EXISTS entries (word TEXT PRIMARY KEY, meaning TEXT NOT NULL)');
  const count = db.prepare('SELECT COUNT(*) c FROM entries').get().c;
  if (count > 0) return db;
  if (!fs.existsSync(SRC_PATH)) {
    console.warn('dictionary source not found:', SRC_PATH);
    return db;
  }

  const map = new Map();
  for (const line of fs.readFileSync(SRC_PATH, 'utf-8').split('\n')) {
    const tab = line.indexOf('\t');
    if (tab < 0) continue;
    const meaning = line.slice(tab + 1).trim();
    if (!meaning) continue;
    for (const head of line.slice(0, tab).split(',')) {
      const key = head.trim().toLowerCase();
      if (!key) continue;
      map.set(key, map.has(key) ? `${map.get(key)} / ${meaning}` : meaning);
    }
  }
  const insert = db.prepare('INSERT OR REPLACE INTO entries (word, meaning) VALUES (?, ?)');
  db.transaction(() => map.forEach((meaning, word) => insert.run(word, meaning)))();
  console.log(`dictionary built: ${map.size} entries`);
  return db;
}

const dictDb = buildIfNeeded();
const findStmt = dictDb.prepare('SELECT word, meaning FROM entries WHERE word = ?');

const IRREGULAR = {
  was: 'be', were: 'be', been: 'be', is: 'be', are: 'be', am: 'be',
  has: 'have', had: 'have', did: 'do', done: 'do', does: 'do',
  went: 'go', gone: 'go', made: 'make', took: 'take', taken: 'take',
  gave: 'give', given: 'give', saw: 'see', seen: 'see', got: 'get', gotten: 'get',
  came: 'come', knew: 'know', known: 'know', thought: 'think', told: 'tell',
  found: 'find', left: 'leave', felt: 'feel', kept: 'keep', held: 'hold',
  brought: 'bring', began: 'begin', begun: 'begin', ran: 'run', wrote: 'write', written: 'write',
  spoke: 'speak', spoken: 'speak', built: 'build', led: 'lead', met: 'meet', paid: 'pay',
  better: 'good', best: 'good', worse: 'bad', worst: 'bad', men: 'man', women: 'woman', children: 'child',
};

// 活用形から辞書の見出し語候補を作る（先頭ほど優先）
function candidates(raw) {
  const s = raw.toLowerCase().replace(/’/g, "'");
  const c = [s];
  if (IRREGULAR[s]) c.push(IRREGULAR[s]);
  if (s.endsWith("'s")) c.push(s.slice(0, -2));
  if (s.endsWith('ies')) c.push(`${s.slice(0, -3)}y`);
  if (s.endsWith('es')) c.push(s.slice(0, -2));
  if (s.endsWith('s')) c.push(s.slice(0, -1));
  if (s.endsWith('ied')) c.push(`${s.slice(0, -3)}y`);
  if (s.endsWith('ed')) {
    c.push(s.slice(0, -2), s.slice(0, -1));
    if (/([^aeiou])\1ed$/.test(s)) c.push(s.slice(0, -3));
  }
  if (s.endsWith('ing')) {
    const base = s.slice(0, -3);
    c.push(base, `${base}e`);
    if (/([^aeiou])\1$/.test(base)) c.push(base.slice(0, -1));
  }
  if (s.endsWith('ily')) c.push(`${s.slice(0, -3)}y`);
  if (s.endsWith('ly')) c.push(s.slice(0, -2));
  if (s.endsWith('ier')) c.push(`${s.slice(0, -3)}y`);
  if (s.endsWith('er')) c.push(s.slice(0, -2), s.slice(0, -1));
  if (s.endsWith('iest')) c.push(`${s.slice(0, -4)}y`);
  if (s.endsWith('est')) c.push(s.slice(0, -3), s.slice(0, -2));
  return c;
}

function formatSenses(meaning) {
  return meaning
    .split(' / ')
    .map((m) => m.replace(/[『』]/g, '').trim())
    .filter(Boolean)
    .map((m) => (m.length > 80 ? `${m.slice(0, 80)}…` : m))
    .slice(0, 5);
}

// 見つかれば { word: 見出し語, senses: 意味の配列 }、なければ null
function lookupDictionary(rawWord) {
  for (const cand of candidates(rawWord)) {
    const row = findStmt.get(cand);
    if (row) return { word: row.word, senses: formatSenses(row.meaning) };
  }
  return null;
}

module.exports = { lookupDictionary };
