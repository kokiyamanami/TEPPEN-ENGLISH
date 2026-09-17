// 登頂マイルストーン（キリン〜エベレスト）のイラストをOpenAI Image APIで生成し、
// server/public/milestones/{order}.png として保存する一回限りのスクリプト。
// 実行: node scripts/generateMilestoneImages.js
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const https = require('https');
const OpenAI = require('openai');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const OUT_DIR = path.join(__dirname, '..', 'public', 'milestones');
fs.mkdirSync(OUT_DIR, { recursive: true });

const STYLE =
  'flat vector illustration, minimalist gamified mobile-app milestone icon, soft warm color palette (navy blue and gold accents), ' +
  'clean simple shapes, centered composition, plain light background, no text, no watermark';

const MILESTONES = [
  { order: 1, subject: 'a cute giraffe standing, full body' },
  { order: 2, subject: "Kinkaku-ji (the Golden Pavilion temple) in Kyoto" },
  { order: 3, subject: 'Osaka Castle main tower' },
  { order: 4, subject: 'Tsutenkaku Tower in Osaka' },
  { order: 5, subject: 'Tokyo Tower' },
  { order: 6, subject: 'Tokyo Skytree' },
  { order: 7, subject: 'Mount Rokko forested mountain range' },
  { order: 8, subject: 'Mount Fuji with snow cap' },
  { order: 9, subject: 'Mount Kilimanjaro' },
  { order: 10, subject: 'Mount Everest peak' },
];

function download(url, filePath) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        if (res.statusCode !== 200) return reject(new Error(`download failed: ${res.statusCode}`));
        const file = fs.createWriteStream(filePath);
        res.pipe(file);
        file.on('finish', () => file.close(resolve));
      })
      .on('error', reject);
  });
}

async function main() {
  for (const m of MILESTONES) {
    const outPath = path.join(OUT_DIR, `${m.order}.png`);
    if (fs.existsSync(outPath)) {
      console.log(`skip (exists): ${m.order}.png`);
      continue;
    }
    console.log(`generating ${m.order}.png (${m.subject})...`);
    const resp = await openai.images.generate({
      model: 'gpt-image-1',
      prompt: `${m.subject}. ${STYLE}`,
      size: '1024x1024',
      n: 1,
    });
    const item = resp.data[0];
    if (item.b64_json) {
      fs.writeFileSync(outPath, Buffer.from(item.b64_json, 'base64'));
    } else {
      await download(item.url, outPath);
    }
    console.log(`saved ${m.order}.png`);
  }
  console.log('done.');
}

main().catch((err) => {
  console.error('generateMilestoneImages failed:', err);
  process.exit(1);
});
