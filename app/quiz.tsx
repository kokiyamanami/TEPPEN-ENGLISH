import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { TopBar } from '../src/components/TopBar';
import { usePhrases } from '../src/store/PhraseContext';
import { colors, radius, spacing } from '../src/theme/colors';

const COUNT_OPTIONS = [10, 30, 50];
const ORDER_OPTIONS = ['ランダム', '順番通り'] as const;

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// screen key: quiz
export default function QuizScreen() {
  const { folderId } = useLocalSearchParams<{ folderId?: string }>();
  const { folders, phrases } = usePhrases();
  const folder = folders.find((f) => f.id === folderId);
  const folderPhrases = phrases.filter((p) => p.folderId === folderId);

  const [count, setCount] = useState(30);
  const [order, setOrder] = useState<(typeof ORDER_OPTIONS)[number]>('ランダム');
  const [started, setStarted] = useState(false);
  const [quizIndex, setQuizIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);

  const quizSet = useMemo(() => {
    const base = order === 'ランダム' ? shuffle(folderPhrases) : folderPhrases;
    return base.slice(0, Math.min(count, base.length));
  }, [started]); // eslint-disable-line react-hooks/exhaustive-deps

  if (started) {
    if (quizSet.length === 0 || quizIndex >= quizSet.length) {
      return (
        <View style={styles.screen}>
          <TopBar title="MYクイズ" backRoute={`/phrase_folder?folderId=${folderId}`} />
          <View style={styles.doneWrap}>
            <Text style={styles.doneTitle}>お疲れさまでした！</Text>
            <Text style={styles.doneSub}>{quizSet.length}問のクイズを終えました。</Text>
            <Pressable style={styles.primaryBtn} onPress={() => router.replace({ pathname: '/phrase_folder', params: { folderId } } as never)}>
              <Text style={styles.primaryBtnText}>フォルダに戻る</Text>
            </Pressable>
          </View>
        </View>
      );
    }
    const q = quizSet[quizIndex];
    return (
      <View style={styles.screen}>
        <TopBar title="MYクイズ" backRoute={`/phrase_folder?folderId=${folderId}`} />
        <Text style={styles.quizProgress}>
          {quizIndex + 1} / {quizSet.length}
        </Text>
        <Pressable style={styles.quizCard} onPress={() => setRevealed((v) => !v)}>
          <Text style={styles.quizEn}>&quot;{q.text}&quot;</Text>
          {revealed && q.textJP ? <Text style={styles.quizJp}>{q.textJP}</Text> : <Text style={styles.tapHint}>タップして和訳を見る</Text>}
        </Pressable>
        <Pressable
          style={styles.primaryBtn}
          onPress={() => {
            setRevealed(false);
            setQuizIndex((i) => i + 1);
          }}
        >
          <Text style={styles.primaryBtnText}>次へ</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <TopBar title="MYクイズ" backRoute={`/phrase_folder?folderId=${folderId}`} />

      <Text style={styles.sectionTitle}>出題フォルダ</Text>
      <View style={styles.card}>
        <Text style={styles.folderName}>{folder?.name ?? ''}</Text>
        <Text style={styles.folderSub}>{folderPhrases.length}件のフレーズから出題</Text>
      </View>

      <Text style={styles.sectionTitle}>出題数</Text>
      <View style={styles.optRow}>
        {COUNT_OPTIONS.map((c) => (
          <Pressable key={c} style={[styles.opt, count === c && styles.optSel]} onPress={() => setCount(c)}>
            <Text style={[styles.optText, count === c && styles.optTextSel]}>{c}問</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.sectionTitle}>出題順</Text>
      <View style={styles.optRow}>
        {ORDER_OPTIONS.map((o) => (
          <Pressable key={o} style={[styles.opt, order === o && styles.optSel]} onPress={() => setOrder(o)}>
            <Text style={[styles.optText, order === o && styles.optTextSel]}>{o}</Text>
          </Pressable>
        ))}
      </View>

      <Pressable
        style={styles.primaryBtn}
        onPress={() => {
          setQuizIndex(0);
          setRevealed(false);
          setStarted(true);
        }}
      >
        <Text style={styles.primaryBtnText}>クイズを開始する</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: colors.textPrimary, marginHorizontal: spacing.lg, marginTop: spacing.lg, marginBottom: spacing.sm },
  card: { marginHorizontal: spacing.lg, backgroundColor: colors.white, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.md },
  folderName: { fontSize: 13, fontWeight: '700', color: colors.textPrimary },
  folderSub: { fontSize: 11, color: colors.textSecondary, marginTop: 4 },
  optRow: { flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.lg },
  opt: { paddingVertical: spacing.sm, paddingHorizontal: spacing.md, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border },
  optSel: { backgroundColor: colors.navy, borderColor: colors.navy },
  optText: { fontSize: 12, color: colors.textPrimary },
  optTextSel: { color: colors.white },
  primaryBtn: { backgroundColor: colors.coral, borderRadius: radius.pill, marginHorizontal: spacing.lg, marginTop: spacing.xl, paddingVertical: spacing.md, alignItems: 'center' },
  primaryBtnText: { color: colors.white, fontWeight: '700' },
  quizProgress: { textAlign: 'center', fontSize: 12, color: colors.textSecondary, marginTop: spacing.md },
  quizCard: { margin: spacing.lg, backgroundColor: colors.white, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.xl, alignItems: 'center', minHeight: 160, justifyContent: 'center' },
  quizEn: { fontSize: 16, fontWeight: '600', color: colors.textPrimary, textAlign: 'center' },
  quizJp: { fontSize: 13, color: colors.textSecondary, marginTop: spacing.md, textAlign: 'center' },
  tapHint: { fontSize: 11, color: colors.textSecondary, marginTop: spacing.md },
  doneWrap: { alignItems: 'center', padding: spacing.xl, marginTop: spacing.xl },
  doneTitle: { fontSize: 18, fontWeight: '700', color: colors.textPrimary },
  doneSub: { fontSize: 13, color: colors.textSecondary, marginTop: spacing.sm },
});
