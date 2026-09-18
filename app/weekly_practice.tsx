import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { apiPost } from '../src/api/mobileAuth';
import { submitForGrading } from '../src/api/grading';
import { RecordCard } from '../src/components/RecordCard';
import { ResultView } from '../src/components/ResultView';
import { TopBar } from '../src/components/TopBar';
import { generateWeeklyMaterial } from '../src/data/weekly';
import { useAudioRecordFlow } from '../src/hooks/useAudioRecordFlow';
import { colors, radius, spacing } from '../src/theme/colors';

// screen key: weekly_practice
export default function WeeklyPracticeScreen() {
  const w = useMemo(() => generateWeeklyMaterial(), []);
  const record = useAudioRecordFlow();
  const [grading, setGrading] = useState(false);
  const [result, setResult] = useState<{ pass: boolean; comment: string; transcript: string } | null>(null);

  const submit = async () => {
    if (!record.uri) return;
    setGrading(true);
    try {
      const res = await submitForGrading(record.uri, `Weeklyミッション: ${w.topic}`, w.paragraphsEN.join(' '), w.paragraphsJP.join(' '));
      setResult(res);
      await apiPost('/weekly-mission', { pass: res.pass }).catch(() => {});
    } catch (e) {
      Alert.alert('添削に失敗しました', 'サーバーに接続できませんでした。もう一度お試しください。');
    } finally {
      setGrading(false);
    }
  };

  if (result) {
    return (
      <ScrollView style={styles.screen}>
        <TopBar title="Weeklyミッション 練習" backRoute="/weekly_material" />
        <ResultView
          pass={result.pass}
          title={result.pass ? '合格です！' : '不合格でした'}
          subtitle={`「${w.topic}」の発話練習をAIが添削しました。`}
          primaryLabel="もう一度練習する"
          onPrimary={() => {
            record.reset();
            setResult(null);
          }}
          secondaryLabel="教材に戻る"
          onSecondary={() => router.replace('/weekly_material')}
        >
          <View style={styles.feedbackCard}>
            <Text style={styles.feedbackLabel}>添削コメント</Text>
            <Text style={styles.feedbackText}>{result.comment}</Text>
          </View>
          <View style={styles.feedbackCard}>
            <Text style={styles.feedbackLabel}>あなたの発話（文字起こし）</Text>
            <Text style={styles.feedbackText}>{result.transcript || '(認識できませんでした)'}</Text>
          </View>
        </ResultView>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.screen}>
      <TopBar title="Weeklyミッション 練習" backRoute="/weekly_material" />
      <View style={styles.scriptCard}>
        <Text style={styles.scriptTitle}>原稿</Text>
        <Text style={styles.scriptText}>{w.paragraphsEN.join(' ')}</Text>
      </View>

      <RecordCard
        phase={grading ? 'grading' : record.phase}
        seconds={record.seconds}
        uri={record.uri}
        onStart={record.start}
        onStop={record.stop}
        onRetake={record.retake}
        onSubmit={submit}
        submitLabel="提出してAI添削を受ける"
        idleLabel="通しで録音してみましょう"
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  scriptCard: { margin: spacing.lg, marginBottom: 0, backgroundColor: colors.white, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.md },
  scriptTitle: { fontSize: 13, fontWeight: '700', color: colors.textPrimary, marginBottom: spacing.xs },
  scriptText: { fontSize: 12.5, color: colors.textSecondary, lineHeight: 19 },
  feedbackCard: { width: '100%', backgroundColor: colors.background, borderRadius: radius.md, padding: spacing.md, marginTop: spacing.md },
  feedbackLabel: { fontSize: 11, color: colors.textSecondary, marginBottom: spacing.xs },
  feedbackText: { fontSize: 13, color: colors.textPrimary, lineHeight: 19 },
});
