import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { PlayerBar } from '../src/components/PlayerBar';
import { TopBar } from '../src/components/TopBar';
import { generatePresentation } from '../src/data/situational';
import { usePhrases } from '../src/store/PhraseContext';
import { colors, radius, spacing } from '../src/theme/colors';
import { toSlashReading } from '../src/utils/slashReading';

// screen key: presentation_material
export default function PresentationMaterialScreen() {
  const [variant, setVariant] = useState(0);
  const [regenUsed, setRegenUsed] = useState(false);
  const [langPage, setLangPage] = useState<0 | 1>(0);
  const [slashOn, setSlashOn] = useState(false);
  const { openRegister } = usePhrases();

  const p = useMemo(() => generatePresentation(variant), [variant]);
  const enBlocks = slashOn ? p.paragraphsEN.map(toSlashReading) : p.paragraphsEN;

  const regenerate = () => {
    if (regenUsed) return;
    setVariant((v) => (v === 0 ? 1 : 0));
    setRegenUsed(true);
  };

  return (
    <ScrollView style={styles.screen}>
      <TopBar title="プレゼンテーション" backRoute="/situational" />

      <View style={styles.meta}>
        <View style={styles.metaRow}>
          <View style={styles.metaTag}>
            <Ionicons name="sparkles-outline" size={12} color={colors.coral} />
            <Text style={styles.metaTagText}>AIが生成した原稿</Text>
          </View>
          <Pressable style={[styles.regenBtn, regenUsed && styles.regenBtnDisabled]} onPress={regenerate} disabled={regenUsed}>
            <Ionicons name="refresh" size={13} color={regenUsed ? colors.textSecondary : colors.textPrimary} />
            <Text style={[styles.regenText, regenUsed && styles.regenTextDisabled]}>{regenUsed ? '本日はここまで' : '作り直す'}</Text>
          </Pressable>
        </View>
        <Text style={styles.topic}>テーマ：{p.topic}</Text>
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
        {(langPage === 0 ? enBlocks : p.paragraphsJP).map((t, i) => (
          <Text key={i} style={styles.paragraphText}>
            {t}
          </Text>
        ))}
      </View>

      <View style={styles.playerCard}>
        <PlayerBar />
      </View>

      <Pressable
        style={styles.phraseBtn}
        onPress={() => openRegister('', true)}
      >
        <Ionicons name="bookmark-outline" size={14} color={colors.coral} />
        <Text style={styles.phraseBtnText}>気になった表現をMYフレーズに登録する</Text>
      </Pressable>

      <Pressable style={styles.cta} onPress={() => router.push('/presentation_practice')}>
        <Text style={styles.ctaText}>この内容でプレゼン練習をする</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  meta: { paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  metaTag: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaTagText: { color: colors.coral, fontSize: 11, fontWeight: '600' },
  regenBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill, paddingVertical: 4, paddingHorizontal: spacing.sm },
  regenBtnDisabled: { opacity: 0.5 },
  regenText: { fontSize: 11, color: colors.textPrimary, fontWeight: '600' },
  regenTextDisabled: { color: colors.textSecondary },
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
  phraseBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, alignSelf: 'center', marginBottom: spacing.md },
  phraseBtnText: { color: colors.coral, fontSize: 12, fontWeight: '600' },
  cta: { backgroundColor: colors.coral, borderRadius: radius.pill, marginHorizontal: spacing.lg, marginBottom: spacing.xl, paddingVertical: spacing.md, alignItems: 'center' },
  ctaText: { color: colors.white, fontWeight: '700' },
});
