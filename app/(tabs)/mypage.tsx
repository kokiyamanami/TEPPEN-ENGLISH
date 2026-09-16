import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { MOCK_TOTAL_STUDY_MINUTES, getCurrentAltitudeM } from '../../src/data/mockHome';
import { useProfile } from '../../src/store/ProfileContext';
import { colors, radius, spacing } from '../../src/theme/colors';

const FIELD_ROWS: { key: keyof ReturnType<typeof useProfile>['profile']; label: string }[] = [
  { key: 'termGoal', label: '今タームの目標' },
  { key: 'gender', label: '性別' },
  { key: 'age', label: '年齢' },
  { key: 'voiceGender', label: '音声性別' },
  { key: 'jobDetail', label: '職業詳細' },
  { key: 'personality', label: '性格' },
  { key: 'hobby', label: '趣味' },
  { key: 'career', label: '経歴' },
  { key: 'successStory', label: '成功体験' },
  { key: 'strengths', label: '強み・弱み' },
  { key: 'futureCareer', label: 'キャリア（将来像）' },
  { key: 'workChallenge', label: '仕事課題' },
];

// screen key: mypage
export default function MyPageScreen() {
  const { profile } = useProfile();
  const [logoutOpen, setLogoutOpen] = useState(false);
  const altitudeM = getCurrentAltitudeM(MOCK_TOTAL_STUDY_MINUTES);

  return (
    <ScrollView style={styles.screen}>
      <ScreenHeader title="マイページ" />

      <View style={styles.hero}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{(profile.name || 'U').charAt(0)}</Text>
        </View>
        <Text style={styles.heroName}>{profile.name || '名前未設定'}</Text>
        <Text style={styles.heroPhase}>PHASE 3 · 標高{altitudeM.toLocaleString()}M</Text>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>プロフィール</Text>
        <Pressable onPress={() => router.push('/mypage_edit')}>
          <Text style={styles.link}>編集する</Text>
        </Pressable>
      </View>
      <View style={styles.fieldGroup}>
        <FieldRow label="職業 / 職位" value={`${profile.job || '未設定'} / ${profile.position || '未設定'}`} />
        {FIELD_ROWS.map((f) => (
          <FieldRow key={f.key} label={f.label} value={profile[f.key] || '未設定'} />
        ))}
      </View>

      <View style={[styles.fieldGroup, { marginTop: spacing.md }]}>
        <Pressable style={styles.navRow} onPress={() => router.push('/goal_history')}>
          <Text style={styles.navRowLabel}>目標設定</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
        </Pressable>
        <Pressable style={[styles.navRow, styles.navRowBordered]} onPress={() => router.push('/past_groups')}>
          <Text style={styles.navRowLabel}>過去の所属グループ</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
        </Pressable>
      </View>

      <Pressable style={styles.planBanner} onPress={() => router.push('/plans')}>
        <View style={styles.planMark}>
          <Ionicons name="flag" size={18} color={colors.white} />
        </View>
        <View style={styles.planBody}>
          <Text style={styles.planEyebrow}>PLAN</Text>
          <Text style={styles.planTitle}>有料プランのご案内</Text>
          <Text style={styles.planSub}>990円プラン・TEPPEN ENGLISHコーチングも</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.white} />
      </Pressable>

      <Pressable style={styles.logoutRow} onPress={() => setLogoutOpen(true)}>
        <Text style={styles.logoutText}>ログアウト</Text>
      </Pressable>

      <Modal visible={logoutOpen} transparent animationType="fade" onRequestClose={() => setLogoutOpen(false)}>
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>ログアウトしますか？</Text>
            <Text style={styles.sheetDesc}>再度ログインするまで、教材の生成や記録の同期は行われません。</Text>
            <View style={styles.sheetRow}>
              <Pressable style={styles.cancelBtn} onPress={() => setLogoutOpen(false)}>
                <Text style={styles.cancelText}>キャンセル</Text>
              </Pressable>
              <Pressable
                style={styles.confirmBtn}
                onPress={() => {
                  setLogoutOpen(false);
                  router.replace('/');
                }}
              >
                <Text style={styles.confirmText}>ログアウトする</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

function FieldRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.fieldRow}>
      <Text style={styles.fieldKey}>{label}</Text>
      <Text style={styles.fieldVal} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  hero: { alignItems: 'center', backgroundColor: colors.navy, marginHorizontal: spacing.lg, borderRadius: radius.lg, paddingVertical: spacing.xl },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.coral, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: colors.white, fontSize: 22, fontWeight: '700' },
  heroName: { color: colors.white, fontSize: 16, fontWeight: '700', marginTop: spacing.sm },
  heroPhase: { color: colors.coralLight, fontSize: 11, marginTop: 2 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginHorizontal: spacing.lg, marginTop: spacing.lg },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  link: { color: colors.coral, fontSize: 12, fontWeight: '600' },
  fieldGroup: { marginHorizontal: spacing.lg, marginTop: spacing.sm, backgroundColor: colors.white, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border },
  fieldRow: { flexDirection: 'row', justifyContent: 'space-between', padding: spacing.md, borderTopWidth: 1, borderTopColor: colors.border, gap: spacing.md },
  fieldKey: { fontSize: 12, color: colors.textSecondary, width: 100 },
  fieldVal: { flex: 1, fontSize: 12, color: colors.textPrimary, textAlign: 'right' },
  navRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.md },
  navRowBordered: { borderTopWidth: 1, borderTopColor: colors.border },
  navRowLabel: { fontSize: 13, color: colors.textPrimary, fontWeight: '600' },
  planBanner: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginHorizontal: spacing.lg, marginTop: spacing.lg, backgroundColor: colors.coral, borderRadius: radius.md, padding: spacing.md },
  planMark: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  planBody: { flex: 1 },
  planEyebrow: { color: colors.white, fontSize: 9, opacity: 0.85 },
  planTitle: { color: colors.white, fontWeight: '700', fontSize: 13, marginTop: 2 },
  planSub: { color: colors.white, fontSize: 10, marginTop: 2, opacity: 0.9 },
  logoutRow: { alignItems: 'center', paddingVertical: spacing.xl },
  logoutText: { color: colors.danger, fontSize: 13, fontWeight: '600' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: spacing.lg },
  sheet: { backgroundColor: colors.white, borderRadius: radius.lg, padding: spacing.lg },
  sheetTitle: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
  sheetDesc: { fontSize: 12, color: colors.textSecondary, marginTop: spacing.xs, lineHeight: 18 },
  sheetRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg },
  cancelBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.md, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border },
  cancelText: { color: colors.textPrimary, fontWeight: '600' },
  confirmBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.md, borderRadius: radius.pill, backgroundColor: colors.danger },
  confirmText: { color: colors.white, fontWeight: '700' },
});
