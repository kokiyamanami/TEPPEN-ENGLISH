import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { StudyLogEntry } from '../data/records';
import { colors, radius, spacing } from '../theme/colors';
import { dateKey } from '../utils/dateHelpers';

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'];

export function CalendarGrid({
  month,
  entries,
  onPrevMonth,
  onNextMonth,
  onSelectDay,
}: {
  month: Date;
  entries: Record<string, StudyLogEntry[]>;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onSelectDay: (d: Date) => void;
}) {
  const year = month.getFullYear();
  const mo = month.getMonth();
  const firstDay = new Date(year, mo, 1);
  const daysInMonth = new Date(year, mo + 1, 0).getDate();
  const startWeekday = firstDay.getDay();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const cells: (number | null)[] = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <View>
      <View style={styles.navRow}>
        <Pressable onPress={onPrevMonth} style={styles.navBtn}>
          <Ionicons name="chevron-back" size={16} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.monthLabel}>
          {year}年{mo + 1}月
        </Text>
        <Pressable onPress={onNextMonth} style={styles.navBtn}>
          <Ionicons name="chevron-forward" size={16} color={colors.textPrimary} />
        </Pressable>
      </View>

      <View style={styles.grid}>
        <View style={styles.weekdayRow}>
          {WEEKDAYS.map((w) => (
            <Text key={w} style={styles.weekday}>
              {w}
            </Text>
          ))}
        </View>
        <View style={styles.daysWrap}>
          {cells.map((d, i) => {
            if (d === null) return <View key={i} style={styles.cell} />;
            const cellDate = new Date(year, mo, d);
            cellDate.setHours(0, 0, 0, 0);
            const isFuture = cellDate > today;
            const isToday = cellDate.getTime() === today.getTime();
            const dayEntries = entries[dateKey(cellDate)];
            const hasData = !!dayEntries?.length;
            return (
              <Pressable
                key={i}
                style={[styles.cell, hasData && styles.cellHasData, isToday && styles.cellToday]}
                disabled={isFuture}
                onPress={() => onSelectDay(cellDate)}
              >
                <Text style={[styles.cellText, hasData && styles.cellTextData, isFuture && styles.cellTextFuture]}>{d}</Text>
                {hasData ? <View style={styles.dot} /> : null}
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendSw, { backgroundColor: colors.coral }]} />
          <Text style={styles.legendText}>記録あり</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendSw, { backgroundColor: colors.navyLight }]} />
          <Text style={styles.legendText}>記録なし（タップで登録）</Text>
        </View>
      </View>
    </View>
  );
}

const CELL_SIZE = '13.5%';

const styles = StyleSheet.create({
  navRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.lg, marginBottom: spacing.sm },
  navBtn: { width: 28, height: 28, borderRadius: 14, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  monthLabel: { fontSize: 14, fontWeight: '700', color: colors.textPrimary, width: 100, textAlign: 'center' },
  grid: { backgroundColor: colors.white, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.sm },
  weekdayRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.xs },
  weekday: { width: CELL_SIZE, textAlign: 'center', fontSize: 10, color: colors.textSecondary },
  daysWrap: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: CELL_SIZE, aspectRatio: 1, alignItems: 'center', justifyContent: 'center', marginVertical: 2 },
  cellHasData: { backgroundColor: 'rgba(232,130,95,0.12)', borderRadius: radius.sm },
  cellToday: { borderWidth: 1, borderColor: colors.navy, borderRadius: radius.sm },
  cellText: { fontSize: 11, color: colors.textPrimary },
  cellTextData: { color: colors.coral, fontWeight: '700' },
  cellTextFuture: { color: colors.border },
  dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: colors.coral, marginTop: 2 },
  legend: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.sm },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendSw: { width: 8, height: 8, borderRadius: 2 },
  legendText: { fontSize: 10, color: colors.textSecondary },
});
