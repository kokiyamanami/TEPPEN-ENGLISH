import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { generateDialogueRemote } from '../src/api/generation';
import { LangSwipe } from '../src/components/LangSwipe';
import { TopBar } from '../src/components/TopBar';
import { TtsLineButton } from '../src/components/TtsLineButton';
import { TtsPlayerBar } from '../src/components/TtsPlayerBar';
import { generateDialogue, Dialogue } from '../src/data/situational';
import { useGeneratedContent } from '../src/store/GeneratedContentContext';
import { usePhrases } from '../src/store/PhraseContext';
import { useProfile } from '../src/store/ProfileContext';
import { colors, radius, spacing } from '../src/theme/colors';
import { toSlashReading } from '../src/utils/slashReading';
import { voiceForGender } from '../src/utils/ttsVoice';

// screen key: situational_dialogue
export default function SituationalDialogueScreen() {
  const { scene: sceneParam } = useLocalSearchParams<{ scene?: string }>();
  const scene = sceneParam ?? '同僚との会話';

  const [regenUsed, setRegenUsed] = useState(false);
  const [slashLines, setSlashLines] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [dialogue, setDialogue] = useState<Dialogue>(() => generateDialogue(scene, 0));

  const { openRegister } = usePhrases();
  const { profile } = useProfile();
  const { setCurrentDialogue } = useGeneratedContent();
  const voice = voiceForGender(profile.voiceGender);
  const fullText = useMemo(() => dialogue.lines.map((l) => l.text).join(' '), [dialogue]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await generateDialogueRemote(scene, profile);
      setDialogue(result);
      setCurrentDialogue(result);
    } catch (e) {
      const fallback = generateDialogue(scene, Math.random() > 0.5 ? 1 : 0);
      setDialogue(fallback);
      setCurrentDialogue(fallback);
    } finally {
      setLoading(false);
    }
  }, [scene, profile]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    load();
  }, [scene]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleSlash = (i: number) => {
    setSlashLines((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  const regenerate = () => {
    if (regenUsed) return;
    setRegenUsed(true);
    load();
  };

  const registerPhrase = (text: string) => {
    openRegister(text, false);
  };

  return (
    <ScrollView style={styles.screen}>
      <TopBar title={scene} backRoute="/situational" />

      <View style={styles.meta}>
        <View style={styles.metaRow}>
          <View style={styles.metaTag}>
            <Ionicons name="sparkles-outline" size={12} color={colors.coral} />
            <Text style={styles.metaTagText}>AIが生成した会話文</Text>
          </View>
          <Pressable style={[styles.regenBtn, regenUsed && styles.regenBtnDisabled]} onPress={regenerate} disabled={regenUsed}>
            <Ionicons name="refresh" size={13} color={regenUsed ? colors.textSecondary : colors.textPrimary} />
            <Text style={[styles.regenText, regenUsed && styles.regenTextDisabled]}>{regenUsed ? '本日はここまで' : '作り直す'}</Text>
          </Pressable>
        </View>
        <Text style={styles.counterpart}>相手役：{dialogue.counterpart}</Text>
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={colors.coral} />
          <Text style={styles.loadingText}>AIが会話文を生成しています…</Text>
        </View>
      ) : (
        <>
          <View style={styles.lines}>
            <LangSwipe
              en={
                <View style={styles.linesInner}>
                  {dialogue.lines.map((line, i) => {
                    const isMe = line.from === 'me';
                    const slashed = slashLines.has(i);
                    return (
                      <View key={i} style={[styles.lineRow, isMe && styles.lineRowMe]}>
                        <View style={[styles.bubble, isMe && styles.bubbleMe]}>
                          <Text style={[styles.bubbleText, isMe && styles.bubbleTextMe]}>{slashed ? toSlashReading(line.text) : line.text}</Text>
                        </View>
                        <View style={[styles.lineToolbar, isMe && styles.lineToolbarMe]}>
                          <TtsLineButton text={line.text} voice={voice} style={styles.lineBtn} />
                          <Pressable style={[styles.lineBtn, slashed && styles.lineBtnActive]} onPress={() => toggleSlash(i)} hitSlop={8}>
                            <Text style={[styles.slashIcon, slashed && styles.slashIconActive]}>/</Text>
                          </Pressable>
                          <Pressable style={styles.lineBtn} onPress={() => registerPhrase(line.text)} hitSlop={8}>
                            <Ionicons name="bookmark-outline" size={13} color={colors.textPrimary} />
                          </Pressable>
                        </View>
                      </View>
                    );
                  })}
                </View>
              }
              jp={
                <View style={styles.linesInner}>
                  {dialogue.lines.map((line, i) => {
                    const isMe = line.from === 'me';
                    return (
                      <View key={i} style={[styles.lineRow, isMe && styles.lineRowMe]}>
                        <View style={[styles.bubble, isMe && styles.bubbleMe]}>
                          <Text style={[styles.bubbleText, isMe && styles.bubbleTextMe]}>{line.textJP}</Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              }
            />
          </View>

          <View style={styles.playerCard}>
            <TtsPlayerBar text={fullText} voice={voice} />
          </View>
        </>
      )}

      <Pressable style={styles.cta} onPress={() => router.push({ pathname: '/dialogue_roleplay', params: { scene } } as never)}>
        <Text style={styles.ctaText}>この内容でロールプレイ練習をする</Text>
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
  counterpart: { fontSize: 11, color: colors.textSecondary, marginTop: spacing.xs },
  loadingWrap: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xl },
  loadingText: { fontSize: 12, color: colors.textSecondary },
  lines: { paddingHorizontal: spacing.lg, marginTop: spacing.md },
  linesInner: { gap: spacing.sm },
  lineRow: { alignItems: 'flex-start' },
  lineRowMe: { alignItems: 'flex-end' },
  bubble: { maxWidth: '85%', backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.sm },
  bubbleMe: { backgroundColor: colors.navy, borderColor: colors.navy },
  bubbleText: { fontSize: 13, color: colors.textPrimary, lineHeight: 18 },
  bubbleTextMe: { color: colors.white },
  lineToolbar: { flexDirection: 'row', gap: spacing.xs, marginTop: 4 },
  lineToolbarMe: { alignSelf: 'flex-end' },
  lineBtn: { width: 24, height: 24, borderRadius: 12, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  lineBtnActive: { backgroundColor: colors.coral, borderColor: colors.coral },
  slashIcon: { fontSize: 12, fontWeight: '700', color: colors.textPrimary },
  slashIconActive: { color: colors.white },
  playerCard: { margin: spacing.lg, backgroundColor: colors.white, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.md },
  cta: { backgroundColor: colors.coral, borderRadius: radius.pill, marginHorizontal: spacing.lg, marginBottom: spacing.xl, paddingVertical: spacing.md, alignItems: 'center' },
  ctaText: { color: colors.white, fontWeight: '700' },
});
