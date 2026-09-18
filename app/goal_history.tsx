import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { TopBar } from '../src/components/TopBar';
import { CURRENT_TERM_LABEL } from '../src/data/goals';
import { useGoals } from '../src/store/GoalsContext';
import { useProfile } from '../src/store/ProfileContext';
import { colors, radius, spacing } from '../src/theme/colors';
import { useTopInset } from '../src/hooks/useTopInset';

// screen key: goal_history
export default function GoalHistoryScreen() {
  const topInset = useTopInset();
  const { studyGoal, speakGoal, setDailyGoals, termGoalHistory, addTermGoal } = useGoals();
  const { setField } = useProfile();
  const [studyInput, setStudyInput] = useState(String(studyGoal));
  const [speakInput, setSpeakInput] = useState(String(speakGoal));
  // サーバーから目標を読み込んだ後に入力欄へ反映する
  useEffect(() => {
    setStudyInput(String(studyGoal));
    setSpeakInput(String(speakGoal));
  }, [studyGoal, speakGoal]);
  const [showNewGoal, setShowNewGoal] = useState(false);
  const [newGoalText, setNewGoalText] = useState('');

  const saveDailyGoals = () => {
    // サーバーは整数(1〜1440)のみ受け付けるため、小数入力は四捨五入する
    setDailyGoals(Math.round(Number(studyInput)) || studyGoal, Math.round(Number(speakInput)) || speakGoal);
  };

  const saveNewGoal = () => {
    if (!newGoalText.trim()) return;
    addTermGoal(newGoalText.trim());
    setField('termGoal', newGoalText.trim());
    setShowNewGoal(false);
  };

  const reversedHistory = [...termGoalHistory].reverse();

  return (
    <ScrollView style={styles.screen}>
      <TopBar title="目標設定" backRoute="/(tabs)/mypage" />

      <Text style={styles.sectionTitle}>1日の目標</Text>
      <View style={styles.card}>
        <Text style={styles.label}>学習時間（分/日）</Text>
        <TextInput style={styles.input} keyboardType="number-pad" value={studyInput} onChangeText={setStudyInput} onBlur={saveDailyGoals} />
        <Text style={styles.label}>発話時間（分/日）</Text>
        <TextInput style={styles.input} keyboardType="number-pad" value={speakInput} onChangeText={setSpeakInput} onBlur={saveDailyGoals} />
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>タームの目標</Text>
        <Pressable style={styles.newBtn} onPress={() => setShowNewGoal(true)}>
          <Ionicons name="add" size={13} color={colors.coral} />
          <Text style={styles.newBtnText}>新しい目標</Text>
        </Pressable>
      </View>
      <View style={styles.card}>
        {reversedHistory.map((g, i) => (
          <View key={i} style={[styles.histRow, i > 0 && styles.histRowBordered, g.current && styles.histRowCurrent]}>
            <View style={styles.histTermRow}>
              <Text style={styles.histTerm}>{g.term}</Text>
              {g.current && <Text style={styles.youTag}> 現在</Text>}
            </View>
            <Text style={styles.histGoal}>{g.goal}</Text>
            <Text style={styles.histDate}>{g.setDate} 設定</Text>
          </View>
        ))}
      </View>

      <Modal visible={showNewGoal} transparent animationType="slide" onRequestClose={() => setShowNewGoal(false)}>
        <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={[styles.sheet, { paddingTop: topInset + spacing.lg }]}>
            <Text style={styles.sheetTitle}>新しい目標を設定</Text>
            <Text style={styles.sheetDesc}>現在のターム（{CURRENT_TERM_LABEL}）の目標として登録されます</Text>
            <TextInput
              style={styles.textarea}
              multiline
              value={newGoalText}
              onChangeText={setNewGoalText}
              placeholder="例）商談を英語で完結できるようにする"
              placeholderTextColor={colors.textSecondary}
            />
            <View style={styles.sheetRow}>
              <Pressable style={styles.cancelBtn} onPress={() => setShowNewGoal(false)}>
                <Text style={styles.cancelText}>キャンセル</Text>
              </Pressable>
              <Pressable style={styles.confirmBtn} onPress={saveNewGoal}>
                <Text style={styles.confirmText}>保存する</Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginHorizontal: spacing.lg, marginTop: spacing.lg },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: colors.textPrimary, marginHorizontal: spacing.lg, marginTop: spacing.lg, marginBottom: spacing.sm },
  newBtn: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  newBtnText: { color: colors.coral, fontSize: 12, fontWeight: '600' },
  card: { marginHorizontal: spacing.lg, backgroundColor: colors.white, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.md },
  label: { fontSize: 12, color: colors.textSecondary, marginTop: spacing.sm, marginBottom: spacing.xs },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, fontSize: 14, color: colors.textPrimary },
  histRow: { padding: spacing.md, borderTopWidth: 1, borderTopColor: colors.border },
  histRowBordered: {},
  histRowCurrent: { backgroundColor: 'rgba(232,130,95,0.08)' },
  histTermRow: { flexDirection: 'row', alignItems: 'center' },
  histTerm: { fontSize: 11, color: colors.textSecondary, fontWeight: '600' },
  youTag: { fontSize: 10, color: colors.coral, fontWeight: '700' },
  histGoal: { fontSize: 13, color: colors.textPrimary, fontWeight: '600', marginTop: 4 },
  histDate: { fontSize: 10, color: colors.textSecondary, marginTop: 2 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-start' },
  sheet: { backgroundColor: colors.white, borderBottomLeftRadius: radius.lg, borderBottomRightRadius: radius.lg, padding: spacing.lg },
  sheetTitle: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
  sheetDesc: { fontSize: 12, color: colors.textSecondary, marginTop: spacing.xs },
  textarea: { marginTop: spacing.md, borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, padding: spacing.sm, minHeight: 70, fontSize: 13, color: colors.textPrimary, textAlignVertical: 'top' },
  sheetRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg },
  cancelBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.md, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border },
  cancelText: { color: colors.textPrimary, fontWeight: '600' },
  confirmBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.md, borderRadius: radius.pill, backgroundColor: colors.coral },
  confirmText: { color: colors.white, fontWeight: '700' },
});
