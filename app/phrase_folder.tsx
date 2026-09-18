import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Alert, NativeScrollEvent, NativeSyntheticEvent, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { TopBar } from '../src/components/TopBar';
import { TtsLineButton } from '../src/components/TtsLineButton';
import { MASTER_COUNT, usePhrases } from '../src/store/PhraseContext';
import { useProfile } from '../src/store/ProfileContext';
import { colors, radius, spacing } from '../src/theme/colors';
import { dateKey } from '../src/utils/dateHelpers';
import { voiceForGender } from '../src/utils/ttsVoice';

// screen key: phrase_folder
export default function PhraseFolderScreen() {
  const { folderId } = useLocalSearchParams<{ folderId?: string }>();
  const { folders, phrases, markLearned, openRegister, openEdit } = usePhrases();
  const { width } = useWindowDimensions();
  const pager = useRef<ScrollView>(null);
  const { profile } = useProfile();
  const voice = voiceForGender(profile.voiceGender);
  const folder = folders.find((f) => f.id === Number(folderId));
  const folderPhrases = phrases.filter((p) => p.folder_id === Number(folderId));

  const [index, setIndex] = useState(0);
  const [showJP, setShowJP] = useState(false);

  // 3回覚えたフレーズが一覧から外れたら、表示位置を合わせ直す
  useEffect(() => {
    const i = Math.min(index, Math.max(0, folderPhrases.length - 1));
    if (i !== index) setIndex(i);
    pager.current?.scrollTo({ x: i * width, animated: false });
  }, [folderPhrases.length]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!folder) {
    return (
      <View style={styles.screen}>
        <TopBar title="MYフレーズ" backRoute="/phrase" />
        <Text style={styles.empty}>フォルダが見つかりません</Text>
      </View>
    );
  }

  if (folderPhrases.length === 0) {
    return (
      <View style={styles.screen}>
        <TopBar title={folder.name} backRoute="/phrase" />
        <Text style={styles.empty}>表示できるフレーズがありません。{'\n'}3回覚えたものは「覚えた履歴」に移動します。</Text>
        {folder.source === 'custom' && (
          <Pressable style={styles.addBtn} onPress={() => openRegister('', true, folder.id)}>
            <Ionicons name="add" size={14} color={colors.coral} />
            <Text style={styles.addBtnText}>このフォルダにフレーズを追加</Text>
          </Pressable>
        )}
      </View>
    );
  }

  const safeIndex = Math.min(index, folderPhrases.length - 1);
  const current = folderPhrases[safeIndex];
  const doneToday = current.learned_on === dateKey(new Date());

  const goTo = (i: number) => {
    setShowJP(false);
    setIndex(i);
    pager.current?.scrollTo({ x: i * width, animated: true });
  };
  const next = () => goTo((safeIndex + 1) % folderPhrases.length);

  // 左右スワイプで前後のフレーズに移動する
  const onSwipeEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / width);
    if (i !== index) {
      setShowJP(false);
      setIndex(i);
    }
  };

  return (
    <View style={styles.screen}>
      <TopBar title={folder.name} backRoute="/phrase" />

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{folder.name}</Text>
      </View>

      <ScrollView ref={pager} style={{ flexGrow: 0 }} horizontal pagingEnabled showsHorizontalScrollIndicator={false} onMomentumScrollEnd={onSwipeEnd}>
        {folderPhrases.map((p, i) => (
          <View key={p.id} style={{ width }}>
            <View style={styles.flashCard}>
              <Text style={styles.progress}>
                {i + 1} / {folderPhrases.length}
              </Text>
              <Text style={styles.en}>&quot;{p.text}&quot;</Text>
              {i === safeIndex && showJP ? <Text style={styles.jp}>{p.text_jp || '（日本語訳は未登録です）'}</Text> : null}
              {i === safeIndex && (
                <View style={styles.rowBtns}>
                  <TtsLineButton text={p.text} voice={voice} style={styles.iconBtn} size={16} />
                  <Pressable style={styles.iconBtn} onPress={() => setShowJP((v) => !v)} hitSlop={8}>
                    <Ionicons name={showJP ? 'eye-off-outline' : 'eye-outline'} size={16} color={colors.textPrimary} />
                  </Pressable>
                  {folder.source === 'custom' && (
                    <Pressable style={styles.iconBtn} onPress={() => openEdit(p)} hitSlop={8}>
                      <Ionicons name="create-outline" size={16} color={colors.textPrimary} />
                    </Pressable>
                  )}
                </View>
              )}
            </View>
          </View>
        ))}
      </ScrollView>
      <Text style={styles.swipeHint}>← スワイプで前後のフレーズへ →</Text>

      <View style={styles.dots}>
        {Array.from({ length: MASTER_COUNT }, (_, i) => (
          <View key={i} style={[styles.dotItem, i < current.learned_count && styles.dotDone]} />
        ))}
        <Text style={styles.dotsText}>
          {current.learned_count}/{MASTER_COUNT}回　{MASTER_COUNT}回覚えると履歴に移ります
        </Text>
      </View>
      <Pressable
        style={[styles.learnedBtn, doneToday && styles.learnedBtnDone]}
        onPress={async () => {
          try {
            const r = await markLearned(current.id);
            if (r.mastered) Alert.alert('マスター！', `「${current.text}」を${MASTER_COUNT}回覚えました。履歴に移動しました。`);
            else next();
          } catch {
            Alert.alert('記録できませんでした', '通信状況を確認して、もう一度お試しください。');
          }
        }}
      >
        <Text style={styles.learnedText}>{doneToday ? '今日は覚えた済み ✓' : '覚えた ✓'}</Text>
      </Pressable>

      {folder.source === 'custom' && (
        <Pressable style={styles.addBtn} onPress={() => openRegister('', true, folder.id)}>
          <Ionicons name="add" size={14} color={colors.coral} />
          <Text style={styles.addBtnText}>このフォルダにフレーズを追加</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginHorizontal: spacing.lg, marginTop: spacing.lg },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  link: { color: colors.coral, fontSize: 12, fontWeight: '600' },
  flashCard: { margin: spacing.lg, backgroundColor: colors.white, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.xl, alignItems: 'center', minHeight: 160, justifyContent: 'center' },
  swipeHint: { textAlign: 'center', fontSize: 10, color: colors.textSecondary, marginBottom: spacing.md },
  progress: { position: 'absolute', top: spacing.md, left: spacing.md, fontSize: 11, color: colors.textSecondary },
  en: { fontSize: 16, fontWeight: '600', color: colors.textPrimary, textAlign: 'center' },
  jp: { fontSize: 13, color: colors.textSecondary, marginTop: spacing.md, textAlign: 'center' },
  rowBtns: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg },
  iconBtn: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  dots: { flexDirection: 'row', alignItems: 'center', gap: 6, marginHorizontal: spacing.lg, marginBottom: spacing.sm },
  dotItem: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.border, borderWidth: 1, borderColor: '#B8C4CE' },
  dotDone: { backgroundColor: colors.success, borderColor: colors.success },
  dotsText: { fontSize: 11, color: colors.textSecondary, marginLeft: 4 },
  learnedBtn: { marginHorizontal: spacing.lg, backgroundColor: colors.navy, borderRadius: radius.pill, paddingVertical: spacing.md, alignItems: 'center' },
  learnedBtnDone: { backgroundColor: colors.success },
  learnedText: { color: colors.white, fontWeight: '700' },
  learnedTextDone: { color: colors.white },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, alignSelf: 'center', marginTop: spacing.lg },
  addBtnText: { color: colors.coral, fontSize: 12, fontWeight: '600' },
  empty: { textAlign: 'center', marginTop: spacing.xl, color: colors.textSecondary },
});
