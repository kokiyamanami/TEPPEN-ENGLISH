import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { TopBar } from '../src/components/TopBar';
import { DAILY_MISSIONS } from '../src/data/dailyMissions';
import { colors, radius, spacing } from '../src/theme/colors';

// screen key: output
export default function OutputScreen() {
  return (
    <ScrollView style={styles.screen}>
      <TopBar title="Dailyミッション" backRoute="/speaking_hub" />
      <View style={styles.list}>
        <MissionCard
          icon="image-outline"
          title={DAILY_MISSIONS.photo.label}
          sub="写真を見て、状況を英語で説明する"
          onPress={() => router.push({ pathname: '/daily_task', params: { type: 'photo', origin: 'output' } } as never)}
        />
        <MissionCard
          icon="mic-outline"
          title={DAILY_MISSIONS.question.label}
          sub="質問に対して自分の考えを英語で話す"
          onPress={() => router.push({ pathname: '/daily_task', params: { type: 'question', origin: 'output' } } as never)}
        />
      </View>
    </ScrollView>
  );
}

function MissionCard({
  icon,
  title,
  sub,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  sub: string;
  onPress: () => void;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.iconWrap}>
        <Ionicons name={icon} size={20} color={colors.navy} />
      </View>
      <View style={styles.body}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.sub}>{sub}</Text>
      </View>
      <Pressable style={styles.cta} onPress={onPress}>
        <Text style={styles.ctaText}>受ける</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  list: { padding: spacing.lg, gap: spacing.md },
  card: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.white, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.md },
  iconWrap: { width: 40, height: 40, borderRadius: radius.sm, backgroundColor: 'rgba(232,130,95,0.15)', alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1 },
  title: { fontWeight: '700', color: colors.textPrimary, fontSize: 14 },
  sub: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  cta: { backgroundColor: colors.coral, borderRadius: radius.pill, paddingVertical: spacing.xs, paddingHorizontal: spacing.md },
  ctaText: { color: colors.white, fontSize: 12, fontWeight: '700' },
});
