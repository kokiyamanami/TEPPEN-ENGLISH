import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { TopBar } from '../src/components/TopBar';
import { UNIT_DRILL_DAYS, UNIT_DRILL_SENTENCES } from '../src/data/unitmap';
import { colors, radius, spacing } from '../src/theme/colors';

// screen key: unitdrill
// 仕様書3.1: 「答えを見る」は現状表示切替のみのプレースホルダー
export default function UnitDrillScreen() {
  const [dayIdx, setDayIdx] = useState(0);
  const [shownAnswers, setShownAnswers] = useState<Set<number>>(new Set());

  const toggleAnswer = (i: number) => {
    setShownAnswers((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  return (
    <ScrollView style={styles.screen}>
      <TopBar title="学習履歴 · UNIT 10" backRoute="/unitmap" />

      <View style={styles.dayTabs}>
        {UNIT_DRILL_DAYS.map((d, i) => (
          <Pressable key={d} style={[styles.dayTab, dayIdx === i && styles.dayTabSel]} onPress={() => setDayIdx(i)}>
            <Text style={[styles.dayTabText, dayIdx === i && styles.dayTabTextSel]}>{d}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.sectionTitle}>例文</Text>
      <View style={styles.card}>
        {UNIT_DRILL_SENTENCES.map((s, i) => (
          <View key={i} style={[styles.row, i > 0 && styles.rowBordered]}>
            <Text style={styles.jp}>{s.jp}</Text>
            {shownAnswers.has(i) && <Text style={styles.en}>{s.en}</Text>}
            <Pressable style={styles.toggleBtn} onPress={() => toggleAnswer(i)}>
              <Ionicons name={shownAnswers.has(i) ? 'eye-off-outline' : 'eye-outline'} size={13} color={colors.textPrimary} />
              <Text style={styles.toggleText}>{shownAnswers.has(i) ? '答えを隠す' : '答えを見る'}</Text>
            </Pressable>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  dayTabs: { flexDirection: 'row', gap: spacing.xs, paddingHorizontal: spacing.lg, marginTop: spacing.md },
  dayTab: { paddingVertical: spacing.xs, paddingHorizontal: spacing.sm, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border },
  dayTabSel: { backgroundColor: colors.navy, borderColor: colors.navy },
  dayTabText: { fontSize: 11, color: colors.textSecondary },
  dayTabTextSel: { color: colors.white },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: colors.textPrimary, marginHorizontal: spacing.lg, marginTop: spacing.lg, marginBottom: spacing.sm },
  card: { marginHorizontal: spacing.lg, backgroundColor: colors.white, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.xl },
  row: { padding: spacing.md },
  rowBordered: { borderTopWidth: 1, borderTopColor: colors.border },
  jp: { fontSize: 12, color: colors.textSecondary },
  en: { fontSize: 13, color: colors.textPrimary, fontWeight: '600', marginTop: spacing.xs },
  toggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    alignSelf: 'flex-start',
    marginTop: spacing.sm,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm,
    backgroundColor: colors.background,
  },
  toggleText: { fontSize: 11, color: colors.textPrimary },
});
