// プロトタイプのtoSlashReading()を移植。カンマ・接続詞の位置でスラッシュを挿入する簡易ロジック
export function toSlashReading(text: string): string {
  let result = text
    .replace(/, /g, ', / ')
    .replace(
      /\s\b(and|but|because|which|while|so that|that|so we|so I|before|after|if|when|where|who|could you|would it|let's)\b/gi,
      ' / $1'
    );

  result = result
    .split(' / ')
    .map((seg) => {
      const words = seg.trim().split(/\s+/);
      if (words.length > 7) {
        const mid = Math.ceil(words.length / 2);
        return words.slice(0, mid).join(' ') + ' / ' + words.slice(mid).join(' ');
      }
      return seg;
    })
    .join(' / ');

  return result;
}
