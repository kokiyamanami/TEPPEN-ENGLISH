import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AvatarPicker } from '../src/components/AvatarPicker';
import { OnboardFieldInput } from '../src/components/OnboardFieldInput';
import { TopBar } from '../src/components/TopBar';
import { onboardSteps } from '../src/data/onboarding';
import { useProfile } from '../src/store/ProfileContext';
import { colors, radius, spacing } from '../src/theme/colors';

// screen key: mypage_edit
export default function MyPageEditScreen() {
  const { saveProfile } = useProfile();
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await saveProfile();
    } finally {
      setSaving(false);
      router.replace('/(tabs)/mypage');
    }
  };

  return (
    <ScrollView style={styles.screen}>
      <TopBar title="プロフィール編集" backRoute="/(tabs)/mypage" />
      <View style={styles.avatarWrap}>
        <AvatarPicker size={88} />
        <Text style={styles.avatarHint}>タップして写真を変更</Text>
      </View>
      {onboardSteps.map((step) => (
        <View key={step.key}>
          <Text style={styles.sectionTitle}>{step.title}</Text>
          {step.fields.map((f) => (
            <OnboardFieldInput key={f.field} field={f} />
          ))}
        </View>
      ))}
      <Pressable style={styles.saveBtn} onPress={save} disabled={saving}>
        {saving ? <ActivityIndicator color={colors.white} /> : <Text style={styles.saveBtnText}>保存して戻る</Text>}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  avatarWrap: { alignItems: 'center', marginTop: spacing.lg },
  avatarHint: { fontSize: 11, color: colors.textSecondary, marginTop: spacing.sm },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: colors.textPrimary, marginHorizontal: spacing.lg, marginTop: spacing.lg, marginBottom: spacing.xs },
  saveBtn: { backgroundColor: colors.coral, borderRadius: radius.pill, marginHorizontal: spacing.lg, marginVertical: spacing.xl, paddingVertical: spacing.md, alignItems: 'center' },
  saveBtnText: { color: colors.white, fontWeight: '700' },
});
