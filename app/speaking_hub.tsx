import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { HubRow } from '../src/components/HubRow';
import { TodayTimeWidget } from '../src/components/TodayTimeWidget';
import { TopBar } from '../src/components/TopBar';
import { colors, spacing } from '../src/theme/colors';

// screen key: speaking_hub
export default function SpeakingHubScreen() {
  return (
    <ScrollView style={styles.screen}>
      <TopBar title="ミッション" backRoute="/(tabs)/home" />
      <View style={styles.widgetWrap}>
        <TodayTimeWidget />
      </View>

      <Text style={styles.sectionTitle}>メニュー</Text>
      <View style={styles.card}>
        <HubRow icon="mic-outline" title="Dailyミッション" badge="DAY89・未実施" onPress={() => router.push('/output')} />
        <HubRow icon="book-outline" title="Weeklyミッション" badge="未実施 1件" onPress={() => router.push('/weekly_material')} bordered />
        <HubRow icon="flag-outline" title="Monthlyミッション" badge="MYピッチ・残り6日" onPress={() => router.push('/mission')} bordered />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  widgetWrap: { marginTop: spacing.lg },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: colors.textPrimary, marginHorizontal: spacing.lg, marginTop: spacing.xl, marginBottom: spacing.sm },
  card: {
    marginHorizontal: spacing.lg,
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.xl,
  },
});
