import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { TopBar } from '../src/components/TopBar';
import { LECTURES } from '../src/data/lectures';
import { useLectures } from '../src/store/LectureContext';
import { colors, radius, spacing } from '../src/theme/colors';

// screen key: lecture_player
export default function LecturePlayerScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const lecture = LECTURES.find((l) => l.id === id);
  const { watchedIds, markWatched } = useLectures();

  if (!lecture) {
    return (
      <View style={styles.screen}>
        <TopBar title="動画" backRoute="/lecture_list" />
        <Text style={styles.empty}>動画が見つかりません</Text>
      </View>
    );
  }

  const watched = watchedIds.has(lecture.id);

  return (
    <View style={styles.screen}>
      <TopBar title="動画" backRoute="/lecture_list" />
      <View style={styles.video}>
        <WebView
          source={{ uri: `https://www.youtube.com/embed/${lecture.youtubeId}?playsinline=1` }}
          allowsFullscreenVideo
          allowsInlineMediaPlayback
          mediaPlaybackRequiresUserAction={false}
          style={styles.webview}
        />
      </View>
      <View style={styles.info}>
        <Text style={styles.tag}>{lecture.category}</Text>
        <Text style={styles.title}>{lecture.title}</Text>
        <Text style={styles.sub}>{lecture.instructor}</Text>
      </View>
      <Pressable
        style={[styles.watchBtn, watched && styles.watchBtnDone]}
        onPress={() => markWatched(lecture.id)}
        disabled={watched}
      >
        {watched && <Ionicons name="checkmark" size={16} color={colors.textPrimary} />}
        <Text style={[styles.watchBtnText, watched && styles.watchBtnTextDone]}>{watched ? '視聴済み' : '視聴済みにする'}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  video: { width: '100%', aspectRatio: 16 / 9, backgroundColor: '#000' },
  webview: { flex: 1, backgroundColor: '#000' },
  info: { padding: spacing.lg },
  tag: { fontSize: 10, color: colors.textSecondary, backgroundColor: colors.white, alignSelf: 'flex-start', paddingHorizontal: spacing.xs, paddingVertical: 2, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border },
  title: { fontSize: 16, fontWeight: '700', color: colors.textPrimary, marginTop: spacing.sm },
  sub: { fontSize: 12, color: colors.textSecondary, marginTop: 4 },
  watchBtn: { flexDirection: 'row', gap: spacing.xs, backgroundColor: colors.coral, borderRadius: radius.pill, marginHorizontal: spacing.lg, paddingVertical: spacing.md, alignItems: 'center', justifyContent: 'center' },
  watchBtnDone: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border },
  watchBtnText: { color: colors.white, fontWeight: '700' },
  watchBtnTextDone: { color: colors.textPrimary },
  empty: { textAlign: 'center', marginTop: spacing.xl, color: colors.textSecondary },
});
