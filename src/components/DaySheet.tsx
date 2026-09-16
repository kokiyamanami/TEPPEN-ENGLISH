import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { STUDY_CATEGORIES, STUDY_SUBCATEGORIES, StudyLogEntry } from '../data/records';
import { colors, radius, spacing } from '../theme/colors';

type Props = {
  visible: boolean;
  dateLabel: string;
  existing: StudyLogEntry | null;
  onCancel: () => void;
  onSave: (entry: StudyLogEntry) => void;
  onDelete: () => void;
};

export function DaySheet({ visible, dateLabel, existing, onCancel, onSave, onDelete }: Props) {
  const [category, setCategory] = useState(STUDY_CATEGORIES[0].key);
  const [subs, setSubs] = useState<string[]>([]);
  const [minutes, setMinutes] = useState('30');
  const [memo, setMemo] = useState('');

  useEffect(() => {
    if (visible) {
      setCategory(existing?.category ?? STUDY_CATEGORIES[0].key);
      setSubs(existing?.subcategories ?? []);
      setMinutes(String(existing?.minutes ?? 30));
      setMemo(existing?.memo ?? '');
    }
  }, [visible, existing]);

  const toggleSub = (s: string) => {
    setSubs((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <Text style={styles.title}>{existing ? '学習記録を編集' : '学習記録を登録'}</Text>
          <Text style={styles.sub}>{dateLabel}</Text>

          <Text style={styles.label}>カテゴリー</Text>
          <View style={styles.catGrid}>
            {STUDY_CATEGORIES.map((c) => (
              <Pressable key={c.key} style={[styles.catOption, category === c.key && styles.catOptionSel]} onPress={() => setCategory(c.key)}>
                <Ionicons name={c.icon} size={16} color={category === c.key ? colors.white : colors.textPrimary} />
                <Text style={[styles.catText, category === c.key && styles.catTextSel]}>{c.label}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.label}>学習内容（複数選択可）</Text>
          <View style={styles.chipRow}>
            {STUDY_SUBCATEGORIES.map((s) => (
              <Pressable key={s} style={[styles.chip, subs.includes(s) && styles.chipSel]} onPress={() => toggleSub(s)}>
                <Text style={[styles.chipText, subs.includes(s) && styles.chipTextSel]}>{s}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.label}>学習時間（分）</Text>
          <TextInput style={styles.input} keyboardType="number-pad" value={minutes} onChangeText={setMinutes} />

          <Text style={styles.label}>メモ</Text>
          <TextInput style={[styles.input, styles.memoInput]} multiline value={memo} onChangeText={setMemo} />

          <View style={styles.rowBtn}>
            <Pressable style={styles.cancelBtn} onPress={onCancel}>
              <Text style={styles.cancelText}>キャンセル</Text>
            </Pressable>
            <Pressable
              style={styles.confirmBtn}
              onPress={() =>
                onSave({ category, subcategories: subs.length ? subs : [STUDY_SUBCATEGORIES[0]], minutes: Number(minutes) || 0, memo })
              }
            >
              <Text style={styles.confirmText}>{existing ? '修正する' : '登録する'}</Text>
            </Pressable>
          </View>
          {existing && (
            <Pressable style={styles.deleteBtn} onPress={onDelete}>
              <Text style={styles.deleteText}>この記録を削除する</Text>
            </Pressable>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.white, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, padding: spacing.lg, maxHeight: '85%' },
  title: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
  sub: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  label: { fontSize: 12, color: colors.textSecondary, marginTop: spacing.md, marginBottom: spacing.xs },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  catOption: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill, paddingVertical: 6, paddingHorizontal: spacing.sm },
  catOptionSel: { backgroundColor: colors.navy, borderColor: colors.navy },
  catText: { fontSize: 12, color: colors.textPrimary },
  catTextSel: { color: colors.white },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  chip: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill, paddingVertical: 6, paddingHorizontal: spacing.sm },
  chipSel: { backgroundColor: colors.coral, borderColor: colors.coral },
  chipText: { fontSize: 11, color: colors.textPrimary },
  chipTextSel: { color: colors.white },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, fontSize: 13, color: colors.textPrimary },
  memoInput: { minHeight: 60, textAlignVertical: 'top' },
  rowBtn: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg },
  cancelBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.md, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border },
  cancelText: { color: colors.textPrimary, fontWeight: '600' },
  confirmBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.md, borderRadius: radius.pill, backgroundColor: colors.coral },
  confirmText: { color: colors.white, fontWeight: '700' },
  deleteBtn: { alignItems: 'center', marginTop: spacing.md },
  deleteText: { color: colors.danger, fontSize: 12, fontWeight: '600' },
});
