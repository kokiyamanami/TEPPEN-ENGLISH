import { StyleSheet, Text, View } from 'react-native';
import { TOTAL_OB_STEPS } from '../data/onboarding';
import { colors, spacing } from '../theme/colors';

export function OnboardProgress({ stepNumber }: { stepNumber: number }) {
  return (
    <View style={styles.container}>
      <View style={styles.barWrap}>
        {Array.from({ length: TOTAL_OB_STEPS }).map((_, i) => (
          <View key={i} style={[styles.seg, i < stepNumber && styles.segDone]} />
        ))}
      </View>
      <Text style={styles.label}>
        STEP {stepNumber} / {TOTAL_OB_STEPS}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
  barWrap: { flexDirection: 'row', gap: spacing.xs },
  seg: { flex: 1, height: 4, borderRadius: 2, backgroundColor: colors.border },
  segDone: { backgroundColor: colors.coral },
  label: { marginTop: spacing.sm, fontSize: 12, color: colors.textSecondary },
});
