import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { TopBar } from '../src/components/TopBar';
import { groupMembers, personalDailyStats } from '../src/data/records';
import { useProfile } from '../src/store/ProfileContext';
import { colors, radius, spacing } from '../src/theme/colors';
import { formatMin } from '../src/utils/dateHelpers';

// screen key: group_members
export default function GroupMembersScreen() {
  const { profile } = useProfile();
  const myWeekStudy = personalDailyStats.slice(-7).reduce((a, x) => a + x.studyMin, 0);
  const myWeekSpeak = personalDailyStats.slice(-7).reduce((a, x) => a + x.speakMin, 0);
  const myName = profile.name || 'あなた';

  return (
    <ScrollView style={styles.screen}>
      <TopBar title="グループのメンバー" backRoute="/(tabs)/records" />
      <View style={styles.card}>
        <View style={[styles.row, styles.rowMe]}>
          <View style={[styles.avatar, { backgroundColor: colors.navy }]}>
            <Text style={styles.avatarText}>{myName.charAt(0)}</Text>
          </View>
          <View style={styles.body}>
            <Text style={styles.name}>
              {myName}
              <Text style={styles.youTag}> あなた</Text>
            </Text>
            <Text style={styles.sub}>
              今週 学習{formatMin(myWeekStudy)}・発話{formatMin(myWeekSpeak)}
            </Text>
          </View>
        </View>
        {groupMembers.map((m) => (
          <Pressable key={m.id} style={styles.row} onPress={() => router.push({ pathname: '/member_detail', params: { id: m.id } } as never)}>
            <View style={[styles.avatar, { backgroundColor: colors.navyLight }]}>
              <Text style={styles.avatarText}>{m.name.charAt(0)}</Text>
            </View>
            <View style={styles.body}>
              <Text style={styles.name}>{m.name}</Text>
              <Text style={styles.sub}>
                今週 学習{formatMin(m.weeklyStudyMin)}・発話{formatMin(m.weeklySpeakMin)}
              </Text>
            </View>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  card: { margin: spacing.lg, backgroundColor: colors.white, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md, borderTopWidth: 1, borderTopColor: colors.border },
  rowMe: { borderTopWidth: 0 },
  avatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: colors.white, fontWeight: '700' },
  body: { flex: 1 },
  name: { fontSize: 13, fontWeight: '600', color: colors.textPrimary },
  youTag: { fontSize: 10, color: colors.coral, fontWeight: '700' },
  sub: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
});
