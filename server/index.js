require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const OpenAI = require('openai');
const { toFile } = require('openai/uploads');

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({ dest: '/tmp/teppen-uploads/' });
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.get('/api/health', (req, res) => {
  res.json({ ok: true, hasKey: Boolean(process.env.OPENAI_API_KEY) });
});

// POST /api/grade
// multipart/form-data: audio=<file>, taskLabel, promptEN, promptJP
app.post('/api/grade', upload.single('audio'), async (req, res) => {
  const file = req.file;
  if (!file) return res.status(400).json({ error: 'audio file is required' });

  const { taskLabel = '', promptEN = '', promptJP = '' } = req.body;

  try {
    const transcriptionResp = await openai.audio.transcriptions.create({
      file: await toFile(fs.createReadStream(file.path), file.originalname || 'audio.m4a'),
      model: 'whisper-1',
    });
    const transcript = transcriptionResp.text || '';

    const gradingResp = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content:
            'あなたは英語スピーキングのコーチです。ユーザーの発話（文字起こし）を、与えられた課題に対する回答として評価してください。' +
            '文法・語彙の正確さ、課題への関連性、内容の具体性を基準に判定します。' +
            '必ず次のJSON形式のみで回答してください: {"pass": boolean, "comment": "日本語で2〜3文の添削コメント"}',
        },
        {
          role: 'user',
          content: `課題（${taskLabel}）: "${promptEN}"（日本語: ${promptJP}）\n\nユーザーの発話の文字起こし:\n"${transcript}"`,
        },
      ],
    });

    const parsed = JSON.parse(gradingResp.choices[0].message.content);
    res.json({ transcript, pass: Boolean(parsed.pass), comment: String(parsed.comment || '') });
  } catch (err) {
    console.error('grade error:', err);
    res.status(500).json({ error: 'grading_failed', detail: String(err.message || err) });
  } finally {
    fs.unlink(file.path, () => {});
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`TEPPEN-ENGLISH server listening on :${PORT}`);
});
