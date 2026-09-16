import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { TopBar } from '../src/components/TopBar';
import { TtsPlayerBar } from '../src/components/TtsPlayerBar';
import { generateWeeklyMaterial } from '../src/data/weekly';
import { useProfile } from '../src/store/ProfileContext';
import { colors, radius, spacing } from '../src/theme/colors';
import { toSlashReading } from '../src/utils/slashReading';
import { voiceForGender } from '../src/utils/ttsVoice';

// screen key: weekly_material
export default function WeeklyMaterialScreen() {
  const w = useMemo(() => generateWeeklyMaterial(), []);
  const { profile } = useProfile();
  const voice = voiceForGender(profile.voiceGender);
  const [langPage, setLangPage] = useState<0 | 1>(0);
  const [slashOn, setSlashOn] = useState(false);

  const enBlocks = slashOn ? w.paragraphsEN.map(toSlashReading) : w.paragraphsEN;

  return (
    <ScrollView style={styles.screen}>
      <TopBar title="Weeklyミッション" backRoute="/speaking_hub" />

      <View style={styles.meta}>
        <Text style={styles.metaTag}>WEEK {w.week} の教材</Text>
        <Text style={styles.topic}>テーマ：{w.topic}</Text>
      </View>

      <View style={styles.slashRow}>
        <Text style={styles.slashLabel}>スラッシュリーディング</Text>
        <Switch value={slashOn} onValueChange={setSlashOn} trackColor={{ true: colors.coral }} />
      </View>

      <View style={styles.langTabs}>
        <Pressable style={[styles.langTab, langPage === 0 && styles.langTabSel]} onPress={() => setLangPage(0)}>
          <Text style={[styles.langTabText, langPage === 0 && styles.langTabTextSel]}>EN</Text>
        </Pressable>
        <Pressable style={[styles.langTab, langPage === 1 && styles.langTabSel]} onPress={() => setLangPage(1)}>
          <Text style={[styles.langTabText, langPage === 1 && styles.langTabTextSel]}>日本語</Text>
        </Pressable>
      </View>

      <View style={styles.paragraphCard}>
        {(langPage === 0 ? enBlocks : w.paragraphsJP).map((t, i) => (
          <Text key={i} style={styles.paragraphText}>
            {t}
          </Text>
        ))}
      </View>

      <View style={styles.playerCard}>
        <TtsPlayerBar text={w.paragraphsEN.join(' ')} voice={voice} />
      </View>

      <Pressable style={styles.cta} onPress={() => router.push('/weekly_practice')}>
        <Text style={styles.ctaText}>この内容で練習をする</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  meta: { paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  metaTag: { color: colors.coral, fontSize: 11, fontWeight: '700' },
  topic: { fontSize: 11, color: colors.textSecondary, marginTop: spacing.xs },
  slashRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginHorizontal: spacing.lg, marginTop: spacing.md },
  slashLabel: { fontSize: 12, color: colors.textSecondary },
  langTabs: { flexDirection: 'row', gap: spacing.xs, paddingHorizontal: spacing.lg, marginTop: spacing.sm },
  langTab: { paddingVertical: 4, paddingHorizontal: spacing.md, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border },
  langTabSel: { backgroundColor: colors.navy, borderColor: colors.navy },
  langTabText: { fontSize: 11, color: colors.textSecondary },
  langTabTextSel: { color: colors.white },
  paragraphCard: { margin: spacing.lg, backgroundColor: colors.white, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.md, gap: spacing.sm },
  paragraphText: { fontSize: 12.5, color: colors.textPrimary, lineHeight: 19 },
  playerCard: { marginHorizontal: spacing.lg, marginBottom: spacing.md, backgroundColor: colors.white, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.md },
  cta: { backgroundColor: colors.coral, borderRadius: radius.pill, marginHorizontal: spacing.lg, marginBottom: spacing.xl, paddingVertical: spacing.md, alignItems: 'center' },
  ctaText: { color: colors.white, fontWeight: '700' },
});
