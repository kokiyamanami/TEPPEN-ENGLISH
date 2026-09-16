import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '../theme/colors';

const SPEEDS = [0.75, 1, 1.25, 1.5];
const MOCK_DURATION_SEC = 42;

function formatTime(sec: number) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// TODO(Phase10): TTS音声の実再生に置き換え。現状は見た目上の経過時間のみ進める
export function PlayerBar() {
  const [playing, setPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [speed, setSpeed] = useState(1);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (playing) {
      timerRef.current = setInterval(() => {
        setElapsed((prev) => {
          const next = prev + speed;
          if (next >= MOCK_DURATION_SEC) {
            setPlaying(false);
            return MOCK_DURATION_SEC;
          }
          return next;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [playing, speed]);

  const seek = (delta: number) => {
    setElapsed((prev) => Math.max(0, Math.min(MOCK_DURATION_SEC, prev + delta)));
  };

  const pct = Math.min(1, elapsed / MOCK_DURATION_SEC);

  return (
    <View>
      <View style={styles.seekRow}>
        <Pressable style={styles.seekBtn} onPress={() => seek(-10)}>
          <Text style={styles.seekText}>-10s</Text>
        </Pressable>
        <Pressable style={styles.seekBtn} onPress={() => seek(-5)}>
          <Text style={styles.seekText}>-5s</Text>
        </Pressable>
        <Pressable style={styles.playBtn} onPress={() => setPlaying((p) => !p)}>
          <Ionicons name={playing ? 'pause' : 'play'} size={22} color={colors.white} />
        </Pressable>
        <Pressable style={styles.seekBtn} onPress={() => seek(5)}>
          <Text style={styles.seekText}>+5s</Text>
        </Pressable>
        <Pressable style={styles.seekBtn} onPress={() => seek(10)}>
          <Text style={styles.seekText}>+10s</Text>
        </Pressable>
      </View>

      <View style={styles.progressWrap}>
        <View style={[styles.progressFill, { width: `${pct * 100}%` }]} />
      </View>

      <View style={styles.bottomRow}>
        <Text style={styles.time}>{formatTime(elapsed)}</Text>
        <View style={styles.speedRow}>
          {SPEEDS.map((sp) => (
            <Pressable key={sp} style={[styles.speedOpt, speed === sp && styles.speedOptSel]} onPress={() => setSpeed(sp)}>
              <Text style={[styles.speedText, speed === sp && styles.speedTextSel]}>{sp}x</Text>
            </Pressable>
          ))}
        </View>
      </View>
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
});
