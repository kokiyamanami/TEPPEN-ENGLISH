import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useGoals } from '../store/GoalsContext';
import { useStats } from '../store/StatsContext';
import { colors, radius, spacing } from '../theme/colors';

const SIZE = 52;
const STROKE = 6;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function Ring({ label, doneMin, goalMin, color }: { label: string; doneMin: number; goalMin: number; color: string }) {
  const pct = goalMin > 0 ? Math.min(1, doneMin / goalMin) : 0;
  return (
    <View style={styles.item}>
      <View style={styles.ringWrap}>
        <Svg width={SIZE} height={SIZE}>
          <Circle cx={SIZE / 2} cy={SIZE / 2} r={RADIUS} stroke={colors.border} strokeWidth={STROKE} fill="none" />
          <Circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            stroke={color}
            strokeWidth={STROKE}
            fill="none"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={CIRCUMFERENCE * (1 - pct)}
            strokeLinecap="round"
            transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
          />
        </Svg>
        <Text style={styles.ringText}>{Math.round(pct * 100)}%</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>
          {doneMin} / {goalMin}分
        </Text>
      </View>
    </View>
  );
}

// 今日の発話時間・学習時間を、目標（目標設定画面の1日の目標）に対する達成率のリングで表示する。
// ミッション画面・トレーニング画面で共通利用
export function TodayTimeWidget() {
  const { todaySpeakMinutes, todayStudyMinutes } = useStats();
  const { speakGoal, studyGoal } = useGoals();
  return (
    <View style={styles.card}>
      <Ring label="今日の発話時間" doneMin={todaySpeakMinutes} goalMin={speakGoal} color={colors.coral} />
      <View style={styles.divider} />
      <Ring label="今日の学習時間" doneMin={todayStudyMinutes} goalMin={studyGoal} color={colors.success} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    backgroundColor: colors.white,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.md,
  },
  item: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  divider: { width: 1, alignSelf: 'stretch', backgroundColor: colors.border },
  ringWrap: { width: SIZE, height: SIZE, alignItems: 'center', justifyContent: 'center' },
  ringText: { position: 'absolute', fontSize: 11, fontWeight: '700', color: colors.textPrimary },
  label: { fontSize: 11, color: colors.textSecondary },
  value: { fontSize: 14, fontWeight: '700', color: colors.textPrimary, marginTop: 2 },
});
