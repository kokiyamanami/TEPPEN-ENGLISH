import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { TopBar } from '../src/components/TopBar';
import { pastGroups } from '../src/data/pastGroups';
import { colors, radius, spacing } from '../src/theme/colors';

// screen key: past_group_members
export default function PastGroupMembersScreen() {
  const { index } = useLocalSearchParams<{ index?: string }>();
  const g = pastGroups[Number(index ?? -1)];

  if (!g) {
    return (
      <View style={styles.screen}>
        <TopBar title="グループ" backRoute="/past_groups" />
        <Text style={styles.empty}>情報が見つかりません</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen}>
      <TopBar title={`${g.group}（${g.from}〜${g.to}）`} backRoute="/past_groups" />
      <Text style={styles.sectionTitle}>当時のメンバー</Text>
      <View style={styles.card}>
        {g.members.map((name, i) => (
          <View key={i} style={[styles.row, i > 0 && styles.rowBordered]}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{name.charAt(0)}</Text>
            </View>
            <Text style={styles.name}>{name}</Text>
          </View>
        ))}
      </View>
      <View style={styles.privacyNote}>
        <Ionicons name="information-circle-outline" size={13} color={colors.textSecondary} />
        <Text style={styles.privacyText}>閲覧のみの履歴表示です</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: colors.textPrimary, marginHorizontal: spacing.lg, marginTop: spacing.lg, marginBottom: spacing.sm },
  card: { marginHorizontal: spacing.lg, backgroundColor: colors.white, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md },
  rowBordered: { borderTopWidth: 1, borderTopColor: colors.border },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.navyLight, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: colors.white, fontWeight: '700', fontSize: 13 },
  name: { fontSize: 13, color: colors.textPrimary, fontWeight: '600' },
  privacyNote: { flexDirection: 'row', alignItems: 'center', gap: 4, justifyContent: 'center', marginVertical: spacing.lg },
  privacyText: { fontSize: 11, color: colors.textSecondary },
  empty: { textAlign: 'center', marginTop: spacing.xl, color: colors.textSecondary },
});
