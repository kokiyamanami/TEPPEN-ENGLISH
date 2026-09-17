import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { TopBar } from '../src/components/TopBar';
import { youtubeThumbnail } from '../src/data/lectures';
import { useLectures } from '../src/store/LectureContext';
import { colors, radius, spacing } from '../src/theme/colors';

// screen key: lecture_list
export default function LectureListScreen() {
  const { lectures, loading, watchedIds } = useLectures();

  if (loading) {
    return (
      <View style={styles.screen}>
        <TopBar title="動画" backRoute="/(tabs)/home" />
        <ActivityIndicator style={{ marginTop: spacing.xl }} color={colors.navy} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen}>
      <TopBar title="動画" backRoute="/(tabs)/home" />
      <View style={styles.card}>
        {lectures.map((l, i) => {
          const watched = watchedIds.has(l.id);
          return (
            <Pressable
              key={l.id}
              style={[styles.row, i > 0 && styles.rowBordered]}
              onPress={() => router.push({ pathname: '/lecture_player', params: { id: l.id } } as never)}
            >
              <View style={styles.thumbWrap}>
                <Image source={{ uri: youtubeThumbnail(l.youtubeId) }} style={styles.thumb} />
                {watched && (
                  <View style={styles.watchedBadge}>
                    <Ionicons name="checkmark" size={10} color={colors.white} />
                  </View>
                )}
              </View>
              <View style={styles.body}>
                <Text style={styles.title} numberOfLines={2}>
                  {l.title}
                </Text>
                <Text style={styles.sub}>{l.instructor}</Text>
              </View>
              <Text style={styles.tag}>{l.category}</Text>
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  card: { margin: spacing.lg, backgroundColor: colors.white, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md },
  rowBordered: { borderTopWidth: 1, borderTopColor: colors.border },
  thumbWrap: { width: 72, height: 56 },
  thumb: { width: 72, height: 56, borderRadius: radius.sm, backgroundColor: colors.border },
  watchedBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.white,
  },
  body: { flex: 1 },
  title: { fontSize: 13, fontWeight: '600', color: colors.textPrimary },
  sub: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  tag: { fontSize: 10, color: colors.textSecondary, backgroundColor: colors.background, paddingHorizontal: spacing.xs, paddingVertical: 2, borderRadius: radius.sm, overflow: 'hidden' },
});
