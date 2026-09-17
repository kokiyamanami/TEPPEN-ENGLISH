// ログイン/セッション復元後の遷移先を、保存済みのオンボーディング進捗から決定する
export function resolveEntryRoute(status: { onboardingStep: string; onboardingComplete: boolean }): string {
  if (status.onboardingComplete) return '/(tabs)/home';
  const step = status.onboardingStep || 'ob1';
  return step === 'obdone' ? '/obperm' : `/${step}`;
}
