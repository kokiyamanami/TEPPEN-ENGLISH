import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { NativeScrollEvent, NativeSyntheticEvent, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { TopBar } from '../src/components/TopBar';
import { TtsLineButton } from '../src/components/TtsLineButton';
import { usePhrases } from '../src/store/PhraseContext';
import { useProfile } from '../src/store/ProfileContext';
import { colors, radius, spacing } from '../src/theme/colors';
import { voiceForGender } from '../src/utils/ttsVoice';

// screen key: phrase_folder
export default function PhraseFolderScreen() {
  const { folderId } = useLocalSearchParams<{ folderId?: string }>();
  const { folders, phrases, toggleLearned, openRegister, openEdit } = usePhrases();
  const { width } = useWindowDimensions();
  const pager = useRef<ScrollView>(null);
  const { profile } = useProfile();
  const voice = voiceForGender(profile.voiceGender);
  const folder = folders.find((f) => f.id === Number(folderId));
  const folderPhrases = phrases.filter((p) => p.folder_id === Number(folderId));

  const [index, setIndex] = useState(0);
  const [showJP, setShowJP] = useState(false);

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
        <Text style={styles.empty}>まだフレーズがありません</Text>
        <Pressable style={styles.addBtn} onPress={() => openRegister('', true, folder.id)}>
          <Ionicons name="add" size={14} color={colors.coral} />
          <Text style={styles.addBtnText}>このカテゴリにフレーズを追加</Text>
        </Pressable>
      </View>
    );
  }

  const safeIndex = Math.min(index, folderPhrases.length - 1);
  const current = folderPhrases[safeIndex];

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
        <Pressable onPress={() => router.push({ pathname: '/quiz', params: { folderId: folder.id } } as never)}>
          <Text style={styles.link}>クイズにする</Text>
        </Pressable>
      </View>

      <ScrollView ref={pager} horizontal pagingEnabled showsHorizontalScrollIndicator={false} onMomentumScrollEnd={onSwipeEnd}>
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
                  <Pressable style={styles.iconBtn} onPress={() => openEdit(p)} hitSlop={8}>
                    <Ionicons name="create-outline" size={16} color={colors.textPrimary} />
                  </Pressable>
                </View>
              )}
            </View>
          </View>
        ))}
      </ScrollView>
      <Text style={styles.swipeHint}>← スワイプで前後のフレーズへ →</Text>

      <Pressable
        style={[styles.learnedBtn, !!current.learned && styles.learnedBtnDone]}
        onPress={() => {
          toggleLearned(current.id);
          next();
        }}
      >
        <Text style={[styles.learnedText, !!current.learned && styles.learnedTextDone]}>覚えた ✓</Text>
      </Pressable>

      <Pressable style={styles.addBtn} onPress={() => openRegister('', true, folder.id)}>
        <Ionicons name="add" size={14} color={colors.coral} />
        <Text style={styles.addBtnText}>このカテゴリにフレーズを追加</Text>
      </Pressable>
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
  learnedBtn: { marginHorizontal: spacing.lg, backgroundColor: colors.navy, borderRadius: radius.pill, paddingVertical: spacing.md, alignItems: 'center' },
  learnedBtnDone: { backgroundColor: colors.success },
  learnedText: { color: colors.white, fontWeight: '700' },
  learnedTextDone: { color: colors.white },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, alignSelf: 'center', marginTop: spacing.lg },
  addBtnText: { color: colors.coral, fontSize: 12, fontWeight: '600' },
  empty: { textAlign: 'center', marginTop: spacing.xl, color: colors.textSecondary },
});
