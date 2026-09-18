import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '../theme/colors';
import { useTopInset } from '../hooks/useTopInset';

export function ScreenHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  const topInset = useTopInset();
  return (
    <View style={[styles.container, { paddingTop: topInset + spacing.sm }]}>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
});
