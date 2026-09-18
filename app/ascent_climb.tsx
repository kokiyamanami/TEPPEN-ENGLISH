import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { BACKEND_URL } from '../src/config/api';
import { ASCENT_MILESTONES, Milestone } from '../src/data/mockHome';
import { useProfile } from '../src/store/ProfileContext';
import { useStats } from '../src/store/StatsContext';
import { colors, radius, spacing } from '../src/theme/colors';

const NODE_H = 76;
const LEG_H = 72;
const LINE_X = 28;

type Node = { key: string; name: string; altitudeM: number; image: string | null };

// 上が頂上、下が出発点。学習1時間=1M
const NODES: Node[] = [
  ...[...ASCENT_MILESTONES].reverse().map((m: Milestone) => ({ key: String(m.order), name: m.name, altitudeM: m.altitudeM, image: m.image })),
  { key: 'start', name: 'スタート', altitudeM: 0, image: null },
];

function formatRemain(min: number) {
  if (min < 120) return `${Math.max(1, Math.ceil(min))}分`;
  return `約${Math.round(min / 60).toLocaleString()}時間`;
}

function HeroBackdrop({ height }: { height: number }) {
  return (
    <Svg width="100%" height={height} viewBox={`0 0 375 ${height}`} preserveAspectRatio="xMidYMid slice" style={StyleSheet.absoluteFill}>
      <Defs>
        <LinearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#0B2545" />
          <Stop offset="0.6" stopColor="#1D4E7A" />
          <Stop offset="1" stopColor="#F2A365" />
        </LinearGradient>
      </Defs>
      <Rect x="0" y="0" width="375" height={height} fill="url(#sky)" />
      {[[40, 60], [120, 30], [210, 80], [300, 40], [340, 110], [70, 130], [250, 20]].map(([x, y], i) => (
        <Circle key={i} cx={x} cy={y} r={1.4} fill="#fff" opacity={0.7} />
      ))}
      <Path d={`M0 ${height} L0 ${height - 50} L70 ${height - 100} L130 ${height - 60} L200 ${height - 130} L275 ${height - 70} L330 ${height - 95} L375 ${height - 55} L375 ${height} Z`} fill="#0B2545" opacity={0.55} />
      <Path d={`M0 ${height} L0 ${height - 28} L90 ${height - 62} L170 ${height - 30} L260 ${height - 72} L375 ${height - 26} L375 ${height} Z`} fill="#0B2545" />
    </Svg>
  );
}

