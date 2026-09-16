import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '../theme/colors';

type Props = {
  pass: boolean;
  title: string;
  subtitle: string;
  children?: React.ReactNode;
  primaryLabel: string;
  onPrimary: () => void;
  secondaryLabel: string;
  onSecondary: () => void;
};

export function ResultView({ pass, title, subtitle, children, primaryLabel, onPrimary, secondaryLabel, onSecondary }: Props) {
  return (
    <View style={styles.wrap}>
      <View style={[styles.badge, pass ? styles.badgePass : styles.badgeFail]}>
        <Ionicons name={pass ? 'checkmark' : 'close'} size={28} color={colors.white} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
      {children}
      <Pressable style={styles.primaryBtn} onPress={onPrimary}>
        <Text style={styles.primaryBtnText}>{primaryLabel}</Text>
      </Pressable>
      <Pressable style={styles.secondaryBtn} onPress={onSecondary}>
        <Text style={styles.secondaryBtnText}>{secondaryLabel}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: spacing.lg, alignItems: 'center' },
  badge: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginTop: spacing.lg },
  badgePass: { backgroundColor: colors.success },
  badgeFail: { backgroundColor: colors.danger },
  title: { fontSize: 18, fontWeight: '700', color: colors.textPrimary, marginTop: spacing.md },
  subtitle: { fontSize: 13, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.xs, lineHeight: 18 },
  primaryBtn: { backgroundColor: colors.coral, borderRadius: radius.pill, paddingVertical: spacing.md, width: '100%', alignItems: 'center', marginTop: spacing.xl },
  primaryBtnText: { color: colors.white, fontWeight: '700' },
  secondaryBtn: { paddingVertical: spacing.md, width: '100%', alignItems: 'center' },
  secondaryBtnText: { color: colors.textSecondary, fontWeight: '600' },
});
