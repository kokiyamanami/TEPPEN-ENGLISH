import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '../theme/colors';

export function HubRow({
  icon,
  title,
  badge,
  onPress,
  bordered,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  badge?: string;
  onPress: () => void;
  bordered?: boolean;
}) {
  return (
    <Pressable style={[styles.row, bordered && styles.rowBordered]} onPress={onPress}>
      <View style={styles.iconWrap}>
        <Ionicons name={icon} size={20} color={colors.navy} />
      </View>
      <View style={styles.body}>
        <Text style={styles.title}>{title}</Text>
        {badge ? <Text style={styles.badge}>{badge}</Text> : null}
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md },
  rowBordered: { borderTopWidth: 1, borderTopColor: colors.border },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: 'rgba(15,36,57,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1 },
  title: { fontWeight: '600', color: colors.textPrimary, fontSize: 14 },
  badge: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
});
