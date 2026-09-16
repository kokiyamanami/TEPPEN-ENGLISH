import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { OnboardField } from '../data/onboarding';
import { useProfile } from '../store/ProfileContext';
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
                onPress={() => setField(field.field, option)}
              >
                <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{option}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    );
  }

  if (field.type === 'textarea') {
    return (
      <View style={styles.fieldBlock}>
        <Text style={styles.label}>{field.label}</Text>
        <TextInput
          style={[styles.box, styles.textarea]}
          multiline
          numberOfLines={3}
          value={value}
          onChangeText={(text) => setField(field.field, text)}
        />
      </View>
    );
  }

  return (
    <View style={styles.fieldBlock}>
      <Text style={styles.label}>{field.label}</Text>
      <TextInput style={styles.box} value={value} onChangeText={(text) => setField(field.field, text)} />
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
  textarea: { minHeight: 72, textAlignVertical: 'top' },
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
});
