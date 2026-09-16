import { router } from 'expo-router';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { OnboardFieldInput } from '../components/OnboardFieldInput';
import { OnboardProgress } from '../components/OnboardProgress';
import { onboardSteps } from '../data/onboarding';
import { colors, radius, spacing } from '../theme/colors';

export function OnboardStepScreen({ stepIndex }: { stepIndex: number }) {
  const step = onboardSteps[stepIndex];
  const total = onboardSteps.length;
  const backRoute = stepIndex === 0 ? '/auth' : `/${onboardSteps[stepIndex - 1].key}`;
  const nextRoute = stepIndex === total - 1 ? '/obperm' : `/${onboardSteps[stepIndex + 1].key}`;

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <OnboardProgress stepNumber={stepIndex + 1} />
        <Text style={styles.title}>{step.title}</Text>
        <Text style={styles.sub}>{step.sub}</Text>
        {step.fields.map((f) => (
          <OnboardFieldInput key={f.field} field={f} />
        ))}
      </ScrollView>
      <Footer backRoute={backRoute} nextRoute={nextRoute} />
    </KeyboardAvoidingView>
  );
}

function Footer({ backRoute, nextRoute }: { backRoute: string; nextRoute: string }) {
  return (
    <View style={styles.footer}>
      <Pressable style={styles.backBtn} onPress={() => router.push(backRoute as never)}>
        <Text style={styles.backText}>戻る</Text>
      </Pressable>
      <Pressable style={styles.nextBtn} onPress={() => router.push(nextRoute as never)}>
        <Text style={styles.nextText}>次へ</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: spacing.xl },
  title: { fontSize: 20, fontWeight: '700', color: colors.textPrimary, marginTop: spacing.lg, marginHorizontal: spacing.lg },
  sub: { fontSize: 13, color: colors.textSecondary, marginTop: spacing.xs, marginHorizontal: spacing.lg, lineHeight: 18 },
  footer: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.white,
  },
  backBtn: {
    width: 84,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  backText: { color: colors.textPrimary, fontWeight: '600' },
  nextBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.coral,
  },
  nextText: { color: colors.white, fontWeight: '700' },
});
