import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '../src/theme/colors';

// screen key: splash
// Phase 1 will replace the CTA below with the real auth -> onboarding flow.
export default function SplashScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>BASE CAMP{'\n'}English</Text>
      <Text style={styles.subtitle}>毎日の一言が、頂上への一歩になる。</Text>
      <Pressable style={styles.cta} onPress={() => router.replace('/(tabs)/home')}>
        <Text style={styles.ctaText}>はじめる</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.navy,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  title: {
    color: colors.white,
    fontSize: 32,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 40,
  },
  subtitle: {
    color: colors.coralLight,
    fontSize: 14,
    marginTop: spacing.md,
    marginBottom: spacing.xl,
  },
  cta: {
    backgroundColor: colors.coral,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.pill,
  },
  ctaText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
});
