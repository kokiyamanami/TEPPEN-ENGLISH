import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { OnboardProgress } from '../src/components/OnboardProgress';
import { TOTAL_OB_STEPS } from '../src/data/onboarding';
import { colors, radius, spacing } from '../src/theme/colors';

// screen key: obperm
// TODO(Phase10): expo-av / expo-audio の実パーミッションAPIに置き換え
export default function ObPermScreen() {
  const [micGranted, setMicGranted] = useState(false);
  const [speakerGranted, setSpeakerGranted] = useState(false);

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <OnboardProgress stepNumber={TOTAL_OB_STEPS} />
        <Text style={styles.title}>マイクとスピーカーを許可</Text>
        <Text style={styles.sub}>
          発話課題の録音と、お手本音声の再生に使います。後から端末の設定でも変更できます。
        </Text>

        <View style={styles.card}>
          <PermRow
            icon="mic-outline"
            title="マイク"
            desc="発話課題・フリー練習の録音に使用"
            granted={micGranted}
            onPress={() => setMicGranted(true)}
          />
          <View style={styles.divider} />
          <PermRow
            icon="volume-high-outline"
            title="スピーカー"
            desc="音声教材・お手本音声の再生に使用"
            granted={speakerGranted}
            onPress={() => setSpeakerGranted(true)}
          />
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable style={styles.backBtn} onPress={() => router.push('/ob5')}>
          <Text style={styles.backText}>戻る</Text>
        </Pressable>
        <Pressable style={styles.nextBtn} onPress={() => router.push('/obdone')}>
          <Text style={styles.nextText}>次へ</Text>
        </Pressable>
      </View>
    </View>
  );
}

function PermRow({
  icon,
  title,
  desc,
  granted,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  desc: string;
  granted: boolean;
  onPress: () => void;
}) {
  return (
    <View style={styles.permRow}>
      <Ionicons name={icon} size={22} color={colors.navy} />
      <View style={styles.permBody}>
        <Text style={styles.permTitle}>{title}</Text>
        <Text style={styles.permDesc}>{desc}</Text>
      </View>
      <Pressable style={[styles.permBtn, granted && styles.permBtnOn]} onPress={onPress} disabled={granted}>
        <Text style={[styles.permBtnText, granted && styles.permBtnTextOn]}>
          {granted ? '許可済み ✓' : '許可する'}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: spacing.xl },
  title: { fontSize: 20, fontWeight: '700', color: colors.textPrimary, marginTop: spacing.lg, marginHorizontal: spacing.lg },
  sub: { fontSize: 13, color: colors.textSecondary, marginTop: spacing.xs, marginHorizontal: spacing.lg, lineHeight: 18 },
  card: {
    marginTop: spacing.lg,
    marginHorizontal: spacing.lg,
    backgroundColor: colors.white,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  divider: { height: 1, backgroundColor: colors.border },
  permRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md },
  permBody: { flex: 1 },
  permTitle: { fontWeight: '600', color: colors.textPrimary },
  permDesc: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  permBtn: { borderWidth: 1, borderColor: colors.coral, borderRadius: radius.pill, paddingVertical: spacing.xs, paddingHorizontal: spacing.md },
  permBtnOn: { backgroundColor: colors.navy, borderColor: colors.navy },
  permBtnText: { color: colors.coral, fontSize: 12, fontWeight: '600' },
  permBtnTextOn: { color: colors.white },
  footer: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.white,
  },
  backBtn: { width: 84, alignItems: 'center', justifyContent: 'center', borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border },
  backText: { color: colors.textPrimary, fontWeight: '600' },
  nextBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.md, borderRadius: radius.pill, backgroundColor: colors.coral },
  nextText: { color: colors.white, fontWeight: '700' },
});
