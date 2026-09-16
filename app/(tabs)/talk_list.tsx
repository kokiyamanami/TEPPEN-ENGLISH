import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { TalkAvatar } from '../../src/components/TalkAvatar';
import { TALK_ORDER } from '../../src/data/talk';
import { useTalk } from '../../src/store/TalkContext';
import { colors, radius, spacing } from '../../src/theme/colors';

// screen key: talk_list
export default function TalkListScreen() {
  const { threads } = useTalk();

  return (
    <ScrollView style={styles.screen}>
      <ScreenHeader title="トーク" />

      <Pressable style={styles.promo} onPress={() => router.push('/sw_lp')}>
        <View style={styles.promoMark}>
          <Ionicons name="airplane-outline" size={20} color={colors.white} />
        </View>
        <View style={styles.promoBody}>
          <Text style={styles.promoEyebrow}>スクールウィズ</Text>
          <Text style={styles.promoTitle}>英語力UPの留学エージェント</Text>
          <Text style={styles.promoSub}>留学手数料¥0・カウンセラーに無料相談してみませんか？</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.white} />
      </Pressable>

      <View style={styles.list}>
        {TALK_ORDER.map((key) => {
          const t = threads[key];
          if (!t) return null;
          const last = t.messages[t.messages.length - 1];
          return (
            <Pressable key={key} style={styles.row} onPress={() => router.push({ pathname: '/talk_thread', params: { key } } as never)}>
              <Pressable onPress={() => router.push({ pathname: '/talk_profile', params: { key } } as never)}>
                <TalkAvatar thread={t} />
              </Pressable>
              <View style={styles.body}>
                <View style={styles.topRow}>
                  <Text style={styles.name}>{t.name}</Text>
                  <Text style={styles.time}>{last?.time}</Text>
                </View>
                <Text style={styles.preview} numberOfLines={1}>
                  {last?.from === 'me' ? 'あなた: ' : ''}
                  {last?.text}
                </Text>
              </View>
              {t.unread > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{t.unread}</Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  promo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginHorizontal: spacing.lg,
    backgroundColor: colors.navy,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  promoMark: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  promoBody: { flex: 1 },
  promoEyebrow: { color: colors.coralLight, fontSize: 10 },
  promoTitle: { color: colors.white, fontWeight: '700', fontSize: 13, marginTop: 2 },
  promoSub: { color: colors.white, fontSize: 10, marginTop: 2, opacity: 0.8 },
  list: { marginTop: spacing.md, marginBottom: spacing.xl },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  body: { flex: 1 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between' },
  name: { fontSize: 13, fontWeight: '700', color: colors.textPrimary },
  time: { fontSize: 10, color: colors.textSecondary },
  preview: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  badge: { minWidth: 18, height: 18, borderRadius: 9, backgroundColor: colors.coral, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  badgeText: { color: colors.white, fontSize: 10, fontWeight: '700' },
});
