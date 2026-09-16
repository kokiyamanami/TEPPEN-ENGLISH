import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { colors, radius, spacing } from '../theme/colors';

const SIZE = 56;
const STROKE = 6;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

// TODO(Phase10): 実際の発話時間実績に置き換え
export function SpeechTimeWidget({ doneMin = 16, goalMin = 30 }: { doneMin?: number; goalMin?: number }) {
  const pct = Math.min(1, doneMin / goalMin);
  const dashOffset = CIRCUMFERENCE * (1 - pct);

  return (
    <View style={styles.card}>
      <View style={styles.ringWrap}>
        <Svg width={SIZE} height={SIZE}>
          <Circle cx={SIZE / 2} cy={SIZE / 2} r={RADIUS} stroke={colors.border} strokeWidth={STROKE} fill="none" />
          <Circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            stroke={colors.coral}
            strokeWidth={STROKE}
            fill="none"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
          />
        </Svg>
        <Text style={styles.ringText}>{Math.round(pct * 100)}%</Text>
      </View>
      <View>
        <Text style={styles.label}>今日の発話時間</Text>
        <Text style={styles.value}>
          {doneMin} / {goalMin}分
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginHorizontal: spacing.lg,
    backgroundColor: colors.white,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  ringWrap: { width: SIZE, height: SIZE, alignItems: 'center', justifyContent: 'center' },
  ringText: { position: 'absolute', fontSize: 12, fontWeight: '700', color: colors.textPrimary },
  label: { fontSize: 12, color: colors.textSecondary },
  value: { fontSize: 16, fontWeight: '700', color: colors.textPrimary, marginTop: 2 },
});
