import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { ReactNode, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { apiPost } from '../src/api/mobileAuth';
import { EnglishText } from '../src/components/EnglishText';
import { LangSwipe } from '../src/components/LangSwipe';
import { TopBar } from '../src/components/TopBar';
import { TtsLineButton } from '../src/components/TtsLineButton';
import { TtsPlayerBar } from '../src/components/TtsPlayerBar';
import { generateWeeklyMaterial, VocabItem, WEEKLY_STEPS } from '../src/data/weekly';
import { useProfile } from '../src/store/ProfileContext';
import { colors, radius, spacing } from '../src/theme/colors';
import { toSlashReading } from '../src/utils/slashReading';
import { voiceForGender } from '../src/utils/ttsVoice';

const QUIZ_PASS_RATE = 0.8;

// screen key: weekly_step（Weeklyミッション STEP1〜6 の各ステップ画面）
export default function WeeklyStepScreen() {
  const { step: stepParam } = useLocalSearchParams<{ step?: string }>();
  const step = Number(stepParam) || 1;
  const def = WEEKLY_STEPS.find((s) => s.step === step) ?? WEEKLY_STEPS[0];
  const w = useMemo(() => generateWeeklyMaterial(), []);
  const { profile } = useProfile();
  const voice = voiceForGender(profile.voiceGender);
  const [saving, setSaving] = useState(false);
  const [canComplete, setCanComplete] = useState(step !== 2 && step !== 6);

  const complete = async () => {
    setSaving(true);
    try {
      await apiPost('/weekly-progress', { step: def.step });
      router.replace('/weekly_material');
    } catch (e) {
      Alert.alert('保存に失敗しました', 'サーバーに接続できませんでした。もう一度お試しください。');
    } finally {
      setSaving(false);
    }
  };

  let content: ReactNode = null;
  if (step === 1) content = <VocabCheck vocab={w.vocab} voice={voice} />;
  else if (step === 2) content = <VocabTest vocab={w.vocab} onPassed={setCanComplete} />;
  else if (step === 3) content = <SlashStep w={w} />;
  else if (step === 4) content = <ReadAloudStep w={w} voice={voice} />;
  else if (step === 5) content = <ShadowingStep w={w} voice={voice} />;
  else content = <BackTranslationStep w={w} voice={voice} onAllRevealed={setCanComplete} />;

  return (
    <View style={styles.screen}>
      <TopBar title={`STEP${def.step} ${def.title}`} backRoute="/weekly_material" />
      <ScrollView>
        <Text style={styles.desc}>{def.desc}</Text>
        {step >= 3 && <Text style={styles.hint}>英文の単語を長押しすると意味が表示されます</Text>}
        {content}
        <Pressable style={[styles.cta, !canComplete && styles.ctaDisabled]} onPress={complete} disabled={!canComplete || saving}>
          <Text style={styles.ctaText}>{saving ? '保存中…' : step === 6 ? 'STEP6を完了する（テストが解放されます）' : 'このステップを完了する'}</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

// ---- STEP1 語彙・表現チェック ----
function VocabCheck({ vocab, voice }: { vocab: VocabItem[]; voice: ReturnType<typeof voiceForGender> }) {
  return (
    <View style={styles.card}>
      {vocab.map((v, i) => (
        <View key={v.en} style={[styles.vocabRow, i > 0 && styles.rowBordered]}>
          <View style={{ flex: 1 }}>
            <Text style={styles.vocabEn}>{v.en}</Text>
            <Text style={styles.vocabJp}>
              <Text style={styles.pos}>{v.pos}</Text>　{v.jp}
            </Text>
          </View>
          <TtsLineButton text={v.en} voice={voice} style={styles.roundBtn} />
        </View>
      ))}
    </View>
  );
}

// ---- STEP2 語彙・表現テスト（4択） ----
type Question = { en: string; options: string[]; answer: string };

function buildQuestions(vocab: VocabItem[]): Question[] {
  return vocab.map((v) => {
    const others = vocab.filter((o) => o.en !== v.en).map((o) => o.jp);
    const distractors = others.sort(() => Math.random() - 0.5).slice(0, 3);
    const options = [...distractors, v.jp].sort(() => Math.random() - 0.5);
    return { en: v.en, options, answer: v.jp };
  });
}

function VocabTest({ vocab, onPassed }: { vocab: VocabItem[]; onPassed: (ok: boolean) => void }) {
  const [round, setRound] = useState(0);
  const questions = useMemo(() => buildQuestions(vocab), [vocab, round]);
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [correct, setCorrect] = useState(0);
  const finished = idx >= questions.length;
  const passed = finished && correct / questions.length >= QUIZ_PASS_RATE;

  const choose = (opt: string) => {
    if (picked) return;
    setPicked(opt);
    if (opt === questions[idx].answer) setCorrect((c) => c + 1);
  };

  const next = () => {
    const nextIdx = idx + 1;
    setPicked(null);
    setIdx(nextIdx);
    if (nextIdx >= questions.length) {
      const finalCorrect = correct;
      onPassed(finalCorrect / questions.length >= QUIZ_PASS_RATE);
    }
  };

  const retry = () => {
    setRound((r) => r + 1);
    setIdx(0);
    setPicked(null);
    setCorrect(0);
    onPassed(false);
  };

  if (finished) {
    return (
      <View style={styles.card}>
        <Text style={styles.scoreTitle}>{passed ? '合格です！' : 'もう少し！'}</Text>
        <Text style={styles.scoreText}>
          {questions.length}問中 {correct}問正解（合格ライン {Math.round(QUIZ_PASS_RATE * 100)}%）
        </Text>
        {!passed && (
          <Pressable style={styles.retryBtn} onPress={retry}>
            <Text style={styles.retryText}>もう一度挑戦する</Text>
          </Pressable>
        )}
      </View>
    );
  }

  const q = questions[idx];
  return (
    <View style={styles.card}>
      <Text style={styles.qCount}>
        {idx + 1} / {questions.length}
      </Text>
      <Text style={styles.qText}>{q.en}</Text>
      <View style={{ gap: spacing.sm, marginTop: spacing.md }}>
        {q.options.map((opt) => {
          const isAnswer = opt === q.answer;
          const isPicked = opt === picked;
          return (
            <Pressable
              key={opt}
              style={[styles.option, picked && isAnswer && styles.optionCorrect, picked && isPicked && !isAnswer && styles.optionWrong]}
              onPress={() => choose(opt)}
            >
              <Text style={styles.optionText}>{opt}</Text>
            </Pressable>
          );
        })}
      </View>
      {picked && (
        <Pressable style={styles.nextBtn} onPress={next}>
          <Text style={styles.nextText}>{idx + 1 >= questions.length ? '結果を見る' : '次の問題へ'}</Text>
        </Pressable>
      )}
    </View>
  );
}

type Material = ReturnType<typeof generateWeeklyMaterial>;

// ---- STEP3 スラッシュリーディング（英文を横にスワイプすると日本語） ----
function SlashStep({ w }: { w: Material }) {
  const card = (texts: string[], english: boolean) => (
    <View style={styles.paraCard}>
      {texts.map((t, i) =>
        english ? (
          <EnglishText key={i} text={t} style={styles.paraText} />
        ) : (
          <Text key={i} style={styles.paraText}>
            {t}
          </Text>
        )
      )}
    </View>
  );
  return (
    <View style={styles.swipeWrap}>
      <LangSwipe en={card(w.paragraphsEN.map(toSlashReading), true)} jp={card(w.paragraphsJP, false)} />
    </View>
  );
}

// ---- STEP4 音読 ----
function ReadAloudStep({ w, voice }: { w: Material; voice: ReturnType<typeof voiceForGender> }) {
  return (
    <>
      <View style={[styles.paraCard, styles.swipeWrap]}>
        {w.paragraphsEN.map((t, i) => (
          <EnglishText key={i} text={t} style={styles.paraText} />
        ))}
      </View>
      <View style={styles.playerCard}>
        <TtsPlayerBar text={w.paragraphsEN.join(' ')} voice={voice} />
      </View>
    </>
  );
}

// ---- STEP5 シャドーイング ----
function ShadowingStep({ w, voice }: { w: Material; voice: ReturnType<typeof voiceForGender> }) {
  const [hidden, setHidden] = useState(true);
  return (
    <>
      <View style={styles.hideRow}>
        <Text style={styles.hideLabel}>テキストを隠す</Text>
        <Switch value={hidden} onValueChange={setHidden} trackColor={{ true: colors.coral }} />
      </View>
      <View style={[styles.paraCard, styles.swipeWrap]}>
        {hidden ? (
          <Text style={styles.hiddenNote}>音声を聞きながら、少し遅れて真似して声に出しましょう。詰まったらテキストを表示して確認できます。</Text>
        ) : (
          w.paragraphsEN.map((t, i) => <EnglishText key={i} text={t} style={styles.paraText} />)
        )}
      </View>
      <View style={styles.playerCard}>
        <TtsPlayerBar text={w.paragraphsEN.join(' ')} voice={voice} />
      </View>
    </>
  );
}

// ---- STEP6 反訳トレーニング（日本語を見て英語で言い、答え合わせ） ----
function BackTranslationStep({ w, voice, onAllRevealed }: { w: Material; voice: ReturnType<typeof voiceForGender>; onAllRevealed: (ok: boolean) => void }) {
  const [revealed, setRevealed] = useState<Set<number>>(new Set());
  const reveal = (i: number) => {
    const next = new Set(revealed).add(i);
    setRevealed(next);
    onAllRevealed(next.size >= w.paragraphsJP.length);
  };
  return (
    <View style={[styles.swipeWrap, { gap: spacing.md }]}>
      {w.paragraphsJP.map((jp, i) => (
        <View key={i} style={styles.paraCard}>
          <Text style={styles.qCount}>段落 {i + 1}</Text>
          <Text style={styles.paraText}>{jp}</Text>
          {revealed.has(i) ? (
            <View style={styles.answerBox}>
              <EnglishText text={w.paragraphsEN[i]} style={styles.paraText} />
              <TtsLineButton text={w.paragraphsEN[i]} voice={voice} style={styles.roundBtn} />
            </View>
          ) : (
            <Pressable style={styles.revealBtn} onPress={() => reveal(i)}>
              <Ionicons name="eye-outline" size={14} color={colors.coral} />
              <Text style={styles.revealText}>英語で言ってから答え合わせ</Text>
            </Pressable>
          )}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  desc: { fontSize: 12, color: colors.textSecondary, marginHorizontal: spacing.lg, marginTop: spacing.md, lineHeight: 18 },
  hint: { fontSize: 11, color: colors.coral, marginHorizontal: spacing.lg, marginTop: spacing.xs },
  card: { margin: spacing.lg, backgroundColor: colors.white, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.md },
  vocabRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm },
  rowBordered: { borderTopWidth: 1, borderTopColor: colors.border },
  vocabEn: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  vocabJp: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  pos: { fontSize: 10, color: colors.coral, fontWeight: '700' },
  roundBtn: { width: 30, height: 30, borderRadius: 15, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  qCount: { fontSize: 11, color: colors.textSecondary, fontWeight: '600' },
  qText: { fontSize: 18, fontWeight: '700', color: colors.textPrimary, marginTop: spacing.sm },
  option: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md },
  optionCorrect: { backgroundColor: 'rgba(46,160,110,0.12)', borderColor: colors.success },
  optionWrong: { backgroundColor: 'rgba(214,69,69,0.1)', borderColor: colors.danger },
  optionText: { fontSize: 13, color: colors.textPrimary },
  nextBtn: { marginTop: spacing.md, alignItems: 'center', paddingVertical: spacing.sm, borderRadius: radius.pill, backgroundColor: colors.navy },
  nextText: { color: colors.white, fontWeight: '700', fontSize: 13 },
  scoreTitle: { fontSize: 18, fontWeight: '700', color: colors.textPrimary, textAlign: 'center' },
  scoreText: { fontSize: 12, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.sm },
  retryBtn: { marginTop: spacing.md, alignItems: 'center', paddingVertical: spacing.sm, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.coral },
  retryText: { color: colors.coral, fontWeight: '700', fontSize: 13 },
  swipeWrap: { marginHorizontal: spacing.lg, marginTop: spacing.md },
  paraCard: { backgroundColor: colors.white, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.md, gap: spacing.sm },
  paraText: { fontSize: 12.5, color: colors.textPrimary, lineHeight: 19 },
  playerCard: { margin: spacing.lg, backgroundColor: colors.white, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.md },
  hideRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginHorizontal: spacing.lg, marginTop: spacing.md },
  hideLabel: { fontSize: 12, color: colors.textSecondary },
  hiddenNote: { fontSize: 12, color: colors.textSecondary, lineHeight: 18 },
  revealBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', marginTop: spacing.xs },
  revealText: { color: colors.coral, fontSize: 12, fontWeight: '600' },
  answerBox: { backgroundColor: colors.background, borderRadius: radius.sm, padding: spacing.sm, gap: spacing.sm },
  cta: { backgroundColor: colors.coral, borderRadius: radius.pill, marginHorizontal: spacing.lg, marginTop: spacing.md, marginBottom: spacing.xl, paddingVertical: spacing.md, alignItems: 'center' },
  ctaDisabled: { opacity: 0.4 },
  ctaText: { color: colors.white, fontWeight: '700' },
});
