import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { TopBar } from '../src/components/TopBar';
import { situationalHistory } from '../src/data/situational';
import { colors, radius, spacing } from '../src/theme/colors';

// screen key: situational_history_full
export default function SituationalHistoryFullScreen() {
  return (
    <ScrollView style={styles.screen}>
      <TopBar title="過去に生成した教材（全て）" backRoute="/situational" />
      <View style={styles.card}>
        {situationalHistory.map((h, i) => (
          <Pressable
            key={i}
            style={[styles.row, i > 0 && styles.rowBordered]}
            onPress={() => router.push(h.scene ? ({ pathname: `/${h.nav}`, params: { scene: h.scene } } as never) : (`/${h.nav}` as never))}
          >
            <View style={styles.left}>
              <Text style={styles.scene}>{h.scene}</Text>
              <Text style={styles.tag}>{h.type}</Text>
            </View>
            <Text style={styles.date}>{h.date}</Text>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  card: { margin: spacing.lg, backgroundColor: colors.white, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.md },
  rowBordered: { borderTopWidth: 1, borderTopColor: colors.border },
  left: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  scene: { fontWeight: '600', color: colors.textPrimary, fontSize: 13 },
  tag: { fontSize: 10, color: colors.textSecondary, backgroundColor: colors.background, paddingHorizontal: spacing.xs, borderRadius: radius.sm, overflow: 'hidden' },
  date: { fontSize: 12, color: colors.textSecondary },
});
