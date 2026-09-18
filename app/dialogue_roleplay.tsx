import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ResultView } from '../src/components/ResultView';
import { TopBar } from '../src/components/TopBar';
import { TtsLineButton } from '../src/components/TtsLineButton';
import { generateDialogue } from '../src/data/situational';
import { formatCallTime } from '../src/hooks/useRecordFlow';
import { useGeneratedContent } from '../src/store/GeneratedContentContext';
import { useProfile } from '../src/store/ProfileContext';
import { colors, radius, spacing } from '../src/theme/colors';
import { voiceForGender } from '../src/utils/ttsVoice';

type LineState = { phase: 'idle' | 'recording' | 'recorded'; seconds: number };

// screen key: dialogue_roleplay
export default function DialogueRoleplayScreen() {
  const { scene: sceneParam } = useLocalSearchParams<{ scene?: string }>();
  const scene = sceneParam ?? '同僚との会話';
  const { currentDialogue } = useGeneratedContent();
  const fallback = useMemo(() => generateDialogue(scene, 0), [scene]);
  const dialogue = currentDialogue ?? fallback;
  const { profile } = useProfile();
  const voice = voiceForGender(profile.voiceGender);

  const [lineStates, setLineStates] = useState<Record<number, LineState>>({});
  const [done, setDone] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => {
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  const getState = (i: number): LineState => lineStates[i] ?? { phase: 'idle', seconds: 0 };

  const startRecording = (i: number) => {
    setLineStates((prev) => ({ ...prev, [i]: { phase: 'recording', seconds: 0 } }));
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setLineStates((prev) => {
        const cur = prev[i];
        if (!cur || cur.phase !== 'recording') return prev;
        return { ...prev, [i]: { ...cur, seconds: cur.seconds + 1 } };
      });
    }, 1000);
  };

  const stopRecording = (i: number) => {
    if (timerRef.current) clearInterval(timerRef.current);
    setLineStates((prev) => ({ ...prev, [i]: { ...prev[i], phase: 'recorded' } }));
  };

  const retake = (i: number) => {
    setLineStates((prev) => ({ ...prev, [i]: { phase: 'idle', seconds: 0 } }));
  };

  const meCount = dialogue.lines.filter((l) => l.from === 'me').length;
  const meDoneCount = Object.values(lineStates).filter((s) => s.phase === 'recorded').length;

  if (done) {
    return (
      <ScrollView style={styles.screen}>
        <TopBar title="ロールプレイ練習" backRoute="/situational_dialogue" />
        <ResultView
          pass
          title="練習お疲れさまでした！"
          subtitle={`「${scene}」のロールプレイを練習しました。\n気になった表現はMYフレーズに残しておきましょう。`}
          primaryLabel="もう一度練習する"
          onPrimary={() => {
            setLineStates({});
            setDone(false);
          }}
          secondaryLabel="教材に戻る"
          onSecondary={() => router.replace({ pathname: '/situational_dialogue', params: { scene } } as never)}
        />
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.screen}>
      <TopBar title="ロールプレイ練習" backRoute="/situational_dialogue" />
      <Text style={styles.hint}>
        相手のセリフは再生、あなたのセリフは録音して練習しましょう（録音済み {meDoneCount}/{meCount}）
      </Text>

      <View style={styles.list}>
        {dialogue.lines.map((line, i) => {
          if (line.from === 'them') {
            return (
              <View key={i} style={styles.themCard}>
                <Text style={styles.themLabel}>{dialogue.counterpart}</Text>
                <Text style={styles.themText}>{line.text}</Text>
                <TtsLineButton text={line.text} voice={voice} style={styles.playBtn} />
              </View>
            );
          }
          const ls = getState(i);
          return (
            <View key={i} style={styles.meCard}>
              <Text style={styles.meLabel}>あなた</Text>
              <Text style={styles.themText}>{line.text}</Text>
              {ls.phase === 'idle' && (
                <>
                  <Pressable style={styles.recBtn} onPress={() => startRecording(i)}>
                    <Ionicons name="mic" size={22} color={colors.white} />
                  </Pressable>
                  <Text style={styles.smallHint}>タップして録音する</Text>
                </>
              )}
              {ls.phase === 'recording' && (
                <>
                  <Pressable style={[styles.recBtn, styles.recBtnActive]} onPress={() => stopRecording(i)}>
                    <Ionicons name="square" size={18} color={colors.white} />
                  </Pressable>
                  <Text style={styles.smallHint}>{formatCallTime(ls.seconds)} · タップして録音を終える</Text>
                </>
              )}
              {ls.phase === 'recorded' && (
                <>
                  <View style={styles.doneBadge}>
                    <Ionicons name="checkmark-circle" size={14} color={colors.success} />
                    <Text style={styles.doneBadgeText}>録音しました（{formatCallTime(ls.seconds)}）</Text>
                  </View>
                  <View style={styles.secondRow}>
                    <Pressable style={styles.smallBtn} onPress={() => retake(i)}>
                      <Ionicons name="mic-outline" size={12} color={colors.textPrimary} />
                      <Text style={styles.smallBtnText}>録り直す</Text>
                    </Pressable>
                    <Pressable style={[styles.smallBtn, styles.smallBtnDisabled]} disabled>
                      <Ionicons name="play" size={12} color={colors.textSecondary} />
                      <Text style={[styles.smallBtnText, styles.smallBtnTextDisabled]}>確認する（準備中）</Text>
                    </Pressable>
                  </View>
                </>
              )}
            </View>
          );
        })}
      </View>

      <Pressable style={styles.finishBtn} onPress={() => setDone(true)}>
        <Text style={styles.finishText}>練習を終える</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  hint: { fontSize: 11, color: colors.textSecondary, marginHorizontal: spacing.lg, marginTop: spacing.md },
  list: { paddingHorizontal: spacing.lg, marginTop: spacing.md, gap: spacing.sm },
  themCard: { backgroundColor: colors.white, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.md },
  themLabel: { fontSize: 11, color: colors.textSecondary, marginBottom: 4 },
  themText: { fontSize: 13, color: colors.textPrimary, lineHeight: 18 },
  playBtn: { width: 30, height: 30, borderRadius: 15, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', marginTop: spacing.sm, alignSelf: 'flex-start' },
  meCard: { backgroundColor: colors.white, borderRadius: radius.md, borderWidth: 1, borderColor: colors.coral, padding: spacing.md, alignItems: 'center' },
  meLabel: { alignSelf: 'flex-start', fontSize: 11, color: colors.coral, marginBottom: 4, fontWeight: '600' },
  recBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.coral, alignItems: 'center', justifyContent: 'center', marginTop: spacing.sm },
  recBtnActive: { backgroundColor: colors.danger },
  smallHint: { fontSize: 11, color: colors.textSecondary, marginTop: spacing.xs },
  doneBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: spacing.sm },
  doneBadgeText: { fontSize: 12, color: colors.textPrimary, fontWeight: '600' },
  secondRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  smallBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill, paddingVertical: 4, paddingHorizontal: spacing.sm },
  smallBtnDisabled: { opacity: 0.5 },
  smallBtnText: { fontSize: 11, color: colors.textPrimary, fontWeight: '600' },
  smallBtnTextDisabled: { color: colors.textSecondary },
  finishBtn: { backgroundColor: colors.coral, borderRadius: radius.pill, marginHorizontal: spacing.lg, marginVertical: spacing.xl, paddingVertical: spacing.md, alignItems: 'center' },
  finishText: { color: colors.white, fontWeight: '700' },
});
