import { Ionicons } from '@expo/vector-icons';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { TopBar } from '../src/components/TopBar';
import { colors, radius, spacing } from '../src/theme/colors';

const FEATURES: { icon: keyof typeof Ionicons.glyphMap; title: string; text: string }[] = [
  { icon: 'megaphone-outline', title: '代理店手数料¥0', text: '基本サポート・手数料が無料。最低価格保証もついています。' },
  { icon: 'book-outline', title: '留学前の「プレ留学」', text: '渡航前に英語力を底上げできる、1万通りのカスタムプラン。' },
  { icon: 'people-outline', title: '経験豊富なカウンセラー', text: '一人ひとりの目的に合わせて、国・学校選びから伴走します。' },
];

const STATS = [
  { num: '10万件+', label: '留学サポート実績' },
  { num: '95.7%', label: '留学満足度' },
  { num: '10,000通り', label: '留学プラン' },
];

// screen key: sw_lp（自作サンプルLP）
export default function SwLpScreen() {
  const open = () => Linking.openURL('https://schoolwith.me/');

  return (
    <ScrollView style={styles.screen}>
      <TopBar title="スクールウィズ" backRoute="/(tabs)/talk_list" />

      <View style={styles.hero}>
        <Text style={styles.eyebrow}>留学エージェント スクールウィズ</Text>
        <Text style={styles.headline}>留学も英語も、まるっとお任せ。</Text>
        <Text style={styles.sub}>留学手数料¥0・最低価格保証。経験豊富なカウンセラーが、あなたにベストな留学体験をサポートします。</Text>
        <Pressable style={styles.cta} onPress={open}>
          <Text style={styles.ctaText}>無料でカウンセラーに相談する</Text>
        </Pressable>
      </View>

      <Text style={styles.sectionTitle}>選ばれる理由</Text>
      <View style={styles.features}>
        {FEATURES.map((f) => (
          <View key={f.title} style={styles.featureCard}>
            <Ionicons name={f.icon} size={22} color={colors.coral} />
            <Text style={styles.featureTitle}>{f.title}</Text>
            <Text style={styles.featureText}>{f.text}</Text>
          </View>
        ))}
      </View>

      <View style={styles.stats}>
        {STATS.map((s) => (
          <View key={s.label} style={styles.stat}>
            <Text style={styles.statNum}>{s.num}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      <View style={styles.quoteCard}>
        <Text style={styles.quoteText}>
          「スクールウィズのサポートで準備万全！セブ島留学を経て、洋画を字幕なしで楽しめるようになりました。」
        </Text>
        <Text style={styles.quoteAuth}>— 社会人（27歳）・フィリピン留学</Text>
      </View>

      <View style={styles.finalCta}>
        <Text style={styles.finalTitle}>まずは無料カウンセリングから</Text>
        <Pressable style={[styles.cta, styles.ctaLight]} onPress={open}>
          <Text style={styles.ctaLightText}>スクールウィズの詳細を見る</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  hero: { backgroundColor: colors.navy, padding: spacing.lg, paddingBottom: spacing.xl },
  eyebrow: { color: colors.coralLight, fontSize: 11 },
  headline: { color: colors.white, fontSize: 22, fontWeight: '700', marginTop: spacing.sm },
  sub: { color: colors.white, fontSize: 12, marginTop: spacing.sm, opacity: 0.85, lineHeight: 18 },
  cta: { backgroundColor: colors.coral, borderRadius: radius.pill, paddingVertical: spacing.md, alignItems: 'center', marginTop: spacing.lg },
  ctaText: { color: colors.white, fontWeight: '700' },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: colors.textPrimary, marginHorizontal: spacing.lg, marginTop: spacing.xl, marginBottom: spacing.sm },
  features: { paddingHorizontal: spacing.lg, gap: spacing.sm },
  featureCard: { backgroundColor: colors.white, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.md },
  featureTitle: { fontWeight: '700', color: colors.textPrimary, marginTop: spacing.sm, fontSize: 13 },
  featureText: { fontSize: 11, color: colors.textSecondary, marginTop: spacing.xs, lineHeight: 16 },
  stats: { flexDirection: 'row', justifyContent: 'space-around', marginHorizontal: spacing.lg, marginTop: spacing.xl },
  stat: { alignItems: 'center' },
  statNum: { fontSize: 16, fontWeight: '700', color: colors.coral },
  statLabel: { fontSize: 10, color: colors.textSecondary, marginTop: 2 },
  quoteCard: { margin: spacing.lg, backgroundColor: colors.white, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.md },
  quoteText: { fontSize: 12, color: colors.textPrimary, lineHeight: 19, fontStyle: 'italic' },
  quoteAuth: { fontSize: 10, color: colors.textSecondary, marginTop: spacing.sm },
  finalCta: { alignItems: 'center', padding: spacing.lg, marginBottom: spacing.xl },
  finalTitle: { fontSize: 14, fontWeight: '700', color: colors.textPrimary, marginBottom: spacing.md },
  ctaLight: { backgroundColor: colors.navy, width: '100%' },
  ctaLightText: { color: colors.white, fontWeight: '700' },
});
