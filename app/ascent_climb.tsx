import { router } from 'expo-router';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AscentScene } from '../src/components/AscentScene';
import {
  ASCENT_MILESTONES,
  MOCK_TOTAL_STUDY_MINUTES,
  getCurrentAltitudeM,
  getNextMilestone,
  getPrevMilestone,
} from '../src/data/mockHome';
import { colors, radius, spacing } from '../src/theme/colors';

// screen key: ascent_climb
export default function AscentClimbScreen() {
  const [showRoute, setShowRoute] = useState(false);
  const altitudeM = getCurrentAltitudeM(MOCK_TOTAL_STUDY_MINUTES);
  const next = getNextMilestone(altitudeM);
  const prev = getPrevMilestone(altitudeM);
  const remainMin = next ? Math.max(0, Math.round((next.altitudeM - altitudeM) * 60)) : 0;

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
          </View>
        </View>

        <View style={styles.card}>
          {next ? (
            <>
              <Text style={styles.nextTitle}>
                次の目標：{next.name}（{next.altitudeM.toLocaleString()}M）
              </Text>
              <Text style={styles.nextSub}>あと {remainMin}分 の学習で到達します</Text>
            </>
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
  card: {
    margin: spacing.lg,
    backgroundColor: colors.white,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
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
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sheetRowDone: { opacity: 0.5 },
  sheetRowText: { color: colors.textPrimary, fontWeight: '600' },
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
