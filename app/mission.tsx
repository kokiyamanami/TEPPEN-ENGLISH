import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { apiPost } from '../src/api/mobileAuth';
import { submitForGrading } from '../src/api/grading';
import { RecordCard } from '../src/components/RecordCard';
import { ResultView } from '../src/components/ResultView';
import { TopBar } from '../src/components/TopBar';
import { useAudioRecordFlow } from '../src/hooks/useAudioRecordFlow';
import { colors, radius, spacing } from '../src/theme/colors';

// screen key: mission (Monthlyミッション「MYピッチ」)
// TODO: メモ内容の永続化（現状はローカル状態のみ）
export default function MissionScreen() {
  const record = useAudioRecordFlow();
  const [memo, setMemo] = useState('');
  const [grading, setGrading] = useState(false);
  const [result, setResult] = useState<{ pass: boolean; comment: string; transcript: string } | null>(null);

  const submit = async () => {
    if (!record.uri) return;
    setGrading(true);
    try {
      const res = await submitForGrading(
        record.uri,
        'Monthlyミッション: MYピッチ',
        memo.trim() || '(自由スピーチ。特定の原稿指定なし。内容の一貫性・具体性・発話量を評価してください)',
        ''
      );
      setResult(res);
      await apiPost('/monthly-mission', { pass: res.pass }).catch(() => {});
    } catch (e) {
      Alert.alert('添削に失敗しました', 'サーバーに接続できませんでした。もう一度お試しください。');
    } finally {
      setGrading(false);
    }
  };

  if (result) {
    return (
      <ScrollView style={styles.screen}>
        <TopBar title="Monthlyミッション" backRoute="/speaking_hub" />
        <ResultView
          pass={result.pass}
          title={result.pass ? '合格です！' : '不合格でした'}
          subtitle="「MYピッチ」をAIが添削しました。"
          primaryLabel="もう一度挑戦する"
          onPrimary={() => {
            record.reset();
            setResult(null);
          }}
          secondaryLabel="ミッションHubに戻る"
          onSecondary={() => router.replace('/speaking_hub')}
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
      <TopBar title="Monthlyミッション" backRoute="/speaking_hub" />

      <View style={styles.statusCard}>
        <Text style={styles.statusTag}>MYピッチ · 8月分</Text>
        <Text style={styles.statusBig}>{record.phase === 'idle' ? '未録音' : record.phase === 'recorded' ? '録音済み' : '録音中'}</Text>
        <Text style={styles.statusSub}>月1回だけ挑戦できるスピーチ課題です</Text>
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
      />

      <Text style={styles.sectionTitle}>スピーチ原稿メモ</Text>
      <View style={styles.memoCard}>
        <Text style={styles.memoHint}>下書きや、他で作った原稿をコピペして残しておけます</Text>
        <TextInput
          style={styles.memoInput}
          multiline
          numberOfLines={6}
          value={memo}
          onChangeText={setMemo}
          placeholder="ここにスピーチの原稿を書く・貼り付けておけます"
          placeholderTextColor={colors.textSecondary}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  statusCard: { margin: spacing.lg, marginBottom: 0, backgroundColor: colors.white, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.lg },
  statusTag: { color: colors.coral, fontSize: 11, fontWeight: '700' },
  statusBig: { fontSize: 22, fontWeight: '700', color: colors.textPrimary, marginTop: spacing.xs },
  statusSub: { fontSize: 11, color: colors.textSecondary, marginTop: spacing.xs },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: colors.textPrimary, marginHorizontal: spacing.lg, marginTop: spacing.lg, marginBottom: spacing.sm },
  memoCard: { marginHorizontal: spacing.lg, marginBottom: spacing.xl, backgroundColor: colors.white, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.md },
  memoHint: { fontSize: 10, color: colors.textSecondary, marginBottom: spacing.sm },
  memoInput: { minHeight: 120, textAlignVertical: 'top', fontSize: 13, color: colors.textPrimary },
  feedbackCard: { width: '100%', backgroundColor: colors.background, borderRadius: radius.md, padding: spacing.md, marginTop: spacing.md },
  feedbackLabel: { fontSize: 11, color: colors.textSecondary, marginBottom: spacing.xs },
  feedbackText: { fontSize: 13, color: colors.textPrimary, lineHeight: 19 },
});
