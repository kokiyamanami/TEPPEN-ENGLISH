import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useCallback, useEffect, useState } from 'react';
import { apiGet, apiPost } from '../src/api/mobileAuth';
import { TopBar } from '../src/components/TopBar';
import { usePhrases } from '../src/store/PhraseContext';
import { colors, radius, spacing } from '../src/theme/colors';

type HistoryRow = { id: number; text: string; text_jp: string; content_type: 'phrase' | 'word'; folder_name: string; mastered_at: string };

// screen key: phrase_history
export default function PhraseHistoryScreen() {
  const { reload } = usePhrases();
  const [rows, setRows] = useState<HistoryRow[] | null>(null);

  const load = useCallback(() => {
    apiGet<HistoryRow[]>('/phrase-history')
      .then(setRows)
      .catch(() => setRows([]));
  }, []);
  useEffect(load, [load]);

  const restore = (r: HistoryRow) =>
    Alert.alert('もう一度復習しますか？', `「${r.text}」を復習に戻します。覚えた回数は0回からやり直しです。`, [
      { text: 'キャンセル', style: 'cancel' },
      {
        text: '復習に戻す',
        onPress: async () => {
          try {
            await apiPost(`/phrase-history/${r.id}/restore`);
            load();
            reload().catch(() => {});
          } catch {
            Alert.alert('戻せませんでした', '通信状況を確認して、もう一度お試しください。');
          }
        },
      },
    ]);

  const words = rows?.filter((r) => r.content_type === 'word').length ?? 0;
  const phrases = (rows?.length ?? 0) - words;
  // 覚えた日ごとにまとめる
  const groups: { date: string; items: HistoryRow[] }[] = [];
  rows?.forEach((r) => {
    const g = groups.find((x) => x.date === r.mastered_at);
    if (g) g.items.push(r);
    else groups.push({ date: r.mastered_at, items: [r] });
  });

  return (
    <View style={styles.screen}>
      <TopBar title="覚えた履歴" backRoute="/phrase" />
      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xl }}>
        <View style={styles.summary}>
          <Text style={styles.summaryNum}>{rows?.length ?? 0}</Text>
          <Text style={styles.summaryUnit}>個 マスター</Text>
          <Text style={styles.summarySub}>
            フレーズ {phrases}　単語 {words}
          </Text>
        </View>

        {rows && rows.length === 0 && <Text style={styles.empty}>まだありません。フレーズや単語を3回「覚えた」にすると、ここに記録されます。</Text>}

        {groups.map((g) => (
          <View key={g.date}>
            <Text style={styles.date}>{g.date.replace(/-/g, '/')}</Text>
            <View style={styles.card}>
              {g.items.map((r, i) => (
                <View key={r.id} style={[styles.row, i > 0 && styles.rowBorder]}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.en}>{r.text}</Text>
                    {!!r.text_jp && <Text style={styles.jp}>{r.text_jp}</Text>}
                    <Text style={styles.meta}>
                      {r.content_type === 'word' ? '単語' : 'フレーズ'}・{r.folder_name}
                    </Text>
                  </View>
                  <Pressable style={styles.restoreBtn} onPress={() => restore(r)} hitSlop={6}>
                    <Text style={styles.restoreText}>復習に戻す</Text>
                  </Pressable>
                </View>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  summary: { margin: spacing.lg, backgroundColor: colors.navy, borderRadius: radius.lg, padding: spacing.lg, alignItems: 'center' },
  summaryNum: { color: colors.white, fontSize: 44, fontWeight: '800' },
  summaryUnit: { color: colors.coralLight, fontSize: 13, fontWeight: '700', marginTop: -4 },
  summarySub: { color: colors.white, fontSize: 12, marginTop: spacing.sm, opacity: 0.85 },
  empty: { marginHorizontal: spacing.lg, color: colors.textSecondary, fontSize: 13, lineHeight: 20, textAlign: 'center' },
  date: { marginHorizontal: spacing.lg, marginTop: spacing.md, marginBottom: spacing.xs, fontSize: 12, fontWeight: '700', color: colors.textSecondary },
  card: { marginHorizontal: spacing.lg, backgroundColor: colors.white, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md },
  rowBorder: { borderTopWidth: 1, borderTopColor: colors.border },
  en: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  jp: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  meta: { fontSize: 10, color: colors.textSecondary, marginTop: 4 },
  restoreBtn: { borderWidth: 1, borderColor: colors.coral, borderRadius: radius.pill, paddingVertical: 4, paddingHorizontal: spacing.sm },
  restoreText: { color: colors.coral, fontSize: 11, fontWeight: '600' },
});
