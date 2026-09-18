import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { StudyLogEntry } from '../data/records';
import { colors, radius, spacing } from '../theme/colors';
import { dateKey } from '../utils/dateHelpers';

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'];
const FLAME = '#F2711C';
const FLAME_HOT = '#E5484D';

export type StreakInfo = { current: number; best: number; todayAchieved: boolean; remainingMin: number };

function flameColor(n: number) {
  if (n <= 0) return colors.textSecondary;
  if (n >= 30) return colors.goldAccent;
  if (n >= 7) return FLAME_HOT;
  return FLAME;
}

// 連続達成日数の表示。今日まだ達成していなくても、昨日まで続いていれば日付が変わるまでは継続扱い
export function StreakBanner({ streak }: { streak: StreakInfo }) {
  const { current, best, todayAchieved, remainingMin } = streak;
  const color = flameColor(current);
  let message: string;
  if (current === 0) message = 'まずは今日の目標を達成して、火を灯そう';
  else if (todayAchieved) message = '今日の目標達成！この調子で明日もつなげよう';
  else message = `あと${remainingMin}分で今日も達成。連続記録をつなごう！`;
  return (
    <View style={[styles.streakCard, current > 0 && { borderColor: color }]}>
      <View style={[styles.flameCircle, { backgroundColor: current > 0 ? color : colors.border }]}>
        <Ionicons name={current > 0 ? 'flame' : 'flame-outline'} size={26} color={current > 0 ? colors.white : colors.textSecondary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.streakMain}>
          <Text style={[styles.streakNum, { color }]}>{current}</Text>
          <Text style={styles.streakUnit}> 日連続達成中</Text>
        </Text>
        <Text style={styles.streakMsg}>{message}</Text>
      </View>
      <View style={styles.bestBox}>
        <Text style={styles.bestLabel}>自己ベスト</Text>
        <Text style={styles.bestValue}>{best}日</Text>
      </View>
    </View>
  );
}

export function CalendarGrid({
  month,
  entries,
  achieved,
  onPrevMonth,
  onNextMonth,
  onSelectDay,
}: {
  month: Date;
  entries: Record<string, StudyLogEntry[]>;
  achieved: Set<string>;
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
            const hasData = !!entries[dateKey(cellDate)]?.length;
            const isAchieved = achieved.has(dateKey(cellDate));
            const col = (startWeekday + d - 1) % 7;
            // 連続で目標達成した日は帯でつなげて表示する（週の端では区切る）
            const joinLeft = isAchieved && col > 0 && achieved.has(dateKey(new Date(year, mo, d - 1)));
            const joinRight = isAchieved && col < 6 && achieved.has(dateKey(new Date(year, mo, d + 1)));
            return (
              <Pressable key={i} style={styles.cell} disabled={isFuture} onPress={() => onSelectDay(cellDate)}>
                <View
                  style={[
                    styles.cellInner,
                    hasData && styles.cellHasData,
                    isAchieved && styles.cellAchieved,
                    isAchieved && { borderTopLeftRadius: joinLeft ? 0 : 999, borderBottomLeftRadius: joinLeft ? 0 : 999, borderTopRightRadius: joinRight ? 0 : 999, borderBottomRightRadius: joinRight ? 0 : 999 },
                    isToday && styles.cellToday,
                  ]}
                >
                  <Text style={[styles.cellText, hasData && styles.cellTextData, isAchieved && styles.cellTextAchieved, isFuture && styles.cellTextFuture]}>{d}</Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendSw, { backgroundColor: colors.background }]} />
          <Text style={styles.legendText}>記録なし（タップで登録）</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendSw, { backgroundColor: 'rgba(7,111,179,0.28)' }]} />
          <Text style={styles.legendText}>記録あり</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendSw, { backgroundColor: FLAME }]} />
          <Text style={styles.legendText}>目標達成</Text>
        </View>
      </View>
    </View>
  );
}

const CELL_SIZE = '14.2857%';

const styles = StyleSheet.create({
  navRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.lg, marginBottom: spacing.sm },
  navBtn: { width: 28, height: 28, borderRadius: 14, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  monthLabel: { fontSize: 14, fontWeight: '700', color: colors.textPrimary, width: 100, textAlign: 'center' },
  grid: { backgroundColor: colors.white, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.sm },
  weekdayRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.xs },
  weekday: { width: CELL_SIZE, textAlign: 'center', fontSize: 10, color: colors.textSecondary },
  daysWrap: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: CELL_SIZE, height: 36, justifyContent: 'center', marginVertical: 2 },
  cellInner: { height: 30, alignItems: 'center', justifyContent: 'center', borderRadius: 999 },
  cellHasData: { backgroundColor: 'rgba(7,111,179,0.15)' },
  cellAchieved: { backgroundColor: FLAME },
  cellToday: { borderWidth: 1.5, borderColor: colors.navy },
  cellText: { fontSize: 11, color: colors.textPrimary },
  cellTextData: { color: colors.coral, fontWeight: '700' },
  cellTextAchieved: { color: colors.white, fontWeight: '800' },
  cellTextFuture: { color: colors.border },
  streakCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.white, borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.border, padding: spacing.md, marginBottom: spacing.md },
  flameCircle: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  streakMain: { color: colors.textPrimary },
  streakNum: { fontSize: 28, fontWeight: '800' },
  streakUnit: { fontSize: 13, fontWeight: '700' },
  streakMsg: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  bestBox: { alignItems: 'center' },
  bestLabel: { fontSize: 9, color: colors.textSecondary },
  bestValue: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  legend: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.sm },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendSw: { width: 8, height: 8, borderRadius: 2 },
  legendText: { fontSize: 10, color: colors.textSecondary },
});
