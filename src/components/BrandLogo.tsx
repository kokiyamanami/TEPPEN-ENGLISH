import { Image, StyleSheet, View } from 'react-native';
import { colors, radius, spacing } from '../theme/colors';

const LOGO_RATIO = 293 / 119;

// 公式ブランドブックのロゴ（白抜き版・ネイビー背景専用）
// https://hsato-lgtm.github.io/teppen-english-brand-book/
// カラー版（白背景用）はソースデータが壊れており取得できなかったため、
// 明るい背景に置く場合は contained でネイビーの台座を敷いて視認性を確保する
export function BrandLogo({ width = 160, contained = false }: { width?: number; contained?: boolean }) {
  const img = (
    <Image
      source={require('../../assets/brand/logo-white.png')}
      style={{ width, height: width / LOGO_RATIO }}
      resizeMode="contain"
    />
  );

  if (!contained) return img;

  return <View style={styles.badge}>{img}</View>;
}

const styles = StyleSheet.create({
  badge: {
    backgroundColor: colors.navy,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    alignSelf: 'center',
  },
});
