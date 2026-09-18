import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { apiDelete, apiGet, apiPost } from '../../src/api/mobileAuth';
import { fetchRanking, RankingGroup, RankingUser } from '../../src/api/ranking';
import { CalendarGrid } from '../../src/components/CalendarGrid';
import { DaySheet } from '../../src/components/DaySheet';
import { RecordChart } from '../../src/components/RecordChart';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import {
  ALL_USERS_MOCK_FALLBACK,
  DailyStat,
  OTHER_GROUPS_MOCK_FALLBACK,
  RecordPeriod,
  RecordScope,
  StudyLogEntry,
  buildUnifiedSpeakingLog,
  groupMembers,
  memberTotalForRankingPeriod,
  personalTotalForRankingPeriod,
  recordChartBuckets,
  recordChartTotalBuckets,
} from '../../src/data/records';
import { useGoals } from '../../src/store/GoalsContext';
import { useProfile } from '../../src/store/ProfileContext';
import { useStats } from '../../src/store/StatsContext';
import { colors, radius, spacing } from '../../src/theme/colors';
import { dateKey, formatMin, shortMd } from '../../src/utils/dateHelpers';

type MobileRecord = { id: number; date: string; study_min: number; speak_min: number; category: string | null; subcategories: string[]; memo: string | null };

function isoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

const PERIOD_LABEL: Record<RecordPeriod, string> = { day: '日別', week: '週別', month: '月別', all: '全期間' };
const WINDOW: Record<RecordPeriod, number> = { day: 7, week: 6, month: Infinity, all: Infinity };

