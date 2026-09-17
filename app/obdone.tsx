import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useProfile } from '../src/store/ProfileContext';
import { colors, radius, spacing } from '../src/theme/colors';

// screen key: obdone
export default function ObDoneScreen() {
  const { saveProfile } = useProfile();
  const [saving, setSaving] = useState(false);

  const finish = async () => {
    setSaving(true);
    try {
      await saveProfile();
    } catch {
      // 保存に失敗してもオンボーディングは継続させる（次回プロフィール編集画面で再保存可能）
    } finally {
      setSaving(false);
      router.replace('/(tabs)/home');
    }
  };

  return (
    <View style={styles.screen}>
      <Text style={styles.mark}>🚩</Text>
      <Text style={styles.title}>ベースキャンプ設営完了</Text>
      <Text style={styles.sub}>
        プロフィールをもとに、あなた専用の教材の準備ができました。{'\n'}ここから頂を目指しましょう。
      </Text>
      <Pressable style={styles.cta} onPress={finish} disabled={saving}>
        {saving ? <ActivityIndicator color={colors.white} /> : <Text style={styles.ctaText}>登山を始める</Text>}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.navy, alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  mark: { fontSize: 56 },
  title: { color: colors.white, fontSize: 22, fontWeight: '700', marginTop: spacing.lg, textAlign: 'center' },
  sub: { color: colors.coralLight, fontSize: 13, textAlign: 'center', marginTop: spacing.md, lineHeight: 20 },
  cta: { backgroundColor: colors.coral, borderRadius: radius.pill, paddingVertical: spacing.md, width: '100%', alignItems: 'center', marginTop: spacing.xl },
  ctaText: { color: colors.white, fontWeight: '700', fontSize: 16 },
});
