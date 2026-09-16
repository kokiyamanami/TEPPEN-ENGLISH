import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { TopBar } from '../src/components/TopBar';
import { colors, radius, spacing } from '../src/theme/colors';

// screen key: plans
export default function PlansScreen() {
  return (
    <ScrollView style={styles.screen}>
      <TopBar title="プラン" backRoute="/(tabs)/mypage" />

      <View style={styles.hero}>
        <Text style={styles.heroEyebrow}>PLAN</Text>
        <Text style={styles.heroTitle}>あなたのペースに、伴走を。</Text>
        <Text style={styles.heroSub}>
          独学のフリー練習から、プロコーチの本格コーチングまで。{'\n'}今の自分に合った形で、頂を目指せます。
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.planName}>無料プラン</Text>
        <Text style={styles.planPrice}>
          ¥0<Text style={styles.planPriceUnit}>/月</Text>
        </Text>
        <PlanList items={['AI添削（基本機能）', 'フリー練習・MYフレーズ', 'Dailyミッション']} />
        <View style={styles.currentBadge}>
          <Text style={styles.currentBadgeText}>現在のプラン</Text>
        </View>
      </View>

      <View style={[styles.card, styles.cardFeatured]}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>おすすめ</Text>
        </View>
        <Text style={styles.planName}>990円プラン</Text>
        <Text style={styles.planPrice}>
          ¥990<Text style={styles.planPriceUnit}>/月</Text>
        </Text>
        <Text style={styles.planNote}>初回7日間は無料でお試しいただけます</Text>
        <PlanList items={['全教材が使い放題', 'Weekly / Monthlyミッション', '詳細な記録・グループランキング', '動画講座 見放題']} />
        <Pressable style={styles.ctaBtn}>
          <Text style={styles.ctaBtnText}>7日間無料で試してみる</Text>
        </Pressable>
        <Text style={styles.trust}>いつでも解約可能・違約金なし</Text>
      </View>

      <View style={[styles.card, styles.cardCoach]}>
        <Text style={styles.coachEyebrow}>MOST COMMITTED</Text>
        <Text style={[styles.planName, styles.coachPlanName]}>TEPPEN ENGLISH{'\n'}コーチング</Text>
        <Text style={styles.coachPrice}>お問い合わせ</Text>
        <PlanList items={['専属コーチによる週次フィードバック', 'あなた専用の学習設計', '実務シーンでの反復練習']} dark />
        <Pressable style={styles.ctaBtnDark} onPress={() => router.push('/coach_teppen')}>
          <Text style={styles.ctaBtnText}>無料相談を予約する</Text>
        </Pressable>
      </View>

      <Text style={styles.faq}>迷ったら、まずは990円プランの無料トライアルから始めるのがおすすめです。</Text>
    </ScrollView>
  );
}

function PlanList({ items, dark }: { items: string[]; dark?: boolean }) {
  return (
    <View style={styles.list}>
      {items.map((t) => (
        <View key={t} style={styles.listItem}>
          <Ionicons name="checkmark" size={14} color={dark ? colors.coralLight : colors.coral} />
          <Text style={[styles.listText, dark && styles.listTextDark]}>{t}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  hero: { padding: spacing.lg },
  heroEyebrow: { color: colors.coral, fontSize: 10, fontWeight: '700' },
  heroTitle: { fontSize: 18, fontWeight: '700', color: colors.textPrimary, marginTop: spacing.xs },
  heroSub: { fontSize: 12, color: colors.textSecondary, marginTop: spacing.sm, lineHeight: 18 },
  card: { margin: spacing.lg, marginTop: 0, marginBottom: spacing.md, backgroundColor: colors.white, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.lg },
  cardFeatured: { borderColor: colors.coral, borderWidth: 2 },
  cardCoach: { backgroundColor: colors.navy, borderColor: colors.navy },
  badge: { position: 'absolute', top: -10, left: spacing.lg, backgroundColor: colors.coral, borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 2 },
  badgeText: { color: colors.white, fontSize: 10, fontWeight: '700' },
  coachEyebrow: { color: colors.coralLight, fontSize: 10, fontWeight: '700' },
  planName: { fontSize: 15, fontWeight: '700', color: colors.textPrimary, marginTop: spacing.sm },
  planPrice: { fontSize: 26, fontWeight: '700', color: colors.textPrimary, marginTop: spacing.xs },
  planPriceUnit: { fontSize: 12, fontWeight: '400', color: colors.textSecondary },
  planNote: { fontSize: 10, color: colors.coral, marginTop: 2 },
  coachPrice: { fontSize: 16, fontWeight: '700', color: colors.white, marginTop: spacing.xs },
  list: { marginTop: spacing.md, gap: spacing.xs },
  listItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  listText: { fontSize: 12, color: colors.textPrimary },
  listTextDark: { color: colors.white },
  coachPlanName: { color: colors.white },
  currentBadge: { marginTop: spacing.md, alignItems: 'center', paddingVertical: spacing.sm, borderRadius: radius.pill, backgroundColor: colors.background },
  currentBadgeText: { fontSize: 12, color: colors.textSecondary, fontWeight: '600' },
  ctaBtn: { marginTop: spacing.lg, backgroundColor: colors.coral, borderRadius: radius.pill, alignItems: 'center', paddingVertical: spacing.md },
  ctaBtnDark: { marginTop: spacing.lg, backgroundColor: colors.coral, borderRadius: radius.pill, alignItems: 'center', paddingVertical: spacing.md },
  ctaBtnText: { color: colors.white, fontWeight: '700' },
  trust: { textAlign: 'center', fontSize: 10, color: colors.textSecondary, marginTop: spacing.sm },
  faq: { textAlign: 'center', fontSize: 11, color: colors.textSecondary, marginHorizontal: spacing.lg, marginBottom: spacing.xl, lineHeight: 17 },
});