// screen key: records
export default function RecordsScreen() {
  const { profile } = useProfile();
  const { studyGoal, speakGoal } = useGoals();
  const { reload: reloadStats } = useStats();
  const [scope, setScope] = useState<RecordScope>('personal');
  const [period, setPeriod] = useState<RecordPeriod>('day');
  const [offset, setOffset] = useState<Record<RecordPeriod, number>>({ day: 0, week: 0, month: 0, all: 0 });
  const [selected, setSelected] = useState<Record<RecordPeriod, number | null>>({ day: null, week: null, month: null, all: 0 });

  const [entries, setEntries] = useState<Record<string, StudyLogEntry[]>>({});
  const [personalData, setPersonalData] = useState<DailyStat[]>([]);
  const [calMonth, setCalMonth] = useState(new Date());
  const [sheetVisible, setSheetVisible] = useState(false);
  const [sheetDate, setSheetDate] = useState<Date | null>(null);

  const loadRecords = useCallback(() => {
    apiGet<MobileRecord[]>('/records').then((rows) => {
      const nextEntries: Record<string, StudyLogEntry[]> = {};
      const dailyTotals: Record<string, DailyStat> = {};
      rows.forEach((r) => {
        const [y, m, d] = r.date.split('-').map(Number);
        const dt = new Date(y, m - 1, d);
        const key = dateKey(dt);
        (nextEntries[key] ??= []).push({
          id: r.id,
          category: r.category || 'other',
          subcategories: r.subcategories,
          minutes: r.study_min,
          memo: r.memo || '',
        });
        // 同じ日に複数件登録されていても、グラフ/カレンダー用には1日分に合算する
        if (!dailyTotals[key]) dailyTotals[key] = { date: dt, studyMin: 0, speakMin: 0 };
        dailyTotals[key].studyMin += r.study_min;
        dailyTotals[key].speakMin += r.speak_min;
      });
      const nextData = Object.values(dailyTotals).sort((a, b) => a.date.getTime() - b.date.getTime());
      setEntries(nextEntries);
      setPersonalData(nextData);
    });
  }, []);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  const buckets = useMemo(() => recordChartBuckets(scope, period, offset[period], personalData), [scope, period, offset, personalData]);
  const totalBuckets = recordChartTotalBuckets(scope, period, personalData);
  const selIdx = selected[period] === null ? buckets.length - 1 : Math.min(selected[period]!, buckets.length - 1);
  const sel = buckets[selIdx] ?? { label: '', studyMin: 0, speakMin: 0, days: 1 };
  const goal = scope === 'personal' ? { study: studyGoal, speak: speakGoal } : { study: studyGoal * 12, speak: speakGoal * 12 };
  const studyTarget = Math.round(goal.study * sel.days);
  const speakTarget = Math.round(goal.speak * sel.days);

  const win = WINDOW[period];
  const canOlder = (offset[period] + 1) * win < totalBuckets;
  const canNewer = offset[period] > 0;

  const openDaySheet = (d: Date) => {
    setSheetDate(d);
    setSheetVisible(true);
  };

  const saveEntry = async (entry: StudyLogEntry) => {
    if (!sheetDate) return;
    await apiPost('/records', {
      id: entry.id,
      date: isoDate(sheetDate),
      category: entry.category,
      subcategories: entry.subcategories,
      minutes: entry.minutes,
      memo: entry.memo,
    });
    loadRecords();
    reloadStats();
  };

  const deleteEntry = async (id: number) => {
    await apiDelete(`/records/${id}`);
    loadRecords();
    reloadStats();
  };

  // TODO: Daily/Weeklyミッション結果・フリー練習ログの永続化テーブルが未実装のためモックのまま
  // （Monthlyミッションのみ /api/mobile/monthly-mission でバックエンドと共有済み）
  const speakingLog = useMemo(() => buildUnifiedSpeakingLog(), []);

  // ---- ranking ----
  const rankingPeriodNoun = PERIOD_LABEL[period];
  const myPersonalTotal = personalTotalForRankingPeriod(period, personalData);
  const [rankingUsers, setRankingUsers] = useState<RankingUser[]>(ALL_USERS_MOCK_FALLBACK);
  const [rankingGroups, setRankingGroups] = useState<RankingGroup[]>(OTHER_GROUPS_MOCK_FALLBACK);
  const [rankingLoading, setRankingLoading] = useState(true);

  useEffect(() => {
    fetchRanking()
      .then((data) => {
        setRankingUsers(data.users);
        setRankingGroups(data.groups);
      })
      .catch(() => {
        // オフライン等の場合は固定フォールバック値のまま
      })
      .finally(() => setRankingLoading(false));
  }, []);

  return (
    <ScrollView style={styles.screen}>
      <ScreenHeader title="記録" />

      {/* 学習履歴 */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>学習履歴</Text>
        <Pressable onPress={() => openDaySheet(new Date())}>
          <Text style={styles.link}>＋ 新規登録</Text>
        </Pressable>
      </View>

      <View style={styles.scopeRow}>
        <Pressable style={[styles.scopeSeg, scope === 'personal' && styles.scopeSegSel]} onPress={() => setScope('personal')}>
          <Text style={[styles.scopeText, scope === 'personal' && styles.scopeTextSel]}>個人</Text>
        </Pressable>
        <Pressable style={[styles.scopeSeg, scope === 'group' && styles.scopeSegSel]} onPress={() => setScope('group')}>
          <Text style={[styles.scopeText, scope === 'group' && styles.scopeTextSel]}>グループ</Text>
        </Pressable>
      </View>

      <View style={styles.periodTabs}>
        {(['day', 'week', 'month', 'all'] as RecordPeriod[]).map((p) => (
          <Pressable key={p} style={[styles.periodTab, period === p && styles.periodTabSel]} onPress={() => setPeriod(p)}>
            <Text style={[styles.periodTabText, period === p && styles.periodTabTextSel]}>{PERIOD_LABEL[p]}</Text>
          </Pressable>
        ))}
      </View>

      {scope === 'group' && (
        <Pressable style={styles.groupLink} onPress={() => router.push('/group_members')}>
          <Text style={styles.groupLinkText}>グループのメンバーを見る（{groupMembers.length + 1}人）</Text>
        </Pressable>
      )}

      <View style={styles.chartCard}>
        <View style={styles.legendRow}>
          <View style={styles.legendItem}>
            <View style={[styles.legendSw, { backgroundColor: colors.coral }]} />
            <Text style={styles.legendText}>発話時間</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendSw, { backgroundColor: colors.navyLight }]} />
            <Text style={styles.legendText}>その他学習時間</Text>
          </View>
        </View>

        <RecordChart
          buckets={buckets}
          selectedIdx={selIdx}
          onSelect={(i) => setSelected((prev) => ({ ...prev, [period]: i }))}
          canOlder={canOlder}
          canNewer={canNewer}
          onOlder={() => setOffset((prev) => ({ ...prev, [period]: prev[period] + 1 }))}
          onNewer={() => setOffset((prev) => ({ ...prev, [period]: prev[period] - 1 }))}
          showNav={win !== Infinity}
        />

        <Text style={styles.chartTap}>{period === 'all' ? PERIOD_LABEL.all : `${sel.label}をタップで詳細切替`}</Text>

        <View style={styles.sumRow}>
          <Text style={styles.sumMetric}>総学習時間{sel.label ? `（${sel.label}）` : ''}</Text>
          <Text style={styles.sumVal}>
            {formatMin(sel.studyMin)} / {formatMin(studyTarget)}
          </Text>
        </View>
        <View style={[styles.sumRow, styles.sumRowSub]}>
          <Text style={styles.sumMetric}>うち発話</Text>
          <Text style={styles.sumVal}>
            {formatMin(sel.speakMin)} / {formatMin(speakTarget)}
          </Text>
        </View>
      </View>

      {/* ランキング */}
      {rankingLoading ? (
        <View style={styles.rankLoadingWrap}>
          <ActivityIndicator color={colors.coral} />
        </View>
      ) : scope === 'group' ? (
        <GroupRanking period={period} periodNoun={rankingPeriodNoun} myTotal={myPersonalTotal} groups={rankingGroups} />
      ) : (
        <PersonalRanking
          period={period}
          periodNoun={rankingPeriodNoun}
          myTotal={myPersonalTotal}
          myName={profile.name || 'あなた'}
          users={rankingUsers}
        />
      )}

      {/* カレンダー */}
      <Text style={styles.sectionTitle}>カレンダー</Text>
      <View style={styles.calendarWrap}>
        <CalendarGrid
          month={calMonth}
          entries={entries}
          onPrevMonth={() => setCalMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1))}
          onNextMonth={() => setCalMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1))}
          onSelectDay={openDaySheet}
        />
      </View>

      {/* スピーキング履歴プレビュー */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>スピーキング履歴</Text>
        {speakingLog.length > 5 && (
          <Pressable onPress={() => router.push('/speaking_history_full')}>
            <Text style={styles.link}>全て見る</Text>
          </Pressable>
        )}
      </View>
      <View style={styles.logCard}>
        {speakingLog.slice(0, 5).map((s, i) => (
          <View key={i} style={[styles.logRow, i > 0 && styles.logRowBordered]}>
            <Text style={styles.logTitle} numberOfLines={1}>
              {s.title}
            </Text>
            {s.pass !== undefined && (
              <Text style={[styles.passIcon, { color: s.pass ? colors.success : colors.danger }]}>{s.pass ? '✓' : '✕'}</Text>
            )}
            <Text style={styles.logDate}>{shortMd(s.date)}</Text>
          </View>
        ))}
      </View>

      <DaySheet
        visible={sheetVisible}
        date={sheetDate}
        entries={sheetDate ? entries[dateKey(sheetDate)] ?? [] : []}
        onChangeDate={setSheetDate}
        onCancel={() => setSheetVisible(false)}
        onSave={saveEntry}
        onDelete={deleteEntry}
      />
    </ScrollView>
  );
}

