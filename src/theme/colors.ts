// TEPPEN ENGLISH公式ブランドブック準拠のカラーパレット
// https://hsato-lgtm.github.io/teppen-english-brand-book/
export const colors = {
  navy: '#00375D', // Navy Primary
  navyLight: '#133D5F', // Navy（明るめ、カード等のセカンダリ面）
  white: '#FFFFFF',
  coral: '#076FB3', // CTA Blue（旧coralの役割を継承。CTA・強調）
  coralLight: '#4185BE', // CTA Blueのライト版
  background: '#E4EBEF', // Light Blue Gray（セクション背景）
  border: '#EEEEEE', // Border Gray
  textPrimary: '#333333', // Text Dark
  textSecondary: '#6B7280', // ブランドブック未規定のため近似値
  success: '#3C9A5F', // ブランドブック未規定（機能色として維持）
  danger: '#E53E3E',
  goldAccent: '#C69D58', // Gold Dark（達成・プレミアム演出用アクセント）
  goldLight: '#FDECBB',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 20,
  pill: 999,
} as const;
