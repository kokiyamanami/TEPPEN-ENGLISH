import { Ionicons } from '@expo/vector-icons';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '../theme/colors';

function formatTime(sec: number) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function RecordingPlayback({ uri }: { uri: string }) {
  const player = useAudioPlayer(uri);
  const status = useAudioPlayerStatus(player);

  const toggle = () => {
    if (status.playing) {
      player.pause();
    } else {
      if (status.didJustFinish || status.currentTime >= (status.duration || 0)) {
        player.seekTo(0);
      }
      player.play();
    }
  };

  const pct = status.duration ? Math.min(1, status.currentTime / status.duration) : 0;

  return (
    <View style={styles.wrap}>
      <Pressable style={styles.playBtn} onPress={toggle}>
        <Ionicons name={status.playing ? 'pause' : 'play'} size={18} color={colors.white} />
      </Pressable>
      <View style={styles.progressWrap}>
        <View style={[styles.progressFill, { width: `${pct * 100}%` }]} />
      </View>
      <Text style={styles.time}>
        {formatTime(status.currentTime)} / {formatTime(status.duration || 0)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, width: '100%' },
  playBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.coral, alignItems: 'center', justifyContent: 'center' },
  progressWrap: { flex: 1, height: 4, backgroundColor: colors.border, borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: 4, backgroundColor: colors.coral },
  time: { fontSize: 10, color: colors.textSecondary, width: 70, textAlign: 'right' },
});
