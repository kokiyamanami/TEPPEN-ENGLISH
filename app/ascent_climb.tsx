import { router } from 'expo-router';
import { useState } from 'react';
import { Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AscentScene } from '../src/components/AscentScene';
import { BACKEND_URL } from '../src/config/api';
import { ASCENT_MILESTONES, getCurrentAltitudeM, getNextMilestone, getPrevMilestone } from '../src/data/mockHome';
import { useStats } from '../src/store/StatsContext';
import { colors, radius, spacing } from '../src/theme/colors';

// screen key: ascent_climb
export default function AscentClimbScreen() {
  const [showRoute, setShowRoute] = useState(false);
  const { totalStudyMinutes } = useStats();
  const altitudeM = getCurrentAltitudeM(totalStudyMinutes);
  const next = getNextMilestone(altitudeM);
  const prev = getPrevMilestone(altitudeM);
  const remainMin = next ? Math.max(0, Math.round((next.altitudeM - altitudeM) * 60)) : 0;
  const prevAltitude = prev?.altitudeM ?? 0;
  const legProgress = next ? Math.min(1, Math.max(0, (altitudeM - prevAltitude) / (next.altitudeM - prevAltitude))) : 1;

  return (
    <View style={styles.screen}>
      <ScrollView>
        <View style={styles.sceneWrap}>
          <AscentScene altitudeM={altitudeM} />
          <View style={styles.overlay} pointerEvents="none">
            <Text style={styles.overlayNum}>
              {altitudeM.toLocaleString()}
              <Text style={styles.overlayUnit}>M</Text>
            </Text>
            <Text style={styles.overlayLabel}>{prev ? `${prev.name}を越えました` : 'まだ出発したばかり'}</Text>
            {next && (
              <View style={styles.progressWrap}>
                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: `${Math.round(legProgress * 100)}%` }]} />
                </View>
                <Text style={styles.progressLabel}>次の「{next.name}」まで {Math.round(legProgress * 100)}%</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.card}>
          {next ? (
            <View style={styles.nextRow}>
              <Image source={{ uri: `${BACKEND_URL}${next.image}` }} style={styles.nextImg} />
              <View style={{ flex: 1 }}>
                <Text style={styles.nextTitle}>
                  次の目標：{next.name}（{next.altitudeM.toLocaleString()}M）
                </Text>
                <Text style={styles.nextSub}>あと {remainMin}分 の学習で到達します</Text>
              </View>
            </View>
          ) : (
            <>
              <Text style={styles.nextTitle}>🏆 エベレストの頂に到達しました！</Text>
              <Text style={styles.nextSub}>最高到達点を更新し続けましょう</Text>
            </>
          )}
          <Pressable onPress={() => setShowRoute(true)}>
            <Text style={styles.viewRoute}>登頂ルートの全体を見る</Text>
          </Pressable>
        </View>
      </ScrollView>

      <Modal visible={showRoute} transparent animationType="slide" onRequestClose={() => setShowRoute(false)}>
        <View style={styles.sheetOverlay}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>登頂ルート</Text>
            <Text style={styles.sheetDesc}>
              1時間の学習で1M進みます。標高{altitudeM.toLocaleString()}Mの今、どこまで登ったか一覧です。
            </Text>
            <ScrollView style={styles.sheetList}>
              {ASCENT_MILESTONES.map((m) => (
                <View key={m.order} style={[styles.sheetRow, altitudeM >= m.altitudeM && styles.sheetRowDone]}>
                  <Image source={{ uri: `${BACKEND_URL}${m.image}` }} style={styles.sheetRowImg} />
                  <Text style={[styles.sheetRowText, altitudeM >= m.altitudeM && styles.sheetRowTextDone]}>
                    {m.name}
                  </Text>
                  <Text style={[styles.sheetRowM, altitudeM >= m.altitudeM && styles.sheetRowTextDone]}>
                    {m.altitudeM.toLocaleString()}M
                  </Text>
                </View>
              ))}
            </ScrollView>
            <Pressable style={styles.closeBtn} onPress={() => setShowRoute(false)}>
              <Text style={styles.closeBtnText}>閉じる</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  sceneWrap: { position: 'relative' },
  overlay: { position: 'absolute', left: spacing.lg, top: spacing.lg },
  overlayNum: { color: colors.white, fontSize: 40, fontWeight: '700' },
  overlayUnit: { fontSize: 16, fontWeight: '600' },
  overlayLabel: { color: colors.coralLight, fontSize: 13, marginTop: spacing.xs },
  progressWrap: { marginTop: spacing.md, width: 160 },
  progressTrack: { height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.25)', overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3, backgroundColor: colors.coral },
  progressLabel: { color: colors.white, fontSize: 10, marginTop: spacing.xs, opacity: 0.85 },
  card: {
    margin: spacing.lg,
    backgroundColor: colors.white,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  nextRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  nextImg: { width: 48, height: 48, borderRadius: radius.md, backgroundColor: colors.background },
  nextTitle: { fontWeight: '700', color: colors.textPrimary, fontSize: 15 },
  nextSub: { color: colors.textSecondary, fontSize: 13, marginTop: spacing.xs },
  viewRoute: { color: colors.coral, fontWeight: '600', fontSize: 13, marginTop: spacing.md },
  sheetOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.lg,
    maxHeight: '75%',
  },
  sheetTitle: { fontSize: 18, fontWeight: '700', color: colors.textPrimary },
  sheetDesc: { fontSize: 13, color: colors.textSecondary, marginTop: spacing.xs, lineHeight: 18 },
  sheetList: { marginTop: spacing.md },
  sheetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sheetRowDone: { opacity: 0.5 },
  sheetRowImg: { width: 32, height: 32, borderRadius: radius.sm, backgroundColor: colors.border },
  sheetRowText: { flex: 1, color: colors.textPrimary, fontWeight: '600' },
  sheetRowM: { color: colors.textSecondary },
  sheetRowTextDone: { textDecorationLine: 'line-through' },
  closeBtn: {
    marginTop: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  closeBtnText: { color: colors.textPrimary, fontWeight: '600' },
});
