import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { formatCallTime, RecordPhase } from '../hooks/useRecordFlow';
import { colors, radius, spacing } from '../theme/colors';
import { PlayerBar } from './PlayerBar';
import { RecordingPlayback } from './RecordingPlayback';

type Props = {
  phase: RecordPhase | 'grading';
  seconds: number;
  uri?: string | null;
  onStart: () => void;
  onStop: () => void;
  onRetake: () => void;
  onSubmit: () => void;
  submitLabel: string;
  idleLabel?: string;
};

export function RecordCard({ phase, seconds, uri, onStart, onStop, onRetake, onSubmit, submitLabel, idleLabel }: Props) {
  return (
    <View style={styles.card}>
      {phase === 'idle' && (
        <>
          {idleLabel ? <Text style={styles.label}>{idleLabel}</Text> : null}
          <Pressable style={styles.recBtn} onPress={onStart}>
            <Ionicons name="mic" size={26} color={colors.white} />
          </Pressable>
          <Text style={styles.hint}>タップして録音を開始する</Text>
        </>
      )}

      {phase === 'recording' && (
        <>
          <Text style={styles.labelDanger}>録音中…</Text>
          <Pressable style={[styles.recBtn, styles.recBtnActive]} onPress={onStop}>
            <Ionicons name="square" size={22} color={colors.white} />
          </Pressable>
          <Text style={styles.timer}>{formatCallTime(seconds)}</Text>
          <Text style={styles.hint}>タップして録音を終える</Text>
        </>
      )}

      {phase === 'grading' && (
        <>
          <Text style={styles.label}>AIが添削しています…</Text>
          <Text style={styles.hint}>少々お待ちください</Text>
        </>
      )}

      {phase === 'recorded' && (
        <>
          <View style={styles.doneBadge}>
            <Ionicons name="checkmark-circle" size={16} color={colors.success} />
            <Text style={styles.doneBadgeText}>録音しました（{formatCallTime(seconds)}）</Text>
          </View>
          <View style={styles.playerWrap}>{uri ? <RecordingPlayback uri={uri} /> : <PlayerBar />}</View>
          <View style={styles.secondRow}>
            <Pressable style={styles.smallBtn} onPress={onRetake}>
              <Ionicons name="mic-outline" size={14} color={colors.textPrimary} />
              <Text style={styles.smallBtnText}>録り直す</Text>
            </Pressable>
            <Pressable style={styles.submitBtn} onPress={onSubmit}>
              <Text style={styles.submitBtnText}>{submitLabel}</Text>
            </Pressable>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    margin: spacing.lg,
    backgroundColor: colors.white,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    alignItems: 'center',
  },
  label: { fontWeight: '600', color: colors.textPrimary },
  labelDanger: { fontWeight: '600', color: colors.danger },
  recBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.coral,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
  },
  recBtnActive: { backgroundColor: colors.danger },
  timer: { marginTop: spacing.sm, fontSize: 20, fontWeight: '700', color: colors.textPrimary },
  hint: { marginTop: spacing.sm, fontSize: 12, color: colors.textSecondary },
  doneBadge: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  doneBadgeText: { color: colors.textPrimary, fontWeight: '600', fontSize: 13 },
  playerWrap: { width: '100%', marginTop: spacing.md },
  secondRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg, width: '100%' },
  smallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  smallBtnText: { fontSize: 12, color: colors.textPrimary, fontWeight: '600' },
  submitBtn: { flex: 1, backgroundColor: colors.coral, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  submitBtnText: { color: colors.white, fontWeight: '700', fontSize: 13 },
});
