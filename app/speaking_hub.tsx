import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { apiGet } from '../src/api/mobileAuth';
import { HubRow } from '../src/components/HubRow';
import { TodayTimeWidget } from '../src/components/TodayTimeWidget';
import { TopBar } from '../src/components/TopBar';
import { WEEKLY_STEPS } from '../src/data/weekly';
import { colors, spacing } from '../src/theme/colors';
import { dateKey } from '../src/utils/dateHelpers';

// screen key: speaking_hub
type MissionHistory = { daily: { date: string; type: string; pass: number }[]; weekly: { week_start: string; date: string }[]; monthly: { month: string }[] };

// 各ミッションの今の状況（実データ）を、メニューのバッジ表示にする
function useMissionBadges() {
  const [badges, setBadges] = useState<{ daily?: string; weekly?: string; monthly?: string }>({});
  useFocusEffect(
    useCallback(() => {
      const now = new Date();
      const today = dateKey(now);
      Promise.all([apiGet<MissionHistory>('/mission-history'), apiGet<{ weekStart: string; completedStep: number }>('/weekly-progress')])
        .then(([h, w]) => {
          const doneToday = new Set(h.daily.filter((d) => d.date === today).map((d) => d.type)).size;
          const weeklyDone = h.weekly.some((x) => x.week_start === w.weekStart);
          const monthlyDone = h.monthly.some((x) => x.month === today.slice(0, 7));
          const daysLeft = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate() - now.getDate();
          setBadges({
            daily: doneToday >= 2 ? '今日は実施済み' : `今日 ${doneToday}/2 実施`,
            weekly: weeklyDone ? '今週は実施済み' : `STEP ${Math.min(w.completedStep, WEEKLY_STEPS.length)}/${WEEKLY_STEPS.length} 完了`,
            monthly: monthlyDone ? '今月は実施済み' : `MYピッチ・残り${daysLeft}日`,
          });
        })
        .catch(() => {});
    }, [])
  );
  return badges;
}

export default function SpeakingHubScreen() {
  const badges = useMissionBadges();
  return (
    <ScrollView style={styles.screen}>
      <TopBar title="ミッション" backRoute="/(tabs)/home" />
      <View style={styles.widgetWrap}>
        <TodayTimeWidget />
      </View>

      <Text style={styles.sectionTitle}>メニュー</Text>
      <View style={styles.card}>
        <HubRow icon="mic-outline" title="Dailyミッション" badge={badges.daily} onPress={() => router.push('/output')} />
        <HubRow icon="book-outline" title="Weeklyミッション" badge={badges.weekly} onPress={() => router.push('/weekly_material')} bordered />
        <HubRow icon="flag-outline" title="Monthlyミッション" badge={badges.monthly} onPress={() => router.push('/mission')} bordered />
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
