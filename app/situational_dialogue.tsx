import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { PlayerBar } from '../src/components/PlayerBar';
import { TopBar } from '../src/components/TopBar';
import { generateDialogue } from '../src/data/situational';
import { colors, radius, spacing } from '../src/theme/colors';
import { toSlashReading } from '../src/utils/slashReading';

// screen key: situational_dialogue
export default function SituationalDialogueScreen() {
  const { scene: sceneParam } = useLocalSearchParams<{ scene?: string }>();
  const scene = sceneParam ?? '同僚との会話';

  const [variant, setVariant] = useState(0);
  const [regenUsed, setRegenUsed] = useState(false);
  const [langPage, setLangPage] = useState<0 | 1>(0);
  const [slashLines, setSlashLines] = useState<Set<number>>(new Set());

  const dialogue = useMemo(() => generateDialogue(scene, variant), [scene, variant]);

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
    setVariant((v) => (v === 0 ? 1 : 0));
    setRegenUsed(true);
  };

  const registerPhrase = () => {
    Alert.alert('MYフレーズ', 'フレーズ登録機能はPhase5で実装予定です。');
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

      <View style={styles.langTabs}>
        <Pressable style={[styles.langTab, langPage === 0 && styles.langTabSel]} onPress={() => setLangPage(0)}>
          <Text style={[styles.langTabText, langPage === 0 && styles.langTabTextSel]}>EN</Text>
        </Pressable>
        <Pressable style={[styles.langTab, langPage === 1 && styles.langTabSel]} onPress={() => setLangPage(1)}>
          <Text style={[styles.langTabText, langPage === 1 && styles.langTabTextSel]}>日本語</Text>
        </Pressable>
      </View>

      <View style={styles.lines}>
        {dialogue.lines.map((line, i) => {
          const isMe = line.from === 'me';
          const slashed = slashLines.has(i);
          return (
            <View key={i} style={[styles.lineRow, isMe && styles.lineRowMe]}>
              <View style={[styles.bubble, isMe && styles.bubbleMe]}>
                <Text style={[styles.bubbleText, isMe && styles.bubbleTextMe]}>
                  {langPage === 0 ? (slashed ? toSlashReading(line.text) : line.text) : line.textJP}
                </Text>
              </View>
              {langPage === 0 && (
                <View style={[styles.lineToolbar, isMe && styles.lineToolbarMe]}>
                  <Pressable style={styles.lineBtn} hitSlop={8}>
                    <Ionicons name="play" size={13} color={colors.textPrimary} />
                  </Pressable>
                  <Pressable style={[styles.lineBtn, slashed && styles.lineBtnActive]} onPress={() => toggleSlash(i)} hitSlop={8}>
                    <Text style={[styles.slashIcon, slashed && styles.slashIconActive]}>/</Text>
                  </Pressable>
                  <Pressable style={styles.lineBtn} onPress={registerPhrase} hitSlop={8}>
                    <Ionicons name="bookmark-outline" size={13} color={colors.textPrimary} />
                  </Pressable>
                </View>
              )}
            </View>
          );
        })}
      </View>

      <View style={styles.playerCard}>
        <PlayerBar />
      </View>

      <Pressable style={styles.cta} onPress={() => router.push({ pathname: '/dialogue_roleplay', params: { scene, variant: String(variant) } } as never)}>
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
  langTabs: { flexDirection: 'row', gap: spacing.xs, paddingHorizontal: spacing.lg, marginTop: spacing.md },
  langTab: { paddingVertical: 4, paddingHorizontal: spacing.md, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border },
  langTabSel: { backgroundColor: colors.navy, borderColor: colors.navy },
  langTabText: { fontSize: 11, color: colors.textSecondary },
  langTabTextSel: { color: colors.white },
  lines: { paddingHorizontal: spacing.lg, marginTop: spacing.md, gap: spacing.sm },
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
