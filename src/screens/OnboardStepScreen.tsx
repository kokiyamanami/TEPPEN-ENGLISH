import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { OnboardFieldInput } from '../components/OnboardFieldInput';
import { OnboardProgress } from '../components/OnboardProgress';
import { onboardSteps } from '../data/onboarding';
import { useProfile } from '../store/ProfileContext';
import { colors, radius, spacing } from '../theme/colors';

export function OnboardStepScreen({ stepIndex }: { stepIndex: number }) {
  const step = onboardSteps[stepIndex];
  const total = onboardSteps.length;
  const backRoute = stepIndex === 0 ? '/auth' : `/${onboardSteps[stepIndex - 1].key}`;
  const nextStepKey = stepIndex === total - 1 ? 'obperm' : onboardSteps[stepIndex + 1].key;
  const nextRoute = `/${nextStepKey}`;

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
      <Footer backRoute={backRoute} nextRoute={nextRoute} nextStepKey={nextStepKey} />
    </KeyboardAvoidingView>
  );
}

function Footer({ backRoute, nextRoute, nextStepKey }: { backRoute: string; nextRoute: string; nextStepKey: string }) {
  const { saveProfile, saveOnboardingProgress } = useProfile();
  const [saving, setSaving] = useState(false);

  const onNext = async () => {
    setSaving(true);
    try {
      // 途中離脱しても再開できるよう、入力内容と現在地をサーバーに保存
      await Promise.all([saveProfile(), saveOnboardingProgress(nextStepKey)]);
    } catch (e) {
      console.warn('onboarding progress save failed:', e);
    } finally {
      setSaving(false);
      router.push(nextRoute as never);
    }
  };

  return (
    <View style={styles.footer}>
      <Pressable style={styles.backBtn} onPress={() => router.push(backRoute as never)}>
        <Text style={styles.backText}>戻る</Text>
      </Pressable>
      <Pressable style={styles.nextBtn} onPress={onNext} disabled={saving}>
        {saving ? <ActivityIndicator color={colors.white} /> : <Text style={styles.nextText}>次へ</Text>}
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
