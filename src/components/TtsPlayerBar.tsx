import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { TtsVoice, useTtsPlayer } from '../hooks/useTtsPlayer';
import { colors, radius, spacing } from '../theme/colors';

const SPEEDS = [0.75, 1, 1.25, 1.5];

function formatTime(sec: number) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// 仕様書11.3: TTSによるお手本音声の実再生
export function TtsPlayerBar({ text, voice = 'alloy' }: { text: string; voice?: TtsVoice }) {
  const { playing, preparing, error, currentTime, duration, playbackRate, toggle, seekBy, setSpeed } = useTtsPlayer(text, voice);
  const pct = duration ? Math.min(1, currentTime / duration) : 0;

  return (
    <View>
      <View style={styles.seekRow}>
        <Pressable style={styles.seekBtn} onPress={() => seekBy(-10)}>
          <Text style={styles.seekText}>-10s</Text>
        </Pressable>
        <Pressable style={styles.seekBtn} onPress={() => seekBy(-5)}>
          <Text style={styles.seekText}>-5s</Text>
        </Pressable>
        <Pressable style={styles.playBtn} onPress={toggle} disabled={preparing}>
          {preparing ? <ActivityIndicator color={colors.white} size="small" /> : <Ionicons name={playing ? 'pause' : 'play'} size={22} color={colors.white} />}
        </Pressable>
        <Pressable style={styles.seekBtn} onPress={() => seekBy(5)}>
          <Text style={styles.seekText}>+5s</Text>
        </Pressable>
        <Pressable style={styles.seekBtn} onPress={() => seekBy(10)}>
          <Text style={styles.seekText}>+10s</Text>
        </Pressable>
      </View>

      <View style={styles.progressWrap}>
        <View style={[styles.progressFill, { width: `${pct * 100}%` }]} />
      </View>

      <View style={styles.bottomRow}>
        <Text style={styles.time}>{formatTime(currentTime)}</Text>
        <View style={styles.speedRow}>
          {SPEEDS.map((sp) => (
            <Pressable key={sp} style={[styles.speedOpt, playbackRate === sp && styles.speedOptSel]} onPress={() => setSpeed(sp)}>
              <Text style={[styles.speedText, playbackRate === sp && styles.speedTextSel]}>{sp}x</Text>
            </Pressable>
          ))}
        </View>
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  seekRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  seekBtn: { paddingVertical: spacing.xs, paddingHorizontal: spacing.sm },
  seekText: { color: colors.textSecondary, fontSize: 12, fontWeight: '600' },
  playBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.coral,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressWrap: { height: 4, backgroundColor: colors.border, borderRadius: 2, marginTop: spacing.md, overflow: 'hidden' },
  progressFill: { height: 4, backgroundColor: colors.coral },
  bottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.sm },
  time: { fontSize: 11, color: colors.textSecondary },
  speedRow: { flexDirection: 'row', gap: spacing.xs },
  speedOpt: { paddingVertical: 2, paddingHorizontal: spacing.sm, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border },
  speedOptSel: { backgroundColor: colors.navy, borderColor: colors.navy },
  speedText: { fontSize: 11, color: colors.textSecondary },
  speedTextSel: { color: colors.white },
  error: { fontSize: 10, color: colors.danger, marginTop: spacing.xs },
});
