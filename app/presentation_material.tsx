import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { generatePresentationRemote } from '../src/api/generation';
import { LangSwipe } from '../src/components/LangSwipe';
import { TopBar } from '../src/components/TopBar';
import { TtsPlayerBar } from '../src/components/TtsPlayerBar';
import { generatePresentation } from '../src/data/situational';
import { useGeneratedContent } from '../src/store/GeneratedContentContext';
import { usePhrases } from '../src/store/PhraseContext';
import { useProfile } from '../src/store/ProfileContext';
import { colors, radius, spacing } from '../src/theme/colors';
import { toSlashReading } from '../src/utils/slashReading';
import { voiceForGender } from '../src/utils/ttsVoice';

type Presentation = { topic: string; paragraphsEN: string[]; paragraphsJP: string[] };

// screen key: presentation_material
export default function PresentationMaterialScreen() {
  const { profile } = useProfile();
  const { openRegister } = usePhrases();
  const { setCurrentPresentation } = useGeneratedContent();
  const [p, setP] = useState<Presentation>(() => generatePresentation(0));
  const [loading, setLoading] = useState(true);
  const [regenUsed, setRegenUsed] = useState(false);
  const [slashOn, setSlashOn] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await generatePresentationRemote(profile);
      setP(result);
      setCurrentPresentation(result);
    } catch (e) {
      // オフライン等の場合は静的サンプルにフォールバック
      const fallback = generatePresentation(0);
      setP(fallback);
      setCurrentPresentation(fallback);
    } finally {
      setLoading(false);
    }
  }, [profile]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    load();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const enBlocks = slashOn ? p.paragraphsEN.map(toSlashReading) : p.paragraphsEN;
  const voice = voiceForGender(profile.voiceGender);

  const regenerate = () => {
    if (regenUsed) return;
    setRegenUsed(true);
    load();
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

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={colors.coral} />
          <Text style={styles.loadingText}>AIが原稿を生成しています…</Text>
        </View>
      ) : (
        <>
          <View style={styles.swipeWrap}>
            <LangSwipe
              en={
                <View style={styles.paragraphCard}>
                  {enBlocks.map((t, i) => (
                    <Text key={i} style={styles.paragraphText}>
                      {t}
                    </Text>
                  ))}
                </View>
              }
              jp={
                <View style={styles.paragraphCard}>
                  {p.paragraphsJP.map((t, i) => (
                    <Text key={i} style={styles.paragraphText}>
                      {t}
                    </Text>
                  ))}
                </View>
              }
            />
          </View>

          <View style={styles.playerCard}>
            <TtsPlayerBar text={p.paragraphsEN.join(' ')} voice={voice} />
          </View>
        </>
      )}

      <Pressable style={styles.phraseBtn} onPress={() => openRegister('', true)}>
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
  loadingWrap: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xl },
  loadingText: { fontSize: 12, color: colors.textSecondary },
  swipeWrap: { marginHorizontal: spacing.lg, marginTop: spacing.md },
  paragraphCard: { backgroundColor: colors.white, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.md, gap: spacing.sm },
  paragraphText: { fontSize: 12.5, color: colors.textPrimary, lineHeight: 19 },
  playerCard: { marginHorizontal: spacing.lg, marginBottom: spacing.md, backgroundColor: colors.white, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.md },
  phraseBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, alignSelf: 'center', marginBottom: spacing.md },
  phraseBtnText: { color: colors.coral, fontSize: 12, fontWeight: '600' },
  cta: { backgroundColor: colors.coral, borderRadius: radius.pill, marginHorizontal: spacing.lg, marginBottom: spacing.xl, paddingVertical: spacing.md, alignItems: 'center' },
  ctaText: { color: colors.white, fontWeight: '700' },
});
