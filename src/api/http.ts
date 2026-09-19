// 通信にタイムアウトを付ける fetch。電波が悪い・サーバーが詰まったときに、画面が読み込み中のまま固まり続けないようにする。
// タイムアウトしたら Error('通信がタイムアウトしました') を投げる（呼び出し側の catch でエラー表示に回る）
export const TIMEOUT_MS = {
  default: 20_000,
  // 音声の文字起こし＋AI採点は時間がかかる
  grading: 90_000,
  // AIによる教材生成
  generation: 90_000,
  // 読み上げ音声の生成
  tts: 45_000,
  // 画像アップロード
  upload: 60_000,
} as const;

export async function fetchWithTimeout(input: string, init: RequestInit = {}, timeoutMs: number = TIMEOUT_MS.default): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } catch (e) {
    if ((e as Error).name === 'AbortError') throw new Error('通信がタイムアウトしました');
    throw e;
  } finally {
    clearTimeout(timer);
  }
}
