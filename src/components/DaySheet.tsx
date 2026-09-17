import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { STUDY_CATEGORIES, STUDY_SUBCATEGORIES, StudyLogEntry } from '../data/records';
import { colors, radius, spacing } from '../theme/colors';
import { addDays } from '../utils/dateHelpers';

const WEEKDAY_JP = ['日', '月', '火', '水', '木', '金', '土'];

type Props = {
  visible: boolean;
  date: Date | null;
  entries: StudyLogEntry[];
  onChangeDate: (d: Date) => void;
  onCancel: () => void;
  onSave: (entry: StudyLogEntry) => void;
  onDelete: (id: number) => void;
};

function label(d: Date | null) {
  if (!d) return '';
  return `${d.getMonth() + 1}月${d.getDate()}日（${WEEKDAY_JP[d.getDay()]}）`;
}

const EMPTY_FORM = { category: STUDY_CATEGORIES[0].key, subs: [] as string[], minutes: '30', memo: '' };

// 1日に複数件の学習記録を登録・編集・削除できるシート。日付は矢印で前後に移動できる
export function DaySheet({ visible, date, entries, onChangeDate, onCancel, onSave, onDelete }: Props) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    if (visible) {
      setEditingId(null);
      setForm(EMPTY_FORM);
    }
  }, [visible, date]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleSub = (s: string) => {
    setForm((prev) => ({ ...prev, subs: prev.subs.includes(s) ? prev.subs.filter((x) => x !== s) : [...prev.subs, s] }));
  };

  const startEdit = (e: StudyLogEntry) => {
    setEditingId(e.id ?? null);
    setForm({ category: e.category, subs: e.subcategories, minutes: String(e.minutes), memo: e.memo });
  };

  const startNew = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
  };

  const save = () => {
    onSave({
      id: editingId ?? undefined,
      category: form.category,
      subcategories: form.subs.length ? form.subs : [STUDY_SUBCATEGORIES[0]],
      minutes: Number(form.minutes) || 0,
      memo: form.memo,
    });
    startNew();
  };

  if (!date) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.title}>学習記録</Text>
            <View style={styles.dateNav}>
              <Pressable style={styles.dateNavBtn} onPress={() => onChangeDate(addDays(date, -1))} hitSlop={8}>
                <Ionicons name="chevron-back" size={18} color={colors.textPrimary} />
              </Pressable>
              <Text style={styles.dateNavLabel}>{label(date)}</Text>
              <Pressable style={styles.dateNavBtn} onPress={() => onChangeDate(addDays(date, 1))} hitSlop={8}>
                <Ionicons name="chevron-forward" size={18} color={colors.textPrimary} />
              </Pressable>
            </View>

            {entries.length > 0 && (
              <>
                <Text style={styles.label}>この日の記録（{entries.length}件）</Text>
                <View style={styles.entryList}>
                  {entries.map((e, i) => {
                    const cat = STUDY_CATEGORIES.find((c) => c.key === e.category);
                    const isEditing = editingId !== null && e.id === editingId;
                    return (
                      <Pressable
                        key={e.id ?? i}
                        style={[styles.entryRow, i > 0 && styles.entryRowBordered, isEditing && styles.entryRowActive]}
                        onPress={() => startEdit(e)}
                      >
                        <Ionicons name={cat?.icon ?? 'book-outline'} size={16} color={colors.navy} />
                        <Text style={styles.entryText} numberOfLines={1}>
                          {cat?.label ?? 'その他'} ・ {e.subcategories.join('、')}
                        </Text>
                        <Text style={styles.entryMin}>{e.minutes}分</Text>
                        <Pressable
                          hitSlop={8}
                          onPress={() => e.id !== undefined && onDelete(e.id)}
                          style={styles.entryDelete}
                        >
                          <Ionicons name="trash-outline" size={16} color={colors.danger} />
                        </Pressable>
                      </Pressable>
                    );
                  })}
                </View>
              </>
            )}

            <Text style={styles.formTitle}>{editingId !== null ? 'この記録を編集' : '記録を追加'}</Text>

            <Text style={styles.label}>カテゴリー</Text>
            <View style={styles.catGrid}>
              {STUDY_CATEGORIES.map((c) => (
                <Pressable
                  key={c.key}
                  style={[styles.catOption, form.category === c.key && styles.catOptionSel]}
                  onPress={() => setForm((prev) => ({ ...prev, category: c.key }))}
                >
                  <Ionicons name={c.icon} size={16} color={form.category === c.key ? colors.white : colors.textPrimary} />
                  <Text style={[styles.catText, form.category === c.key && styles.catTextSel]}>{c.label}</Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.label}>学習内容（複数選択可）</Text>
            <View style={styles.chipRow}>
              {STUDY_SUBCATEGORIES.map((s) => (
                <Pressable key={s} style={[styles.chip, form.subs.includes(s) && styles.chipSel]} onPress={() => toggleSub(s)}>
                  <Text style={[styles.chipText, form.subs.includes(s) && styles.chipTextSel]}>{s}</Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.label}>学習時間（分）</Text>
            <TextInput
              style={styles.input}
              keyboardType="number-pad"
              value={form.minutes}
              onChangeText={(v) => setForm((prev) => ({ ...prev, minutes: v }))}
            />

            <Text style={styles.label}>メモ</Text>
            <TextInput
              style={[styles.input, styles.memoInput]}
              multiline
              value={form.memo}
              onChangeText={(v) => setForm((prev) => ({ ...prev, memo: v }))}
            />

            <View style={styles.rowBtn}>
              {editingId !== null ? (
                <Pressable style={styles.cancelBtn} onPress={startNew}>
                  <Text style={styles.cancelText}>新規追加に戻る</Text>
                </Pressable>
              ) : (
                <Pressable style={styles.cancelBtn} onPress={onCancel}>
                  <Text style={styles.cancelText}>閉じる</Text>
                </Pressable>
              )}
              <Pressable style={styles.confirmBtn} onPress={save}>
                <Text style={styles.confirmText}>{editingId !== null ? '更新する' : '追加する'}</Text>
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.white, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, padding: spacing.lg, maxHeight: '88%' },
  title: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
  dateNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.lg, marginTop: spacing.sm },
  dateNavBtn: { width: 28, height: 28, borderRadius: 14, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  dateNavLabel: { fontSize: 13, fontWeight: '600', color: colors.textPrimary, width: 130, textAlign: 'center' },
  label: { fontSize: 12, color: colors.textSecondary, marginTop: spacing.md, marginBottom: spacing.xs },
  entryList: { backgroundColor: colors.background, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border },
  entryRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.sm },
  entryRowBordered: { borderTopWidth: 1, borderTopColor: colors.border },
  entryRowActive: { backgroundColor: 'rgba(232,130,95,0.1)' },
  entryText: { flex: 1, fontSize: 12, color: colors.textPrimary },
  entryMin: { fontSize: 12, color: colors.textSecondary, fontWeight: '600' },
  entryDelete: { padding: 2 },
  formTitle: { fontSize: 13, fontWeight: '700', color: colors.textPrimary, marginTop: spacing.lg },
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
  rowBtn: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg, marginBottom: spacing.md },
  cancelBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.md, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border },
  cancelText: { color: colors.textPrimary, fontWeight: '600' },
  confirmBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.md, borderRadius: radius.pill, backgroundColor: colors.coral },
  confirmText: { color: colors.white, fontWeight: '700' },
});
