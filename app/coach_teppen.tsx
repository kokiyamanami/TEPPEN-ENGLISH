import { Ionicons } from '@expo/vector-icons';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { TopBar } from '../src/components/TopBar';
import { colors, radius, spacing } from '../src/theme/colors';

const FEATURES: { icon: keyof typeof Ionicons.glyphMap; title: string; text: string }[] = [
  { icon: 'megaphone-outline', title: '専属コーチが伴走', text: 'AI添削だけでは気づけない癖を、プロが毎週フィードバック。' },
  { icon: 'flag-outline', title: '目標から逆算した設計', text: '昇進・海外赴任・商談突破など、ゴールに合わせて教材を調整。' },
  { icon: 'people-outline', title: '実務シーンで練習', text: 'Base Campで作った教材を、実際の商談・会議形式で反復練習。' },
];

const STATS = [
  { num: '1,200名+', label: '受講実績' },
  { num: '94%', label: '継続率' },
  { num: '4.8/5', label: '満足度' },
];

// screen key: coach_teppen（自作サンプルLP）
export default function CoachTeppenScreen() {
  const open = () => Linking.openURL('https://teppen-english.com/');

  return (
    <ScrollView style={styles.screen}>
      <TopBar title="TEPPEN ENGLISH" backRoute="/plans" />

      <View style={styles.hero}>
        <Text style={styles.eyebrow}>TEPPEN ENGLISH コーチング</Text>
        <Text style={styles.headline}>頂は、独学の先にはない。</Text>
        <Text style={styles.sub}>専属コーチと二人三脚で、ビジネス英語を最短ルートで。</Text>
        <Pressable style={styles.cta} onPress={open}>
          <Text style={styles.ctaText}>無料カウンセリングに申し込む</Text>
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
          「Base Campで作った教材をコーチと音読していたら、実際の商談でも同じ表現が自然に出てくるようになりました。」
        </Text>
        <Text style={styles.quoteAuth}>— IT企業 マーケティングマネージャー</Text>
      </View>

      <View style={styles.finalCta}>
        <Text style={styles.finalTitle}>まずは無料カウンセリングから</Text>
        <Pressable style={[styles.cta, styles.ctaLight]} onPress={open}>
          <Text style={styles.ctaLightText}>TEPPEN ENGLISHの詳細を見る</Text>
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
