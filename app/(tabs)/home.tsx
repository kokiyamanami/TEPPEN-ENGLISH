import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AdBanner } from '../../src/components/AdBanner';
import { RidgeMini } from '../../src/components/RidgeMini';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { ASCENT_MILESTONES } from '../../src/data/mockHome';
import { useStats } from '../../src/store/StatsContext';
import { colors, radius, spacing } from '../../src/theme/colors';

const TILES: { key: string; label: string; icon: keyof typeof Ionicons.glyphMap; route: string }[] = [
  { key: 'training', label: 'トレーニング', icon: 'book-outline', route: '/input_hub' },
  { key: 'mission', label: 'ミッション', icon: 'flag-outline', route: '/speaking_hub' },
  { key: 'video', label: '動画', icon: 'play-circle-outline', route: '/lecture_list' },
  { key: 'phrase', label: 'MYフレーズ', icon: 'bookmark-outline', route: '/phrase' },
];

function formatRemain(min: number) {
  if (min < 120) return `${Math.max(1, Math.ceil(min))}分`;
  return `約${Math.round(min / 60).toLocaleString()}時間`;
}

export default function HomeScreen() {
  const { totalStudyMinutes } = useStats();
  const altitude = totalStudyMinutes / 60;
  const next = ASCENT_MILESTONES.find((m) => m.altitudeM > altitude) ?? null;
  const prev = [...ASCENT_MILESTONES].reverse().find((m) => m.altitudeM <= altitude) ?? null;
  const prevAlt = prev?.altitudeM ?? 0;
  const legProgress = next ? Math.min(1, Math.max(0, (altitude - prevAlt) / (next.altitudeM - prevAlt))) : 1;
  const remainingMinutes = next ? (next.altitudeM - altitude) * 60 : 0;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <ScreenHeader title="トレーニング" subtitle="今日も一歩、頂上に近づこう" />

      <Pressable style={styles.altitudeCard} onPress={() => router.push('/ascent_climb')}>
        <View style={styles.ridgeBg} pointerEvents="none">
          <RidgeMini />
        </View>
        <View style={styles.altitudeTop}>
          <Text style={styles.altitudeLabel}>現在の標高</Text>
          <View style={styles.routeLink}>
            <Text style={styles.routeLinkText}>登頂ルート</Text>
            <Ionicons name="chevron-forward" size={12} color={colors.coralLight} />
          </View>
        </View>
        <Text style={styles.altitudeValue}>
          {altitude.toFixed(1)}
          <Text style={styles.altitudeUnit}> M</Text>
        </Text>
        {next ? (
          <>
            <View style={styles.track}>
              <View style={[styles.fill, { width: `${Math.round(legProgress * 100)}%` }]} />
            </View>
            <Text style={styles.altitudeNext} numberOfLines={1}>
              次は「{next.name}」（{next.altitudeM.toLocaleString()}M）まであと {formatRemain(remainingMinutes)}
            </Text>
          </>
        ) : (
          <Text style={styles.altitudeNext}>全マイルストーン達成！</Text>
        )}
      </Pressable>

      <View style={styles.grid}>
        {TILES.map((tile) => (
          <Pressable key={tile.key} style={styles.tile} onPress={() => router.push(tile.route as never)}>
            <View style={styles.tileIcon}>
              <Ionicons name={tile.icon} size={24} color={colors.navy} />
            </View>
            <Text style={styles.tileLabel}>{tile.label}</Text>
          </Pressable>
        ))}
      </View>

      <AdBanner />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: spacing.xl },
  altitudeCard: {
    marginHorizontal: spacing.lg,
    backgroundColor: colors.navy,
    borderRadius: radius.lg,
    padding: spacing.lg,
    paddingBottom: 64,
    overflow: 'hidden',
  },
  ridgeBg: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 44 },
  altitudeTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  altitudeLabel: { color: colors.coralLight, fontSize: 12 },
  routeLink: { flexDirection: 'row', alignItems: 'center' },
  routeLinkText: { color: colors.coralLight, fontSize: 11, fontWeight: '600' },
  altitudeValue: { color: colors.white, fontSize: 40, fontWeight: '800', marginTop: 2, letterSpacing: -1 },
  altitudeUnit: { fontSize: 16, fontWeight: '700' },
  track: { height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.2)', overflow: 'hidden', marginTop: spacing.sm },
  fill: { height: '100%', borderRadius: 3, backgroundColor: '#E8825F' },
  altitudeNext: { color: colors.white, fontSize: 12, marginTop: spacing.sm, opacity: 0.9 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.lg,
    marginTop: spacing.lg,
    gap: spacing.md,
  },
  tile: {
    width: '47.5%',
    flexGrow: 1,
    height: 104,
    backgroundColor: colors.white,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    justifyContent: 'space-between',
  },
  tileIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
  tileLabel: { color: colors.textPrimary, fontWeight: '700', fontSize: 14 },
});
