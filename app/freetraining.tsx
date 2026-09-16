import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { TopBar } from '../src/components/TopBar';
import { colors, radius, spacing } from '../src/theme/colors';

const MENU: { label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { label: '音読', icon: 'book-outline' },
  { label: '英語ピッチ', icon: 'mic-outline' },
  { label: '発音練習', icon: 'megaphone-outline' },
  { label: 'Q&A練習', icon: 'help-circle-outline' },
  { label: 'ロールプレイ', icon: 'people-outline' },
  { label: 'シャドーイング', icon: 'repeat-outline' },
];

// screen key: freetraining
// 仕様書3.3: 現状はすべてdaily_task(質問回答タイプ)に遷移する簡易実装
export default function FreeTrainingScreen() {
  return (
    <ScrollView style={styles.screen}>
      <TopBar title="フリートレーニング" backRoute="/input_hub" />
      <View style={styles.list}>
        {MENU.map((m) => (
          <Pressable
            key={m.label}
            style={styles.card}
            onPress={() => router.push({ pathname: '/daily_task', params: { type: 'question', origin: 'freetraining' } } as never)}
          >
            <View style={styles.iconWrap}>
              <Ionicons name={m.icon} size={18} color={colors.navy} />
            </View>
            <Text style={styles.title}>{m.label}</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  list: { padding: spacing.lg, gap: spacing.sm },
  card: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.white, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.md },
  iconWrap: { width: 36, height: 36, borderRadius: radius.sm, backgroundColor: 'rgba(15,36,57,0.06)', alignItems: 'center', justifyContent: 'center' },
  title: { flex: 1, fontWeight: '600', color: colors.textPrimary },
});