// screen key: ascent_climb
export default function AscentClimbScreen() {
  const insets = useSafeAreaInsets();
  const { totalStudyMinutes, todayStudyMinutes, reload } = useStats();
  const { profile, avatarUrl } = useProfile();
  const scroller = useRef<ScrollView>(null);
  const [listTop, setListTop] = useState<number | null>(null);

  useEffect(() => {
    reload();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const altitude = totalStudyMinutes / 60;
  const next = [...ASCENT_MILESTONES].find((m) => m.altitudeM > altitude) ?? null;
  const prev = [...ASCENT_MILESTONES].reverse().find((m) => m.altitudeM <= altitude) ?? null;
  const prevAlt = prev?.altitudeM ?? 0;
  const legProgress = next ? Math.min(1, Math.max(0, (altitude - prevAlt) / (next.altitudeM - prevAlt))) : 1;
  const remainMin = next ? Math.max(0, (next.altitudeM - altitude) * 60) : 0;

  // 現在地のある区間（NODES上でのindex）へ、画面を開いたときに自動でスクロールする
  const currentLeg = next ? NODES.findIndex((n) => n.key === String(next.order)) : 0;
  useEffect(() => {
    if (listTop === null) return;
    const y = listTop + currentLeg * (NODE_H + LEG_H) - 220;
    scroller.current?.scrollTo({ y: Math.max(0, y), animated: false });
  }, [listTop, currentLeg]);

  const heroH = 300 + insets.top;
  const avatarUri = avatarUrl ? (avatarUrl.startsWith('http') ? avatarUrl : `${BACKEND_URL}${avatarUrl}`) : null;

  return (
    <View style={styles.screen}>
      <ScrollView ref={scroller} contentContainerStyle={{ paddingBottom: spacing.xl + insets.bottom }}>
        <View style={{ height: heroH }}>
          <HeroBackdrop height={heroH} />
          <View style={[styles.heroInner, { paddingTop: insets.top + spacing.sm }]}>
            <Pressable style={styles.backBtn} onPress={() => router.back()} hitSlop={10}>
              <Ionicons name="chevron-back" size={20} color="#fff" />
            </Pressable>
            <Text style={styles.heroLabel}>現在の標高</Text>
            <Text style={styles.heroNum}>
              {altitude.toFixed(1)}
              <Text style={styles.heroUnit}> M</Text>
            </Text>
            <Text style={styles.heroSub}>
              累計 {Math.floor(totalStudyMinutes / 60)}時間{totalStudyMinutes % 60}分の学習
              {todayStudyMinutes > 0 ? `　今日 +${todayStudyMinutes}分` : ''}
            </Text>

            <View style={styles.nextBox}>
              {next ? (
                <>
                  <View style={styles.nextTop}>
                    <Image source={{ uri: `${BACKEND_URL}${next.image}` }} style={styles.nextImg} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.nextKicker}>次の目標</Text>
                      <Text style={styles.nextName} numberOfLines={1}>
                        {next.name}　{next.altitudeM.toLocaleString()}M
                      </Text>
                    </View>
                    <Text style={styles.nextPct}>{Math.round(legProgress * 100)}%</Text>
                  </View>
                  <View style={styles.track}>
                    <View style={[styles.fill, { width: `${Math.round(legProgress * 100)}%` }]} />
                  </View>
                  <Text style={styles.nextRemain}>あと {formatRemain(remainMin)} の学習で到達</Text>
                </>
              ) : (
                <Text style={styles.nextName}>🏆 エベレストの頂に到達しました！</Text>
              )}
            </View>
          </View>
        </View>

        <Text style={styles.listTitle}>登頂ルート</Text>
        <Text style={styles.listDesc}>1時間の学習で1M登ります。上に向かって、名所や山を越えていこう。</Text>

        <View style={styles.list} onLayout={(e) => setListTop(e.nativeEvent.layout.y)}>
          {NODES.map((n, i) => {
            const reached = altitude >= n.altitudeM;
            const isNext = next !== null && n.key === String(next.order);
            const lower = NODES[i + 1];
            const legFill = lower ? Math.min(1, Math.max(0, (altitude - lower.altitudeM) / (n.altitudeM - lower.altitudeM))) : 0;
            const hasMarker = !!lower && legFill > 0 && legFill < 1;
            const markerHere = lower && altitude >= lower.altitudeM && altitude < n.altitudeM;
            return (
              <View key={n.key}>
                <View style={[styles.nodeRow, { height: NODE_H }]}>
                  <View style={styles.lineCol}>
                    <View style={[styles.dot, reached && styles.dotReached, isNext && styles.dotNext]}>
                      {reached && <Ionicons name="checkmark" size={13} color="#fff" />}
                    </View>
                  </View>
                  <View style={[styles.nodeCard, isNext && styles.nodeCardNext, reached && styles.nodeCardReached]}>
                    {n.image ? (
                      <Image source={{ uri: `${BACKEND_URL}${n.image}` }} style={[styles.nodeImg, !reached && !isNext && { opacity: 0.55 }]} />
                    ) : (
                      <View style={[styles.nodeImg, styles.startImg]}>
                        <Ionicons name="flag" size={20} color={colors.navy} />
                      </View>
                    )}
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.nodeName, !reached && !isNext && { color: colors.textSecondary }]} numberOfLines={1}>
                        {n.name}
                      </Text>
                      <Text style={styles.nodeAlt}>{n.altitudeM.toLocaleString()}M</Text>
                    </View>
                    <Text style={[styles.nodeStatus, reached && { color: colors.goldAccent }, isNext && { color: colors.coral }]}>
                      {reached ? '到達済み' : isNext ? `あと${formatRemain((n.altitudeM - altitude) * 60)}` : `あと${formatRemain((n.altitudeM - altitude) * 60)}`}
                    </Text>
                  </View>
                </View>

                {lower && (
                  <View style={{ height: LEG_H }}>
                    <View style={[styles.legTrack, { left: LINE_X - 2 }]} />
                    <View style={[styles.legFill, { left: LINE_X - 2, height: LEG_H * legFill }]} />
                    {markerHere && (
                      <View style={[styles.marker, { bottom: hasMarker ? LEG_H * legFill - 18 : -18 }]}>
                        {avatarUri ? (
                          <Image source={{ uri: avatarUri }} style={styles.markerImg} />
                        ) : (
                          <View style={[styles.markerImg, styles.markerFallback]}>
                            <Text style={styles.markerInitial}>{(profile.name || 'あ').charAt(0)}</Text>
                          </View>
                        )}
                        <View style={styles.markerTag}>
                          <Text style={styles.markerTagText}>いまココ　{altitude.toFixed(1)}M</Text>
                        </View>
                      </View>
                    )}
                  </View>
                )}
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  heroInner: { flex: 1, paddingHorizontal: spacing.lg },
  backBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },
  heroLabel: { color: 'rgba(255,255,255,0.75)', fontSize: 12 },
  heroNum: { color: '#fff', fontSize: 52, fontWeight: '800', letterSpacing: -1 },
  heroUnit: { fontSize: 20, fontWeight: '700' },
  heroSub: { color: 'rgba(255,255,255,0.85)', fontSize: 12, marginTop: 2 },
  nextBox: { marginTop: 'auto', marginBottom: spacing.md, backgroundColor: 'rgba(255,255,255,0.96)', borderRadius: radius.md, padding: spacing.md },
  nextTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  nextImg: { width: 40, height: 40, borderRadius: radius.sm, backgroundColor: colors.background },
  nextKicker: { fontSize: 10, color: colors.textSecondary },
  nextName: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  nextPct: { fontSize: 16, fontWeight: '800', color: colors.coral },
  track: { height: 8, borderRadius: 4, backgroundColor: colors.background, overflow: 'hidden', marginTop: spacing.sm },
  fill: { height: '100%', borderRadius: 4, backgroundColor: colors.coral },
  nextRemain: { fontSize: 11, color: colors.textSecondary, marginTop: 6 },
  listTitle: { fontSize: 16, fontWeight: '700', color: colors.textPrimary, marginHorizontal: spacing.lg, marginTop: spacing.lg },
  listDesc: { fontSize: 11, color: colors.textSecondary, marginHorizontal: spacing.lg, marginTop: 2, marginBottom: spacing.md },
  list: { paddingHorizontal: spacing.lg },
  nodeRow: { flexDirection: 'row', alignItems: 'center' },
  lineCol: { width: LINE_X * 2 - 20, alignItems: 'flex-start' },
  dot: { width: 24, height: 24, borderRadius: 12, backgroundColor: colors.white, borderWidth: 3, borderColor: '#B8C4CE', alignItems: 'center', justifyContent: 'center', marginLeft: LINE_X - 12 },
  dotReached: { backgroundColor: colors.goldAccent, borderColor: colors.goldAccent },
  dotNext: { borderColor: colors.coral, borderWidth: 4 },
  nodeCard: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.white, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.sm, marginLeft: spacing.sm },
  nodeCardNext: { borderColor: colors.coral, borderWidth: 1.5 },
  nodeCardReached: { backgroundColor: colors.goldLight },
  nodeImg: { width: 48, height: 48, borderRadius: radius.sm, backgroundColor: colors.border },
  startImg: { alignItems: 'center', justifyContent: 'center' },
  nodeName: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  nodeAlt: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  nodeStatus: { fontSize: 11, fontWeight: '700', color: colors.textSecondary },
  legTrack: { position: 'absolute', top: 0, bottom: 0, width: 4, borderRadius: 2, backgroundColor: '#D5DDE4' },
  legFill: { position: 'absolute', bottom: 0, width: 4, borderRadius: 2, backgroundColor: colors.goldAccent },
  marker: { position: 'absolute', left: LINE_X - 18, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  markerImg: { width: 36, height: 36, borderRadius: 18, borderWidth: 3, borderColor: colors.coral, backgroundColor: colors.white },
  markerFallback: { alignItems: 'center', justifyContent: 'center' },
  markerInitial: { fontWeight: '700', color: colors.coral },
  markerTag: { backgroundColor: colors.coral, borderRadius: radius.pill, paddingVertical: 3, paddingHorizontal: spacing.sm },
  markerTagText: { color: '#fff', fontSize: 11, fontWeight: '700' },
});