function PersonalRanking({
  period,
  periodNoun,
  myTotal,
  myName,
  users,
}: {
  period: RecordPeriod;
  periodNoun: string;
  myTotal: number;
  myName: string;
  users: RankingUser[];
}) {
  const rows = [
    { name: myName, min: myTotal, me: true },
    ...users.map((u) => ({ name: u.name, min: memberTotalForRankingPeriod(u.weeklyStudyMin, period), me: false })),
  ].sort((a, b) => b.min - a.min);
  const myRank = rows.findIndex((r) => r.me) + 1;
  const top10 = rows.slice(0, 10);
  const meInTop10 = top10.some((r) => r.me);

  return (
    <>
      <Text style={styles.sectionTitle}>
        全ユーザランキング<Text style={styles.sumSub}>（{periodNoun}の学習時間・TOP10）</Text>
      </Text>
      <View style={styles.rankCard}>
        {top10.map((r, i) => (
          <RankRow key={i} name={r.name} min={r.min} pos={i + 1} me={r.me} />
        ))}
        {!meInTop10 && (
          <>
            <Text style={styles.rankDivider}>…</Text>
            <RankRow name={myName} min={myTotal} pos={myRank} me />
          </>
        )}
      </View>
    </>
  );
}

function GroupRanking({
  period,
  periodNoun,
  myTotal,
  groups,
}: {
  period: RecordPeriod;
  periodNoun: string;
  myTotal: number;
  groups: RankingGroup[];
}) {
  const myGroupTotal = myTotal + groupMembers.reduce((a, m) => a + memberTotalForRankingPeriod(m.weeklyStudyMin, period), 0);
  const rows = [
    { name: 'aグループ', min: myGroupTotal, me: true },
    ...groups.map((g) => ({ name: g.name, min: memberTotalForRankingPeriod(g.weeklyStudyMin, period), me: false })),
  ].sort((a, b) => b.min - a.min);

  return (
    <>
      <Text style={styles.sectionTitle}>
        グループランキング<Text style={styles.sumSub}>（{periodNoun}の合計学習時間）</Text>
      </Text>
      <View style={styles.rankCard}>
        {rows.map((r, i) => (
          <RankRow key={i} name={r.name} min={r.min} pos={i + 1} me={r.me} />
        ))}
      </View>
    </>
  );
}

