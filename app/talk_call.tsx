import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { TalkAvatar } from '../src/components/TalkAvatar';
import { formatCallTime } from '../src/hooks/useRecordFlow';
import { useTalk } from '../src/store/TalkContext';
import { colors, spacing } from '../src/theme/colors';

// screen key: talk_call
// TODO(Phase10): WebRTCによる実通話に置き換え。現状はタイマーのみのモック
export default function TalkCallScreen() {
  const { key } = useLocalSearchParams<{ key: string }>();
  const { threads } = useTalk();
  const thread = threads[key ?? ''];
  const [seconds, setSeconds] = useState(0);
  const [connected, setConnected] = useState(false);
  const [muted, setMuted] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const connectTimeout = setTimeout(() => {
      setConnected(true);
      timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    }, 1200);
    return () => {
      clearTimeout(connectTimeout);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  if (!thread) {
    return (
      <View style={styles.screen}>
        <Text style={styles.empty}>トークが見つかりません</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={styles.center}>
        <TalkAvatar thread={thread} size={96} />
        <Text style={styles.name}>{thread.name}</Text>
        <Text style={styles.timer}>{connected ? formatCallTime(seconds) : '発信中…'}</Text>
      </View>

      <View style={styles.actions}>
        <View style={styles.actionCol}>
          <Pressable style={[styles.circleBtn, muted && styles.circleBtnActive]} onPress={() => setMuted((m) => !m)}>
            <Ionicons name={muted ? 'mic-off' : 'mic-off-outline'} size={22} color={muted ? colors.white : colors.textPrimary} />
          </Pressable>
          <Text style={styles.actionLabel}>ミュート</Text>
        </View>
        <View style={styles.actionCol}>
          <Pressable style={[styles.circleBtn, styles.circleBtnEnd]} onPress={() => router.back()}>
            <Ionicons name="call" size={22} color={colors.white} style={{ transform: [{ rotate: '135deg' }] }} />
          </Pressable>
          <Text style={styles.actionLabel}>終了</Text>
        </View>
        <View style={styles.actionCol}>
          <Pressable style={styles.circleBtn}>
            <Ionicons name="volume-high-outline" size={22} color={colors.textPrimary} />
          </Pressable>
          <Text style={styles.actionLabel}>スピーカー</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.navy, justifyContent: 'space-between', paddingVertical: spacing.xl * 2 },
  center: { alignItems: 'center', marginTop: spacing.xl },
  name: { color: colors.white, fontSize: 20, fontWeight: '700', marginTop: spacing.lg },
  timer: { color: colors.coralLight, fontSize: 14, marginTop: spacing.sm },
  actions: { flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: spacing.xl },
  actionCol: { alignItems: 'center', gap: spacing.sm },
  circleBtn: { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  circleBtnActive: { backgroundColor: colors.coral },
  circleBtnEnd: { backgroundColor: colors.danger },
  actionLabel: { color: colors.white, fontSize: 11 },
  empty: { textAlign: 'center', marginTop: spacing.xl, color: colors.white },
});
