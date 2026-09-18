import { Alert, Modal, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useGoals } from '../store/GoalsContext';
import { colors, radius, spacing } from '../theme/colors';
import { addDays, dateKey } from '../utils/dateHelpers';

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'];

// 休息日・旅行・体調不良の日を「お休み」にして、連続達成を途切れさせないための設定画面
export function RestDaysModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { restDays, restLimitPerMonth, setRestDay } = useGoals();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayKey = dateKey(today);
  const days = Array.from({ length: 10 }, (_, i) => addDays(today, i - 2));
  const usedThisMonth = restDays.filter((d) => d.startsWith(todayKey.slice(0, 7))).length;

  const toggle = async (date: string, on: boolean) => {
    try {
      await setRestDay(date, on);
    } catch (e) {
      Alert.alert('お休みを変更できませんでした', (e as Error).message === 'rejected' ? `お休みは月${restLimitPerMonth}回までです。` : '通信状況を確認してください。');
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.card} onPress={() => {}}>
          <Text style={styles.title}>お休みを設定</Text>
          <Text style={styles.desc}>
            お休みの日は連続達成が途切れません（日数には数えません）。月{restLimitPerMonth}回まで、2日前から先の日に設定できます。今月の使用: {usedThisMonth}/{restLimitPerMonth}回
          </Text>
          <ScrollView style={{ maxHeight: 360 }}>
            {days.map((d) => {
              const k = dateKey(d);
              const on = restDays.includes(k);
              const locked = on && k < todayKey;
              return (
                <View key={k} style={styles.row}>
                  <Text style={styles.rowLabel}>
                    {d.getMonth() + 1}/{d.getDate()}（{WEEKDAYS[d.getDay()]}）{k === todayKey ? ' 今日' : ''}
                  </Text>
                  <Switch value={on} disabled={locked} onValueChange={(v) => toggle(k, v)} trackColor={{ true: colors.coral }} />
                </View>
              );
            })}
          </ScrollView>
          <Pressable style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeText}>閉じる</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: spacing.lg },
  card: { backgroundColor: colors.white, borderRadius: radius.lg, padding: spacing.lg },
  title: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
  desc: { fontSize: 11, color: colors.textSecondary, lineHeight: 17, marginTop: spacing.xs, marginBottom: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  rowLabel: { fontSize: 14, color: colors.textPrimary },
  closeBtn: { alignSelf: 'center', marginTop: spacing.md, paddingVertical: spacing.sm, paddingHorizontal: spacing.lg },
  closeText: { color: colors.coral, fontWeight: '700' },
});
