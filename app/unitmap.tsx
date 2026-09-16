import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { TopBar } from '../src/components/TopBar';
import { UNIT_MAP } from '../src/data/unitmap';
import { colors, radius, spacing } from '../src/theme/colors';

// screen key: unitmap
export default function UnitMapScreen() {
  return (
    <ScrollView style={styles.screen}>
      <TopBar title="ユニットマップ" backRoute="/input_hub" />
      <View style={styles.list}>
        {UNIT_MAP.map((u) => {
          const isCurrent = u.status === 'current';
          const isDone = u.status === 'done';
          const isLocked = u.status === 'locked';
          return (
            <Pressable
              key={u.unit}
              style={[styles.node, isCurrent && styles.nodeCurrent]}
              disabled={isLocked}
              onPress={() => router.push('/unitdrill')}
            >
              <View style={[styles.badge, isDone && styles.badgeDone, isCurrent && styles.badgeCurrent, isLocked && styles.badgeLocked]}>
                {isLocked ? (
                  <Ionicons name="lock-closed" size={16} color={colors.textSecondary} />
                ) : isDone ? (
                  <Ionicons name="checkmark" size={18} color={colors.white} />
                ) : (
                  <Text style={styles.badgeNum}>{u.unit}</Text>
                )}
              </View>
              <View style={styles.body}>
                <Text style={styles.unitLabel}>UNIT {u.unit}</Text>
                <Text style={styles.altitudeLabel}>{u.altitudeM.toLocaleString()}M</Text>
                {u.progress ? <Text style={styles.progressLabel}>{u.progress}</Text> : null}
              </View>
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  list: { padding: spacing.lg, gap: spacing.md },
  node: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.white,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  nodeCurrent: { borderColor: colors.coral, borderWidth: 2 },
  badge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.border,
  },
  badgeDone: { backgroundColor: colors.success },
  badgeCurrent: { backgroundColor: colors.coral },
  badgeLocked: { backgroundColor: colors.background },
  badgeNum: { color: colors.white, fontWeight: '700' },
  body: { flex: 1 },
  unitLabel: { fontWeight: '700', color: colors.textPrimary },
  altitudeLabel: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  progressLabel: { fontSize: 11, color: colors.coral, marginTop: spacing.xs, fontWeight: '600' },
});
