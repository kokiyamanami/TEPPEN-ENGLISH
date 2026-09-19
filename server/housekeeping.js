const fs = require('fs');
const path = require('path');

// ディレクトリ内のファイルを掃除する。maxAgeMs より古いものを消し、それでも合計が maxTotalBytes を超えるなら古い順に消す。
// TTS音声のキャッシュ・アップロードの一時ファイルが、ディスクを埋め尽くさないようにするためのもの
function sweepDir(dir, { maxAgeMs, maxTotalBytes = Infinity, now = Date.now() } = {}) {
  let files;
  try {
    files = fs
      .readdirSync(dir)
      .map((name) => {
        const full = path.join(dir, name);
        const st = fs.statSync(full);
        return st.isFile() ? { full, size: st.size, mtime: st.mtimeMs } : null;
      })
      .filter(Boolean)
      .sort((a, b) => a.mtime - b.mtime); // 古い順
  } catch {
    return { removed: 0, freedBytes: 0 };
  }

  let total = files.reduce((sum, f) => sum + f.size, 0);
  let removed = 0;
  let freedBytes = 0;
  for (const f of files) {
    const tooOld = maxAgeMs !== undefined && now - f.mtime > maxAgeMs;
    if (!tooOld && total <= maxTotalBytes) break; // 古い順に見ているので、以降は残してよい
    try {
      fs.unlinkSync(f.full);
      removed++;
      freedBytes += f.size;
      total -= f.size;
    } catch {
      // 別の処理が使用中などで消せなければ、次回に回す
    }
  }
  return { removed, freedBytes };
}

// 起動時と、その後は intervalMs ごとに掃除する。プロセス終了を妨げないよう unref する
function scheduleSweep(dir, options, intervalMs = 60 * 60 * 1000) {
  const run = () => sweepDir(dir, options);
  run();
  const timer = setInterval(run, intervalMs);
  timer.unref();
  return timer;
}

module.exports = { sweepDir, scheduleSweep };
