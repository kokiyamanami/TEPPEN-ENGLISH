import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { TopBar } from '../src/components/TopBar';
import { pastGroups } from '../src/data/pastGroups';
import { colors, radius, spacing } from '../src/theme/colors';

// screen key: past_groups
export default function PastGroupsScreen() {
  return (
    <ScrollView style={styles.screen}>
      <TopBar title="過去の所属グループ" backRoute="/(tabs)/mypage" />
      <View style={styles.card}>
        {pastGroups.map((g, i) => (
          <Pressable
            key={i}
            style={[styles.row, i > 0 && styles.rowBordered]}
            onPress={() => router.push({ pathname: '/past_group_members', params: { index: String(i) } } as never)}
          >
            <View style={styles.iconWrap}>
              <Ionicons name="people-outline" size={18} color={colors.navy} />
            </View>
            <View style={styles.body}>
              <Text style={styles.title}>
                {g.group}
                {g.current && <Text style={styles.youTag}> 現在</Text>}
              </Text>
              <Text style={styles.sub}>
                {g.from} 〜 {g.to}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  card: { margin: spacing.lg, backgroundColor: colors.white, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md },
  rowBordered: { borderTopWidth: 1, borderTopColor: colors.border },
  iconWrap: { width: 36, height: 36, borderRadius: radius.sm, backgroundColor: 'rgba(15,36,57,0.06)', alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1 },
  title: { fontSize: 13, fontWeight: '600', color: colors.textPrimary },
  youTag: { fontSize: 10, color: colors.coral, fontWeight: '700' },
  sub: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
});