function RankRow({ name, min, pos, me }: { name: string; min: number; pos: number; me: boolean }) {
  return (
    <View style={[styles.rankRow, me && styles.rankRowMe]}>
      <Text style={[styles.rankPos, pos <= 3 && styles.rankPosTop]}>{pos}</Text>
      <Text style={styles.rankName}>
        {name}
        {me ? <Text style={styles.youTag}> あなた</Text> : null}
      </Text>
      <Text style={styles.rankVal}>{formatMin(min)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginHorizontal: spacing.lg, marginTop: spacing.lg },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: colors.textPrimary, marginHorizontal: spacing.lg, marginTop: spacing.lg, marginBottom: spacing.sm },
  sumSub: { fontSize: 11, fontWeight: '400', color: colors.textSecondary },
  link: { color: colors.coral, fontSize: 12, fontWeight: '600' },
  scopeRow: { flexDirection: 'row', marginHorizontal: spacing.lg, marginTop: spacing.sm, backgroundColor: colors.white, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, padding: 3 },
  scopeSeg: { flex: 1, alignItems: 'center', paddingVertical: 6, borderRadius: radius.pill },
  scopeSegSel: { backgroundColor: colors.navy },
  scopeText: { fontSize: 12, color: colors.textSecondary },
  scopeTextSel: { color: colors.white, fontWeight: '700' },
  periodTabs: { flexDirection: 'row', gap: spacing.xs, marginHorizontal: spacing.lg, marginTop: spacing.sm },
  periodTab: { flex: 1, alignItems: 'center', paddingVertical: 6, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border },
  periodTabSel: { backgroundColor: colors.coral, borderColor: colors.coral },
  periodTabText: { fontSize: 11, color: colors.textSecondary },
  periodTabTextSel: { color: colors.white, fontWeight: '700' },
  groupLink: { marginHorizontal: spacing.lg, marginTop: spacing.sm },
  groupLinkText: { color: colors.coral, fontSize: 12, fontWeight: '600' },
  chartCard: { margin: spacing.lg, backgroundColor: colors.white, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.md },
  legendRow: { flexDirection: 'row', gap: spacing.md },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendSw: { width: 8, height: 8, borderRadius: 2 },
  legendText: { fontSize: 10, color: colors.textSecondary },
  chartTap: { fontSize: 10, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.xs },
  sumRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.md },
  sumRowSub: { marginTop: spacing.xs },
  rankLoadingWrap: { paddingVertical: spacing.xl, alignItems: 'center' },
  sumMetric: { fontSize: 12, color: colors.textSecondary },
  sumVal: { fontSize: 12, color: colors.textPrimary, fontWeight: '600' },
  rankCard: { marginHorizontal: spacing.lg, backgroundColor: colors.white, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border },
  rankRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm, paddingHorizontal: spacing.md, borderTopWidth: 1, borderTopColor: colors.border },
  rankRowMe: { backgroundColor: 'rgba(232,130,95,0.08)' },
  rankPos: { width: 20, fontSize: 12, color: colors.textSecondary, textAlign: 'center' },
  rankPosTop: { color: colors.coral, fontWeight: '700' },
  rankName: { flex: 1, fontSize: 12, color: colors.textPrimary },
  youTag: { fontSize: 10, color: colors.coral, fontWeight: '700' },
  rankVal: { fontSize: 12, color: colors.textPrimary, fontWeight: '600' },
  rankDivider: { textAlign: 'center', color: colors.textSecondary, paddingVertical: spacing.xs },
  calendarWrap: { marginHorizontal: spacing.lg },
  logCard: { marginHorizontal: spacing.lg, marginBottom: spacing.xl, backgroundColor: colors.white, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border },
  logRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md },
  logRowBordered: { borderTopWidth: 1, borderTopColor: colors.border },
  logTitle: { flex: 1, fontSize: 12, color: colors.textPrimary },
  passIcon: { fontSize: 13, fontWeight: '700' },
  logDate: { fontSize: 11, color: colors.textSecondary },
});
