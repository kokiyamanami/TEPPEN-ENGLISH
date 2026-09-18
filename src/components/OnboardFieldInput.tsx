import Slider from '@react-native-community/slider';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { OnboardField } from '../data/onboarding';
import { Profile, useProfile } from '../store/ProfileContext';
import { colors, radius, spacing } from '../theme/colors';

export function OnboardFieldInput({ field }: { field: OnboardField }) {
  const { profile, setField } = useProfile();
  const value = profile[field.field];

  if (field.type === 'chips') {
    return (
      <View style={styles.fieldBlock}>
        <Text style={styles.label}>{field.label}</Text>
        <View style={styles.chipRow}>
          {field.options?.map((option) => {
            const selected = value === option;
            return (
              <Pressable
                key={option}
                style={[styles.chip, selected && styles.chipSelected]}
                onPress={() => setField(field.field, option as Profile[typeof field.field])}
              >
                <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{option}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    );
  }

  if (field.type === 'slider') {
    const numValue = Number(value) || field.min || 20;
    return (
      <View style={styles.fieldBlock}>
        <View style={styles.sliderHeader}>
          <Text style={styles.label}>{field.label}</Text>
          <Text style={styles.sliderValue}>{numValue}歳</Text>
        </View>
        <Slider
          minimumValue={field.min ?? 18}
          maximumValue={field.max ?? 70}
          step={1}
          value={numValue}
          onValueChange={(v) => setField(field.field, String(Math.round(v)) as Profile[typeof field.field])}
          minimumTrackTintColor={colors.coral}
          maximumTrackTintColor={colors.border}
          thumbTintColor={colors.coral}
        />
        <View style={styles.sliderRangeRow}>
          <Text style={styles.sliderRangeText}>{field.min ?? 18}歳</Text>
          <Text style={styles.sliderRangeText}>{field.max ?? 70}歳</Text>
        </View>
      </View>
    );
  }

  if (field.type === 'multi') {
    return <MultiSelectField field={field} />;
  }

  if (field.type === 'textarea') {
    const strValue = value as string;
    return (
      <View style={styles.fieldBlock}>
        <View style={styles.sliderHeader}>
          <Text style={styles.label}>{field.label}</Text>
          {field.maxLength ? (
            <Text style={styles.counter}>
              {strValue.length} / {field.maxLength}
            </Text>
          ) : null}
        </View>
        <TextInput
          style={[styles.box, styles.textarea]}
          multiline
          numberOfLines={5}
          value={strValue}
          placeholder={field.placeholder}
          placeholderTextColor={colors.textSecondary}
          maxLength={field.maxLength}
          onChangeText={(text) => setField(field.field, text as Profile[typeof field.field])}
        />
      </View>
    );
  }

  return (
    <View style={styles.fieldBlock}>
      <Text style={styles.label}>{field.label}</Text>
      <TextInput
        style={styles.box}
        value={value as string}
        placeholder={field.placeholder}
        placeholderTextColor={colors.textSecondary}
        maxLength={field.maxLength}
        onChangeText={(text) => setField(field.field, text as Profile[typeof field.field])}
      />
    </View>
  );
}

// 職業・職位・趣味: プリセットからの複数選択＋自由入力（複数追加）に対応
function MultiSelectField({ field }: { field: OnboardField }) {
  const { profile, setField } = useProfile();
  const values = (profile[field.field] as string[]) ?? [];
  const [draft, setDraft] = useState('');

  const toggleOption = (option: string) => {
    if (field.single) {
      setField(field.field, (values.includes(option) ? [] : [option]) as Profile[typeof field.field]);
      return;
    }
    const next = values.includes(option) ? values.filter((v) => v !== option) : [...values, option];
    setField(field.field, next as Profile[typeof field.field]);
  };

  const removeValue = (v: string) => {
    setField(field.field, values.filter((x) => x !== v) as Profile[typeof field.field]);
  };

  const addCustom = () => {
    const trimmed = draft.trim();
    if (!trimmed || values.includes(trimmed)) {
      setDraft('');
      return;
    }
    setField(field.field, (field.single ? [trimmed] : [...values, trimmed]) as Profile[typeof field.field]);
    setDraft('');
  };

  const customValues = values.filter((v) => !field.options?.includes(v));

  return (
    <View style={styles.fieldBlock}>
      <View style={styles.multiHeader}>
        <Text style={styles.multiLabel}>{field.label}</Text>
        <Text style={styles.multiHint}>{field.single ? '1つ選択' : '複数選択可'}</Text>
      </View>
      <View style={styles.chipRow}>
        {field.options?.map((option) => {
          const selected = values.includes(option);
          return (
            <Pressable key={option} style={[styles.chip, selected && styles.chipSelected]} onPress={() => toggleOption(option)}>
              <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{option}</Text>
            </Pressable>
          );
        })}
        {customValues.map((v) => (
          <Pressable key={v} style={[styles.chip, styles.chipSelected]} onPress={() => removeValue(v)}>
            <Text style={[styles.chipText, styles.chipTextSelected]}>{v} ×</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.addRow}>
        <TextInput
          style={[styles.box, styles.addInput]}
          placeholder={field.placeholder ?? 'その他（自由入力）を追加'}
          placeholderTextColor={colors.textSecondary}
          value={draft}
          onChangeText={setDraft}
          onSubmitEditing={addCustom}
          returnKeyType="done"
        />
        <Pressable style={styles.addBtn} onPress={addCustom}>
          <Text style={styles.addBtnText}>追加</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fieldBlock: { paddingHorizontal: spacing.lg, marginTop: spacing.md },
  label: { fontSize: 13, color: colors.textSecondary, marginBottom: spacing.xs },
  box: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 15,
    color: colors.textPrimary,
  },
  textarea: { minHeight: 132, textAlignVertical: 'top' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.white,
  },
  chipSelected: { backgroundColor: colors.navy, borderColor: colors.navy },
  chipText: { color: colors.textPrimary, fontSize: 13 },
  chipTextSelected: { color: colors.white },
  multiHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: spacing.xs },
  multiLabel: { fontSize: 13, color: colors.textSecondary },
  multiHint: { fontSize: 11, color: colors.textSecondary },
  sliderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sliderValue: { fontSize: 15, fontWeight: '700', color: colors.textPrimary },
  sliderRangeRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: -spacing.xs },
  sliderRangeText: { fontSize: 11, color: colors.textSecondary },
  counter: { fontSize: 11, color: colors.textSecondary },
  addRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  addInput: { flex: 1 },
  addBtn: { backgroundColor: colors.coral, borderRadius: radius.sm, paddingHorizontal: spacing.md, alignItems: 'center', justifyContent: 'center' },
  addBtnText: { color: colors.white, fontWeight: '700', fontSize: 13 },
});
