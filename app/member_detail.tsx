import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { TopBar } from '../src/components/TopBar';
import { groupMembers } from '../src/data/records';
import { colors, radius, spacing } from '../src/theme/colors';
import { formatMin, shortMd } from '../src/utils/dateHelpers';

// screen key: member_detail
export default function MemberDetailScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const member = groupMembers.find((m) => m.id === id);

  if (!member) {
    return (
      <View style={styles.screen}>
        <TopBar title="メンバー" backRoute="/group_members" />
        <Text style={styles.empty}>メンバーが見つかりません</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen}>
      <TopBar title={member.name} backRoute="/group_members" />

      <View style={styles.headCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{member.name.charAt(0)}</Text>
        </View>
        <View>
          <Text style={styles.name}>{member.name}</Text>
          <Text style={styles.tag}>同じグループ</Text>
        </View>
      </View>

      <View style={styles.statGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>今週の学習時間</Text>
          <Text style={styles.statValue}>{formatMin(member.weeklyStudyMin)}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>今週の発話時間</Text>
          <Text style={styles.statValue}>{formatMin(member.weeklySpeakMin)}</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>スピーキング履歴</Text>
      <View style={styles.card}>
        {member.speakingHistory.map((s, i) => (
          <View key={i} style={[styles.row, i > 0 && styles.rowBordered]}>
            <Text style={styles.rowTitle}>{s.title}</Text>
            <Text style={styles.rowDate}>{shortMd(s.date)}</Text>
          </View>
        ))}
      </View>

      <View style={styles.privacyNote}>
        <Ionicons name="information-circle-outline" size={13} color={colors.textSecondary} />
        <Text style={styles.privacyText}>閲覧のみ・コメントはできません</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  headCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, margin: spacing.lg, backgroundColor: colors.white, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.lg },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.navyLight, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: colors.white, fontWeight: '700', fontSize: 16 },
  name: { fontSize: 15, fontWeight: '700', color: colors.textPrimary },
  tag: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  statGrid: { flexDirection: 'row', gap: spacing.md, marginHorizontal: spacing.lg },
  statCard: { flex: 1, backgroundColor: colors.white, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.md },
  statLabel: { fontSize: 11, color: colors.textSecondary },
  statValue: { fontSize: 16, fontWeight: '700', color: colors.textPrimary, marginTop: spacing.xs },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: colors.textPrimary, marginHorizontal: spacing.lg, marginTop: spacing.lg, marginBottom: spacing.sm },
  card: { marginHorizontal: spacing.lg, backgroundColor: colors.white, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border },
  row: { flexDirection: 'row', justifyContent: 'space-between', padding: spacing.md },
  rowBordered: { borderTopWidth: 1, borderTopColor: colors.border },
  rowTitle: { fontSize: 12, color: colors.textPrimary },
  rowDate: { fontSize: 11, color: colors.textSecondary },
  privacyNote: { flexDirection: 'row', alignItems: 'center', gap: 4, justifyContent: 'center', marginVertical: spacing.lg },
  privacyText: { fontSize: 11, color: colors.textSecondary },
  empty: { textAlign: 'center', marginTop: spacing.xl, color: colors.textSecondary },
});
