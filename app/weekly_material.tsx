import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { apiGet } from '../src/api/mobileAuth';
import { TopBar } from '../src/components/TopBar';
import { generateWeeklyMaterial, WEEKLY_STEPS, WEEKLY_TEST_STEP } from '../src/data/weekly';
import { colors, radius, spacing } from '../src/theme/colors';

// screen key: weekly_material（Weeklyミッションのステップ一覧。STEP1〜6を順番にクリアするとSTEP7のテストが解放される）
export default function WeeklyMaterialScreen() {
  const w = useMemo(() => generateWeeklyMaterial(), []);
  const [completed, setCompleted] = useState<number | null>(null);

  useEffect(() => {
    apiGet<{ completedStep: number }>('/weekly-progress')
      .then((r) => setCompleted(r.completedStep))
      .catch(() => setCompleted(0));
  }, []);

  const open = (step: number) => {
    if (step === WEEKLY_TEST_STEP) router.push('/weekly_practice');
    else router.push({ pathname: '/weekly_step', params: { step: String(step) } } as never);
  };

  return (
    <ScrollView style={styles.screen}>
      <TopBar title="Weeklyミッション" backRoute="/speaking_hub" />

      <View style={styles.meta}>
        <Text style={styles.metaTag}>WEEK {w.week} の教材</Text>
        <Text style={styles.topic}>テーマ：{w.topic}</Text>
        <Text style={styles.progressText}>
          {completed === null ? '' : `${Math.min(completed, WEEKLY_STEPS.length)} / ${WEEKLY_STEPS.length} ステップ完了`}
        </Text>
      </View>

      {completed === null ? (
        <ActivityIndicator style={{ marginTop: spacing.xl }} color={colors.coral} />
      ) : (
        <View style={styles.list}>
          {WEEKLY_STEPS.map((s) => {
            const done = s.step <= completed;
            const current = s.step === completed + 1;
            const locked = s.step > completed + 1;
            return (
              <Pressable
                key={s.step}
                style={[styles.row, current && styles.rowCurrent, locked && styles.rowLocked]}
                disabled={locked}
                onPress={() => open(s.step)}
              >
                <View style={[styles.badge, done && styles.badgeDone, current && styles.badgeCurrent]}>
                  {done ? <Ionicons name="checkmark" size={14} color={colors.white} /> : <Text style={[styles.badgeText, current && styles.badgeTextCurrent]}>{s.step}</Text>}
                </View>
                <View style={styles.body}>
                  <Text style={styles.stepLabel}>STEP{s.step}</Text>
                  <Text style={styles.title}>{s.title}</Text>
                  <Text style={styles.desc}>{s.desc}</Text>
                </View>
                {locked ? (
                  <Ionicons name="lock-closed" size={16} color={colors.textSecondary} />
                ) : (
                  <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
                )}
              </Pressable>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  meta: { paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  metaTag: { color: colors.coral, fontSize: 11, fontWeight: '700' },
  topic: { fontSize: 12, color: colors.textPrimary, marginTop: spacing.xs },
  progressText: { fontSize: 11, color: colors.textSecondary, marginTop: spacing.xs },
  list: { margin: spacing.lg, gap: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.white, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.md },
  rowCurrent: { borderColor: colors.coral },
  rowLocked: { opacity: 0.5 },
  badge: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  badgeDone: { backgroundColor: colors.success, borderColor: colors.success },
  badgeCurrent: { borderColor: colors.coral },
  badgeText: { fontSize: 12, fontWeight: '700', color: colors.textSecondary },
  badgeTextCurrent: { color: colors.coral },
  body: { flex: 1 },
  stepLabel: { fontSize: 10, color: colors.textSecondary, fontWeight: '700' },
  title: { fontSize: 14, fontWeight: '700', color: colors.textPrimary, marginTop: 1 },
  desc: { fontSize: 11, color: colors.textSecondary, marginTop: 2, lineHeight: 16 },
});
