const db = require('./db');
const { logger } = require('./logger');

const openai = require('./openai');

const CATEGORIES = [
  { name: '仕事で使う表現', type: 'phrase', fields: ['job', 'position', 'jobDetail', 'workChallenge'], guide: '仕事の場面（会議・メール・報告・交渉など）で、この人が実際に使いそうな表現' },
  { name: '自己紹介・経歴の表現', type: 'phrase', fields: ['career', 'successStory', 'strengths', 'futureCareer'], guide: '自己紹介や経歴・実績・強み・将来像を話すときにこの人が使いそうな表現' },
  { name: '雑談・趣味の表現', type: 'phrase', fields: ['hobby', 'personality'], guide: '雑談や趣味の話題で、この人の人柄や好みに合った自然な表現' },
  { name: '仕事で使う単語', type: 'word', fields: ['job', 'position', 'jobDetail', 'workChallenge'], guide: 'この人の仕事で頻繁に使う英単語・短い専門用語' },
  { name: '経歴・趣味の単語', type: 'word', fields: ['career', 'hobby', 'strengths', 'futureCareer'], guide: 'この人の経歴・趣味・強み・将来像の話題で使う英単語・短い用語' },
];
const ITEMS_PER_CATEGORY = 8;
const RETRY_COOLDOWN_MS = 5 * 60 * 1000;
const MORE_COOLDOWN_MS = 60 * 1000;

const state = new Map(); // studentId -> { running, failedAt }

function readProfile(studentId) {
  const s = db.prepare('SELECT phase, profile_json, onboarding_complete FROM students WHERE id = ?').get(studentId);
  if (!s) return null;
  let profile = {};
  try {
    profile = JSON.parse(s.profile_json || '{}');
  } catch {
    profile = {};
  }
  return { ...s, profile };
}

const asText = (v) => (Array.isArray(v) ? v.join('、') : String(v ?? '')).trim();

async function requestCategory(cat, profile, phase, existing) {
  const info = cat.fields.map((f) => `${f}: ${asText(profile[f]) || '(未入力)'}`).join('\n');
  const resp = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    response_format: { type: 'json_object' },
    max_tokens: 900,
    messages: [
      {
        role: 'system',
        content:
          'あなたは日本人ビジネスパーソン向けの英会話コーチです。学習者のプロフィールに合わせて、覚えて実際に使える英語のフレーズを作ってください。' +
          `${cat.guide}を${ITEMS_PER_CATEGORY}個。学習者の英語レベルはPhase ${phase}（1=初級〜5=上級）に合わせた難易度にしてください。` +
          (cat.type === 'word'
            ? 'textは英単語または2〜3語までの短い用語（文にしない）。textJPは日本語の意味。'
            : '学習者本人が話す一人称の自然な口語表現で、1文または短い1フレーズ。') +
          '固有名詞や個人を特定できる情報は入れない。プロフィールが未入力の項目は一般的な内容で構いません。' +
          '必ず次のJSON形式のみで回答: {"items":[{"text":"英語","textJP":"日本語訳"}]}',
      },
      { role: 'user', content: info + (existing.length ? `\n\n既にあるものは除いて、新しいものを作ってください:\n${existing.join('\n')}` : '') },
    ],
  });
  const parsed = JSON.parse(resp.choices[0].message.content);
  return (Array.isArray(parsed.items) ? parsed.items : [])
    .map((i) => ({ text: String(i.text || '').trim(), textJP: String(i.textJP || '').trim() }))
    .filter((i) => i.text)
    .slice(0, ITEMS_PER_CATEGORY);
}

function findFolder(studentId, name) {
  return db.prepare("SELECT id FROM phrase_folders WHERE student_id = ? AND source = 'curated' AND deck_id IS NULL AND name = ?").get(studentId, name);
}

// 既存のフレーズは消さず、新しいものだけを追加する（同じ英文は追加しない）
function appendCategory(studentId, name, type, items) {
  let folder = findFolder(studentId, name);
  if (!folder) {
    const info = db.prepare("INSERT INTO phrase_folders (student_id, name, source, content_type) VALUES (?, ?, 'curated', ?)").run(studentId, name, type);
    folder = { id: info.lastInsertRowid };
  }
  const have = new Set(db.prepare('SELECT text FROM phrases WHERE folder_id = ?').all(folder.id).map((p) => p.text.toLowerCase()));
  items.forEach((it) => {
    if (have.has(it.text.toLowerCase())) return;
    db.prepare('INSERT INTO phrases (student_id, folder_id, text, text_jp, learned) VALUES (?, ?, ?, ?, 0)').run(studentId, folder.id, it.text, it.textJP);
  });
}

function existingTexts(studentId, name) {
  const f = findFolder(studentId, name);
  return f ? db.prepare('SELECT text FROM phrases WHERE folder_id = ? ORDER BY id DESC LIMIT 40').all(f.id).map((p) => p.text) : [];
}

// プロフィールから、その人専用のカスタマイズ教材をAIで作る（バックグラウンドで実行）。
// 通常は、まだ無いフォルダだけを作る。more:true（生徒の「新しく作る」ボタン）のときは、全フォルダに新しいフレーズを追加する。
// 既存のフレーズは消さない
async function generateCuratedUnsafe(studentId, { more = false } = {}) {
  const st = state.get(studentId) || {};
  if (st.running) return 'busy';
  const row = readProfile(studentId);
  if (!row || !row.onboarding_complete) return 'not_ready';
  if (more && st.lastRunAt && Date.now() - st.lastRunAt < MORE_COOLDOWN_MS) return 'cooldown';
  if (!more && st.failedAt && Date.now() - st.failedAt < RETRY_COOLDOWN_MS) return 'cooldown';
  const targets = more ? CATEGORIES : CATEGORIES.filter((c) => !findFolder(studentId, c.name));
  if (targets.length === 0) return 'nothing';

  state.set(studentId, { running: true, lastRunAt: st.lastRunAt });
  try {
    const results = await Promise.all(targets.map((c) => requestCategory(c, row.profile, row.phase || 1, more ? existingTexts(studentId, c.name) : [])));
    if (results.some((r) => r.length === 0)) throw new Error('empty result');
    db.transaction(() => targets.forEach((c, i) => appendCategory(studentId, c.name, c.type, results[i])))();
    state.set(studentId, { lastRunAt: more ? Date.now() : st.lastRunAt });
  } catch (err) {
    logger.error('generateCurated failed', err);
    // 失敗しても「新しく作る」の連打で毎回OpenAIを呼ばないよう、lastRunAtも更新してクールダウンさせる
    state.set(studentId, { failedAt: Date.now(), lastRunAt: more ? Date.now() : st.lastRunAt });
    return 'failed';
  }
  return 'done';
}

// 呼び出し側は結果を待たずに実行することがあるため、DBエラーなどの例外は必ずここで受ける
// （未捕捉のPromise rejectionはNode 15以降でプロセスを終了させる）
async function generateCurated(studentId, options) {
  try {
    return await generateCuratedUnsafe(studentId, options);
  } catch (err) {
    logger.error('generateCurated error', err);
    state.set(studentId, { failedAt: Date.now(), lastRunAt: state.get(studentId)?.lastRunAt });
    return 'failed';
  }
}

function isGenerating(studentId) {
  return !!state.get(studentId)?.running;
}

module.exports = { generateCurated, isGenerating };
