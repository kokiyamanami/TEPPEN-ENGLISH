import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { HubRow } from '../src/components/HubRow';
import { SpeechTimeWidget } from '../src/components/SpeechTimeWidget';
import { TopBar } from '../src/components/TopBar';
import { colors, spacing } from '../src/theme/colors';

// screen key: input_hub
export default function InputHubScreen() {
  return (
    <ScrollView style={styles.screen}>
      <TopBar title="トレーニング" backRoute="/(tabs)/home" />
      <View style={styles.widgetWrap}>
        <SpeechTimeWidget doneMin={16} goalMin={30} />
      </View>

      <Text style={styles.sectionTitle}>メニュー</Text>
      <View style={styles.card}>
        <HubRow icon="school-outline" title="初級文法トレーニング" badge="UNIT 10・DAY 2/5" onPress={() => router.push('/unitmap')} />
        <HubRow
          icon="people-outline"
          title="シチュエーション別課題"
          badge="本日あと1回生成可"
          onPress={() => router.push('/situational')}
          bordered
        />
        <HubRow icon="shuffle-outline" title="フリー練習" badge="お題自由・回数制限なし" onPress={() => router.push('/freetraining')} bordered />
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
