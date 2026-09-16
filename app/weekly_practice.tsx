import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { RecordCard } from '../src/components/RecordCard';
import { ResultView } from '../src/components/ResultView';
import { TopBar } from '../src/components/TopBar';
import { generateWeeklyMaterial, randomWeeklyFeedback } from '../src/data/weekly';
import { useRecordFlow } from '../src/hooks/useRecordFlow';
import { colors, radius, spacing } from '../src/theme/colors';

// screen key: weekly_practice
export default function WeeklyPracticeScreen() {
  const w = useMemo(() => generateWeeklyMaterial(), []);
  const record = useRecordFlow();
  const [grading, setGrading] = useState(false);
  const [result, setResult] = useState<{ pass: boolean; comment: string } | null>(null);

  const submit = () => {
    setGrading(true);
    setTimeout(() => {
      setGrading(false);
      setResult(randomWeeklyFeedback());
    }, 1400);
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
