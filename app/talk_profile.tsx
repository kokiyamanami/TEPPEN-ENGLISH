import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { TalkAvatar } from '../src/components/TalkAvatar';
import { TopBar } from '../src/components/TopBar';
import { KIND_LABEL } from '../src/data/talk';
import { useTalk } from '../src/store/TalkContext';
import { colors, radius, spacing } from '../src/theme/colors';

// screen key: talk_profile
export default function TalkProfileScreen() {
  const { key } = useLocalSearchParams<{ key: string }>();
  const { threads } = useTalk();
  const thread = threads[key ?? ''];

  if (!thread) {
    return (
      <View style={styles.screen}>
        <TopBar title="プロフィール" backRoute="/(tabs)/talk_list" />
        <Text style={styles.empty}>トークが見つかりません</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <TopBar title="プロフィール" backRoute="/(tabs)/talk_list" />

      <View style={styles.head}>
        <TalkAvatar thread={thread} size={76} />
        <Text style={styles.name}>{thread.name}</Text>
        <Text style={styles.kind}>{KIND_LABEL[thread.kind](thread.key)}</Text>
      </View>

      <View style={styles.bioCard}>
        <Text style={styles.bioText}>{thread.bio}</Text>
      </View>

      {thread.callable && (
        <Pressable style={styles.callBtn} onPress={() => router.push({ pathname: '/talk_call', params: { key: thread.key } } as never)}>
          <Ionicons name="call" size={16} color={colors.white} />
          <Text style={styles.callBtnText}>電話する</Text>
        </Pressable>
      )}

      {thread.kind !== 'official' && (
        <Pressable style={styles.msgBtn} onPress={() => router.push({ pathname: '/talk_thread', params: { key: thread.key } } as never)}>
          <Text style={styles.msgBtnText}>メッセージを送る</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  head: { alignItems: 'center', paddingVertical: spacing.xl },
  name: { fontSize: 17, fontWeight: '700', color: colors.textPrimary, marginTop: spacing.md },
  kind: { fontSize: 12, color: colors.textSecondary, marginTop: spacing.xs },
  bioCard: { marginHorizontal: spacing.lg, backgroundColor: colors.white, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.md },
  bioText: { fontSize: 12, color: colors.textPrimary, lineHeight: 19 },
  callBtn: { flexDirection: 'row', gap: spacing.xs, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.coral, borderRadius: radius.pill, marginHorizontal: spacing.lg, marginTop: spacing.lg, paddingVertical: spacing.md },
  callBtnText: { color: colors.white, fontWeight: '700' },
  msgBtn: { alignItems: 'center', justifyContent: 'center', borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, marginHorizontal: spacing.lg, marginTop: spacing.md, paddingVertical: spacing.md },
  msgBtnText: { color: colors.textPrimary, fontWeight: '600' },
  empty: { textAlign: 'center', marginTop: spacing.xl, color: colors.textSecondary },
});
