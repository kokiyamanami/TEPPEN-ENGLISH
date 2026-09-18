import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '../theme/colors';
import { useTopInset } from '../hooks/useTopInset';

export function TopBar({ title, backRoute }: { title: string; backRoute?: string }) {
  const topInset = useTopInset();
  return (
    <View style={[styles.container, { paddingTop: topInset + spacing.sm }]}>
      <Pressable
        style={styles.backBtn}
        onPress={() => (backRoute ? router.replace(backRoute as never) : router.back())}
        hitSlop={12}
      >
        <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
      </Pressable>
      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>
      <View style={styles.spacer} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.white,
  },
  backBtn: { padding: spacing.xs },
  title: { flex: 1, textAlign: 'center', fontSize: 16, fontWeight: '700', color: colors.textPrimary },
  spacer: { width: 30 },
});
