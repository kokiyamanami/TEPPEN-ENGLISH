import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { TopBar } from '../src/components/TopBar';
import { situationalHistory } from '../src/data/situational';
import { colors, radius, spacing } from '../src/theme/colors';

const SCENES: { label: string; nav: string; scene?: string }[] = [
  { label: '社内ミーティング', nav: '/situational_dialogue', scene: '社内ミーティング' },
  { label: '同僚との会話', nav: '/situational_dialogue', scene: '同僚との会話' },
  { label: 'プレゼンテーション', nav: '/presentation_material' },
  { label: '社外でのやりとり', nav: '/situational_dialogue', scene: '社外でのやりとり' },
];

// screen key: situational
export default function SituationalScreen() {
  const preview = situationalHistory.slice(0, 5);

  const goScene = (nav: string, scene?: string) => {
    router.push(scene ? ({ pathname: nav, params: { scene } } as never) : (nav as never));
  };

  return (
    <ScrollView style={styles.screen}>
      <TopBar title="シチュエーション別課題" backRoute="/input_hub" />

      <Text style={styles.sectionTitle}>シーンを選んで生成（本日あと1回）</Text>
      <View style={styles.list}>
        {SCENES.map((s) => (
          <Pressable key={s.label} style={styles.card} onPress={() => goScene(s.nav, s.scene)}>
            <View style={styles.iconWrap}>
              <Ionicons name="people-outline" size={18} color={colors.navy} />
            </View>
            <Text style={styles.cardTitle}>{s.label}</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
          </Pressable>
        ))}
      </View>

      <View style={styles.historyHeader}>
        <Text style={styles.sectionTitle}>過去に生成した教材</Text>
        {situationalHistory.length > 5 && (
          <Pressable onPress={() => router.push('/situational_history_full')}>
            <Text style={styles.link}>全て見る</Text>
          </Pressable>
        )}
      </View>
      <View style={styles.historyCard}>
        {preview.map((h, i) => (
          <Pressable
            key={i}
            style={[styles.historyRow, i > 0 && styles.historyRowBordered]}
            onPress={() => goScene(`/${h.nav}`, h.scene)}
          >
            <View style={styles.historyLeft}>
              <Text style={styles.historyScene}>{h.scene}</Text>
              <Text style={styles.historyTag}>{h.type}</Text>
            </View>
            <Text style={styles.historyDate}>{h.date}</Text>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: colors.textPrimary, marginHorizontal: spacing.lg, marginTop: spacing.lg, marginBottom: spacing.sm },
  list: { paddingHorizontal: spacing.lg, gap: spacing.sm },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.white,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  iconWrap: { width: 36, height: 36, borderRadius: radius.sm, backgroundColor: 'rgba(15,36,57,0.06)', alignItems: 'center', justifyContent: 'center' },
  cardTitle: { flex: 1, fontWeight: '600', color: colors.textPrimary },
  historyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginRight: spacing.lg },
  link: { color: colors.coral, fontSize: 12, fontWeight: '600' },
  historyCard: { marginHorizontal: spacing.lg, backgroundColor: colors.white, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.xl },
  historyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.md },
  historyRowBordered: { borderTopWidth: 1, borderTopColor: colors.border },
  historyLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  historyScene: { fontWeight: '600', color: colors.textPrimary, fontSize: 13 },
  historyTag: { fontSize: 10, color: colors.textSecondary, backgroundColor: colors.background, paddingHorizontal: spacing.xs, borderRadius: radius.sm, overflow: 'hidden' },
  historyDate: { fontSize: 12, color: colors.textSecondary },
});
