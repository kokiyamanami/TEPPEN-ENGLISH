import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { RecordCard } from '../src/components/RecordCard';
import { ResultView } from '../src/components/ResultView';
import { TopBar } from '../src/components/TopBar';
import { generatePresentation } from '../src/data/situational';
import { useRecordFlow } from '../src/hooks/useRecordFlow';
import { colors, radius, spacing } from '../src/theme/colors';

// screen key: presentation_practice
export default function PresentationPracticeScreen() {
  const p = useMemo(() => generatePresentation(0), []);
  const record = useRecordFlow();
  const [done, setDone] = useState(false);

  if (done) {
    return (
      <ScrollView style={styles.screen}>
        <TopBar title="プレゼン練習" backRoute="/presentation_material" />
        <ResultView
          pass
          title="練習お疲れさまでした！"
          subtitle={`「${p.topic}」のプレゼンを練習しました。\n気になった表現はMYフレーズに残しておきましょう。`}
          primaryLabel="もう一度練習する"
          onPrimary={() => {
            record.reset();
            setDone(false);
          }}
          secondaryLabel="教材に戻る"
          onSecondary={() => router.replace('/presentation_material')}
        />
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.screen}>
      <TopBar title="プレゼン練習" backRoute="/presentation_material" />
      <View style={styles.scriptCard}>
        <Text style={styles.scriptTitle}>原稿</Text>
        <Text style={styles.scriptText}>{p.paragraphsEN.join(' ')}</Text>
      </View>

      <RecordCard
        phase={record.phase}
        seconds={record.seconds}
        onStart={record.start}
        onStop={record.stop}
        onRetake={record.retake}
        onSubmit={() => setDone(true)}
        submitLabel="練習を終える"
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
});
