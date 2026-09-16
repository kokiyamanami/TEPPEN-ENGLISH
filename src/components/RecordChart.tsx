import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ChartBucket } from '../data/records';
import { colors, spacing } from '../theme/colors';

const BAR_MAX_HEIGHT = 90;

export function RecordChart({
  buckets,
  selectedIdx,
  onSelect,
  canOlder,
  canNewer,
  onOlder,
  onNewer,
  showNav,
}: {
  buckets: ChartBucket[];
  selectedIdx: number;
  onSelect: (i: number) => void;
  canOlder: boolean;
  canNewer: boolean;
  onOlder: () => void;
  onNewer: () => void;
  showNav: boolean;
}) {
  const max = Math.max(...buckets.map((b) => b.studyMin), 1);

  const bars = (
    <View style={styles.barsRow}>
      {buckets.map((b, i) => {
        const totalH = Math.round((b.studyMin / max) * BAR_MAX_HEIGHT);
        const speakH = b.studyMin ? Math.round(totalH * (b.speakMin / b.studyMin)) : 0;
        const otherH = totalH - speakH;
        return (
          <Pressable key={i} style={styles.barCol} onPress={() => onSelect(i)}>
            <View style={[styles.stack, { height: Math.max(totalH, 2) }, i === selectedIdx && styles.stackSel]}>
              <View style={[styles.segStudy, { height: otherH }]} />
              <View style={[styles.segSpeak, { height: speakH }]} />
            </View>
            <Text style={[styles.barLabel, i === selectedIdx && styles.barLabelSel]}>{b.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );

  if (!showNav) return bars;

  return (
    <View style={styles.navRow}>
      <Pressable style={[styles.navBtn, !canOlder && styles.navBtnDisabled]} onPress={onOlder} disabled={!canOlder}>
        <Ionicons name="chevron-back" size={16} color={canOlder ? colors.textPrimary : colors.border} />
      </Pressable>
      <View style={styles.chartFlex}>{bars}</View>
      <Pressable style={[styles.navBtn, !canNewer && styles.navBtnDisabled]} onPress={onNewer} disabled={!canNewer}>
        <Ionicons name="chevron-forward" size={16} color={canNewer ? colors.textPrimary : colors.border} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  navRow: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.xs },
  chartFlex: { flex: 1 },
  navBtn: { width: 24, height: 24, borderRadius: 12, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  navBtnDisabled: { opacity: 0.4 },
  barsRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-around', height: BAR_MAX_HEIGHT + 24 },
  barCol: { alignItems: 'center', flex: 1 },
  stack: { width: 16, borderRadius: 4, overflow: 'hidden', backgroundColor: colors.border, flexDirection: 'column-reverse' },
  stackSel: { borderWidth: 1, borderColor: colors.navy },
  segStudy: { backgroundColor: colors.navyLight, width: '100%' },
  segSpeak: { backgroundColor: colors.coral, width: '100%' },
  barLabel: { fontSize: 10, color: colors.textSecondary, marginTop: 4 },
  barLabelSel: { color: colors.textPrimary, fontWeight: '700' },
});
