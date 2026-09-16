import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '../theme/colors';

export function ComingSoon({ title, phase }: { title: string; phase: string }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.phase}>{phase} で実装予定</Text>
      {router.canGoBack() ? (
        <Pressable style={styles.back} onPress={() => router.back()}>
          <Text style={styles.backText}>戻る</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', gap: spacing.sm, padding: spacing.lg },
  title: { fontSize: 20, fontWeight: '700', color: colors.textPrimary },
  phase: { fontSize: 13, color: colors.textSecondary },
  back: { marginTop: spacing.md, backgroundColor: colors.navy, paddingVertical: spacing.sm, paddingHorizontal: spacing.lg, borderRadius: radius.pill },
  backText: { color: colors.white, fontWeight: '600' },
});
