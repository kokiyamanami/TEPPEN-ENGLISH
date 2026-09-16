import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { ScreenHeader } from '../src/components/ScreenHeader';
import { ASCENT_MILESTONES, MOCK_TOTAL_STUDY_MINUTES, getCurrentAltitudeM } from '../src/data/mockHome';
import { colors, radius, spacing } from '../src/theme/colors';

// screen key: ascent_climb
// TODO(Phase2): SVGの稜線・点線ルート・脈動マーカー描画（react-native-svg）
export default function AscentClimbScreen() {
  const altitudeM = getCurrentAltitudeM(MOCK_TOTAL_STUDY_MINUTES);

  return (
    <ScrollView style={styles.screen}>
      <ScreenHeader title="登頂ルート" subtitle={`現在の標高: ${altitudeM}M`} />
      <View style={styles.list}>
        {ASCENT_MILESTONES.map((m) => {
          const achieved = altitudeM >= m.altitudeM;
          return (
            <View key={m.order} style={[styles.row, achieved && styles.rowAchieved]}>
              <Text style={[styles.rowOrder, achieved && styles.rowTextAchieved]}>{m.order}</Text>
              <Text style={[styles.rowName, achieved && styles.rowTextAchieved]}>{m.name}</Text>
              <Text style={[styles.rowAltitude, achieved && styles.rowTextAchieved]}>{m.altitudeM}M</Text>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  list: { paddingHorizontal: spacing.lg, gap: spacing.sm, paddingBottom: spacing.xl },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.md,
  },
  rowAchieved: { backgroundColor: colors.navy, borderColor: colors.navy },
  rowOrder: { color: colors.textSecondary, width: 20 },
  rowName: { color: colors.textPrimary, flex: 1, fontWeight: '600' },
  rowAltitude: { color: colors.textSecondary },
  rowTextAchieved: { color: colors.white },
});
