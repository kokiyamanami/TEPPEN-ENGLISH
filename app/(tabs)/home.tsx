import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AdBanner } from '../../src/components/AdBanner';
import { RidgeMini } from '../../src/components/RidgeMini';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import {
  MOCK_TOTAL_STUDY_MINUTES,
  getCurrentAltitudeM,
  getNextMilestone,
} from '../../src/data/mockHome';
import { colors, radius, spacing } from '../../src/theme/colors';

const TILES: { key: string; label: string; icon: keyof typeof Ionicons.glyphMap; route: string }[] = [
  { key: 'training', label: 'トレーニング', icon: 'book-outline', route: '/input_hub' },
  { key: 'mission', label: 'ミッション', icon: 'flag-outline', route: '/speaking_hub' },
  { key: 'video', label: '動画', icon: 'play-circle-outline', route: '/lecture_list' },
  { key: 'phrase', label: 'MYフレーズ', icon: 'bookmark-outline', route: '/phrase' },
];

export default function HomeScreen() {
  const altitudeM = getCurrentAltitudeM(MOCK_TOTAL_STUDY_MINUTES);
  const next = getNextMilestone(altitudeM);
  const remainingM = next ? next.altitudeM - altitudeM : 0;
  const remainingMinutes = remainingM * 60;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <ScreenHeader title="トレーニング" subtitle="今日も一歩、頂上に近づこう" />

      <Pressable style={styles.altitudeCard} onPress={() => router.push('/ascent_climb')}>
        <View style={styles.ridgeBg} pointerEvents="none">
          <RidgeMini />
        </View>
        <Text style={styles.altitudeLabel}>現在の標高</Text>
        <Text style={styles.altitudeValue}>{altitudeM}M</Text>
        {next ? (
          <Text style={styles.altitudeNext}>
            次は「{next.name}」（{next.altitudeM}M）まであと {remainingMinutes}分
          </Text>
        ) : (
          <Text style={styles.altitudeNext}>全マイルストーン達成！</Text>
        )}
      </Pressable>

      <View style={styles.grid}>
        {TILES.map((tile) => (
          <Pressable key={tile.key} style={styles.tile} onPress={() => router.push(tile.route as never)}>
            <Ionicons name={tile.icon} size={28} color={colors.navy} />
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
    overflow: 'hidden',
  },
  ridgeBg: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '70%' },
  altitudeLabel: { color: colors.coralLight, fontSize: 12 },
  altitudeValue: { color: colors.white, fontSize: 36, fontWeight: '700', marginTop: spacing.xs },
  altitudeNext: { color: colors.white, fontSize: 12, marginTop: spacing.sm, opacity: 0.85 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.lg,
    marginTop: spacing.lg,
    gap: spacing.md,
  },
  tile: {
    width: '47%',
    aspectRatio: 1.3,
    backgroundColor: colors.white,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  tileLabel: { color: colors.textPrimary, fontWeight: '600' },
});
