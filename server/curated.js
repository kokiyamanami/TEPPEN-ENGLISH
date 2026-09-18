const crypto = require('crypto');
const OpenAI = require('openai');
const db = require('./db');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const CATEGORIES = [
  { name: '仕事で使う表現', fields: ['job', 'position', 'jobDetail', 'workChallenge'], guide: '仕事の場面（会議・メール・報告・交渉など）で、この人が実際に使いそうな表現' },
  { name: '自己紹介・経歴の表現', fields: ['career', 'successStory', 'strengths', 'futureCareer'], guide: '自己紹介や経歴・実績・強み・将来像を話すときにこの人が使いそうな表現' },
  { name: '雑談・趣味の表現', fields: ['hobby', 'personality'], guide: '雑談や趣味の話題で、この人の人柄や好みに合った自然な表現' },
];
const ITEMS_PER_CATEGORY = 8;
const RETRY_COOLDOWN_MS = 5 * 60 * 1000;

const state = new Map(); // studentId -> { running, failedAt }

function readProfile(studentId) {
  const s = db.prepare('SELECT phase, profile_json, onboarding_complete, curated_hash FROM students WHERE id = ?').get(studentId);
  if (!s) return null;
  let profile = {};
  try {
    profile = JSON.parse(s.profile_json || '{}');
  } catch {
    profile = {};
  }
  return { ...s, profile };
}

function profileHash(profile) {
  const keys = CATEGORIES.flatMap((c) => c.fields).sort();
  return crypto.createHash('sha1').update(JSON.stringify(keys.map((k) => profile[k] ?? ''))).digest('hex');
}

const asText = (v) => (Array.isArray(v) ? v.join('、') : String(v ?? '')).trim();

async function requestCategory(cat, profile, phase) {
  const info = cat.fields.map((f) => `${f}: ${asText(profile[f]) || '(未入力)'}`).join('\n');
  const resp = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    response_format: { type: 'json_object' },
    max_tokens: 1200,
    messages: [
      {
        role: 'system',
        content:
          'あなたは日本人ビジネスパーソン向けの英会話コーチです。学習者のプロフィールに合わせて、覚えて実際に使える英語のフレーズを作ってください。' +
          `${cat.guide}を${ITEMS_PER_CATEGORY}個。学習者の英語レベルはPhase ${phase}（1=初級〜5=上級）に合わせた難易度にしてください。` +
          '学習者本人が話す一人称の自然な口語表現で、1文または短い1フレーズ。固有名詞や個人を特定できる情報は入れない。プロフィールが未入力の項目は一般的な内容で構いません。' +
          '必ず次のJSON形式のみで回答: {"items":[{"text":"英語","textJP":"日本語訳"}]}',
      },
      { role: 'user', content: info },
    ],
  });
  const parsed = JSON.parse(resp.choices[0].message.content);
  return (Array.isArray(parsed.items) ? parsed.items : [])
    .map((i) => ({ text: String(i.text || '').trim(), textJP: String(i.textJP || '').trim() }))
    .filter((i) => i.text)
    .slice(0, ITEMS_PER_CATEGORY);
}

// 覚えた（learned）フレーズは残し、未習得のものを新しいものに入れ替える
function writeCategory(studentId, name, items) {
  let folder = db.prepare("SELECT id FROM phrase_folders WHERE student_id = ? AND source = 'curated' AND deck_id IS NULL AND name = ?").get(studentId, name);
  if (!folder) {
    const info = db.prepare("INSERT INTO phrase_folders (student_id, name, source) VALUES (?, ?, 'curated')").run(studentId, name);
    folder = { id: info.lastInsertRowid };
  }
  db.prepare('DELETE FROM phrases WHERE folder_id = ? AND learned = 0').run(folder.id);
  const kept = new Set(db.prepare('SELECT text FROM phrases WHERE folder_id = ?').all(folder.id).map((p) => p.text.toLowerCase()));
  items.forEach((it) => {
    if (kept.has(it.text.toLowerCase())) return;
    db.prepare('INSERT INTO phrases (student_id, folder_id, text, text_jp, learned) VALUES (?, ?, ?, ?, 0)').run(studentId, folder.id, it.text, it.textJP);
  });
}

// プロフィールから、その人専用のカスタマイズ教材（3フォルダ）をAIで作る。バックグラウンドで実行する
async function generateCurated(studentId, { force = false } = {}) {
  const st = state.get(studentId) || {};
  if (st.running) return;
  const row = readProfile(studentId);
  if (!row || !row.onboarding_complete) return;
  const hash = profileHash(row.profile);
  const hasFolders = !!db.prepare("SELECT id FROM phrase_folders WHERE student_id = ? AND source = 'curated' AND deck_id IS NULL LIMIT 1").get(studentId);
  if (!force && hasFolders && row.curated_hash === hash) return;
  if (st.failedAt && Date.now() - st.failedAt < RETRY_COOLDOWN_MS) return;

  state.set(studentId, { running: true });
  try {
    const results = await Promise.all(CATEGORIES.map((c) => requestCategory(c, row.profile, row.phase || 1)));
    if (results.some((r) => r.length === 0)) throw new Error('empty result');
    db.transaction(() => {
      CATEGORIES.forEach((c, i) => writeCategory(studentId, c.name, results[i]));
      db.prepare('UPDATE students SET curated_hash = ? WHERE id = ?').run(hash, studentId);
    })();
    state.set(studentId, {});
  } catch (err) {
    console.error('generateCurated failed:', err.message);
    state.set(studentId, { failedAt: Date.now() });
  }
}

function isGenerating(studentId) {
  return !!state.get(studentId)?.running;
}

module.exports = { generateCurated, isGenerating };
