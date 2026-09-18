import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { submitForGrading } from '../src/api/grading';
import { RecordCard } from '../src/components/RecordCard';
import { ResultView } from '../src/components/ResultView';
import { TopBar } from '../src/components/TopBar';
import { DAILY_MISSIONS, DailyMissionType } from '../src/data/dailyMissions';
import { useAudioRecordFlow } from '../src/hooks/useAudioRecordFlow';
import { colors, radius, spacing } from '../src/theme/colors';

type Phase = 'idle' | 'recording' | 'recorded' | 'grading';

// screen key: daily_task
export default function DailyTaskScreen() {
  const { type, origin } = useLocalSearchParams<{ type?: string; origin?: string }>();
  const missionType: DailyMissionType = type === 'photo' ? 'photo' : 'question';
  const mission = DAILY_MISSIONS[missionType];
  const backRoute = origin === 'freetraining' ? '/freetraining' : '/speaking_hub';
  const backLabel = origin === 'freetraining' ? 'フリー練習' : 'Dailyミッション';

  const record = useAudioRecordFlow();
  const [grading, setGrading] = useState(false);
  const [result, setResult] = useState<{ pass: boolean; comment: string; transcript: string } | null>(null);

  const submit = async () => {
    if (!record.uri) return;
    setGrading(true);
    try {
      const res = await submitForGrading(record.uri, mission.label, mission.prompt, mission.promptJP, `daily:${missionType}`);
      setResult(res);
    } catch (e) {
      Alert.alert('添削に失敗しました', 'サーバーに接続できませんでした。もう一度お試しください。');
    } finally {
      setGrading(false);
    }
  };

  const phase: Phase = grading ? 'grading' : record.phase;

  if (result) {
    return (
      <ScrollView style={styles.screen}>
        <TopBar title={mission.label} backRoute={backRoute} />
        <ResultView
          pass={result.pass}
          title={result.pass ? '合格です！' : '不合格でした'}
          subtitle="AIによる添削結果です"
          primaryLabel="もう一度挑戦する"
          onPrimary={() => {
            record.reset();
            setResult(null);
          }}
          secondaryLabel={`${backLabel}に戻る`}
          onSecondary={() => router.replace(backRoute as never)}
        >
          <View style={styles.feedbackCard}>
            <Text style={styles.feedbackLabel}>添削コメント</Text>
            <Text style={styles.feedbackText}>{result.comment}</Text>
          </View>
          <View style={styles.feedbackCard}>
            <Text style={styles.feedbackLabel}>あなたの発話（文字起こし）</Text>
            <Text style={styles.feedbackText}>{result.transcript || '(認識できませんでした)'}</Text>
          </View>
          <Text style={styles.sampleTitle}>見本の解答例</Text>
          <View style={styles.feedbackCard}>
            <Text style={styles.feedbackText}>{mission.sampleEN}</Text>
            <Text style={[styles.feedbackLabel, { marginTop: spacing.md }]}>日本語訳</Text>
            <Text style={styles.feedbackText}>{mission.sampleJP}</Text>
          </View>
        </ResultView>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.screen}>
      <TopBar title={mission.label} backRoute={backRoute} />

      {missionType === 'photo' ? (
        <View style={styles.photoPlaceholder}>
          <Ionicons name="image-outline" size={32} color={colors.white} />
          <Text style={styles.photoLabel}>DAILY MISSION</Text>
        </View>
      ) : (
        <View style={styles.questionCard}>
          <Text style={styles.questionTag}>TODAY'S QUESTION</Text>
          <Text style={styles.questionText}>&quot;{mission.prompt}&quot;</Text>
        </View>
      )}
      <Text style={styles.promptJP}>{mission.promptJP}</Text>

      <RecordCard
        phase={phase}
        seconds={record.seconds}
        uri={record.uri}
        onStart={record.start}
        onStop={record.stop}
        onRetake={record.retake}
        onSubmit={submit}
        submitLabel="提出してAI添削を受ける"
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  photoPlaceholder: {
    height: 160,
    margin: spacing.lg,
    marginBottom: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.navy,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  photoLabel: { color: colors.white, fontSize: 11, letterSpacing: 1 },
  questionCard: { margin: spacing.lg, marginBottom: spacing.sm, backgroundColor: colors.white, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.lg, alignItems: 'center' },
  questionTag: { fontSize: 10, color: colors.coral, fontWeight: '700', letterSpacing: 1 },
  questionText: { fontSize: 14, color: colors.textPrimary, fontWeight: '600', marginTop: spacing.sm, textAlign: 'center' },
  promptJP: { fontSize: 11, color: colors.textSecondary, marginHorizontal: spacing.lg, marginBottom: spacing.sm },
  feedbackCard: { width: '100%', backgroundColor: colors.background, borderRadius: radius.md, padding: spacing.md, marginTop: spacing.md },
  feedbackLabel: { fontSize: 11, color: colors.textSecondary, marginBottom: spacing.xs },
  feedbackText: { fontSize: 13, color: colors.textPrimary, lineHeight: 19 },
  sampleTitle: { alignSelf: 'flex-start', fontSize: 13, fontWeight: '700', color: colors.textPrimary, marginTop: spacing.lg },
});
