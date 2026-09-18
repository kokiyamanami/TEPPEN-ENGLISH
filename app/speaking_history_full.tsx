import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { TopBar } from '../src/components/TopBar';
import { useSpeakingLog } from '../src/hooks/useSpeakingLog';
import { colors, radius, spacing } from '../src/theme/colors';
import { shortMd } from '../src/utils/dateHelpers';

type KindFilter = 'all' | 'daily' | 'weekly' | 'monthly' | 'other';
type PassFilter = 'all' | 'pass' | 'fail';

const KIND_LABELS: Record<KindFilter, string> = { all: '全て', daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly', other: 'その他' };
const PASS_LABELS: Record<PassFilter, string> = { all: '全て', pass: '合格', fail: '不合格' };

// screen key: speaking_history_full
export default function SpeakingHistoryFullScreen() {
  const log = useSpeakingLog();
  const [kindFilter, setKindFilter] = useState<KindFilter>('all');
  const [passFilter, setPassFilter] = useState<PassFilter>('all');

  const filtered = log.filter((s) => {
    if (kindFilter !== 'all' && s.kind !== kindFilter) return false;
    if (passFilter !== 'all') {
      if (s.pass === undefined) return false;
      if (passFilter === 'pass' && !s.pass) return false;
      if (passFilter === 'fail' && s.pass) return false;
    }
    return true;
  });

  return (
    <ScrollView style={styles.screen}>
      <TopBar title="スピーキング履歴（全て）" backRoute="/(tabs)/records" />

      <View style={styles.filterRow}>
        {(Object.keys(KIND_LABELS) as KindFilter[]).map((k) => (
          <Pressable key={k} style={[styles.chip, kindFilter === k && styles.chipSel]} onPress={() => setKindFilter(k)}>
            <Text style={[styles.chipText, kindFilter === k && styles.chipTextSel]}>{KIND_LABELS[k]}</Text>
          </Pressable>
        ))}
      </View>
      <View style={styles.filterRow}>
        {(Object.keys(PASS_LABELS) as PassFilter[]).map((k) => (
          <Pressable key={k} style={[styles.chip, passFilter === k && styles.chipSel]} onPress={() => setPassFilter(k)}>
            <Text style={[styles.chipText, passFilter === k && styles.chipTextSel]}>{PASS_LABELS[k]}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.card}>
        {filtered.map((s, i) => (
          <View key={i} style={[styles.row, i > 0 && styles.rowBordered]}>
            <Text style={styles.title} numberOfLines={1}>
              {s.title}
            </Text>
            {s.pass !== undefined && (
              <Text style={[styles.passIcon, { color: s.pass ? colors.success : colors.danger }]}>{s.pass ? '✓' : '✕'}</Text>
            )}
            <Text style={styles.date}>{shortMd(s.date)}</Text>
          </View>
        ))}
        {filtered.length === 0 && <Text style={styles.empty}>該当する記録がありません</Text>}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginHorizontal: spacing.lg, marginTop: spacing.md },
  chip: { paddingVertical: 6, paddingHorizontal: spacing.sm, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border },
  chipSel: { backgroundColor: colors.navy, borderColor: colors.navy },
  chipText: { fontSize: 11, color: colors.textSecondary },
  chipTextSel: { color: colors.white },
  card: { margin: spacing.lg, backgroundColor: colors.white, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md },
  rowBordered: { borderTopWidth: 1, borderTopColor: colors.border },
  title: { flex: 1, fontSize: 12, color: colors.textPrimary },
  passIcon: { fontSize: 13, fontWeight: '700' },
  date: { fontSize: 11, color: colors.textSecondary },
  empty: { textAlign: 'center', padding: spacing.lg, color: colors.textSecondary, fontSize: 12 },
});
