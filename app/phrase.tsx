import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { TopBar } from '../src/components/TopBar';
import { PhraseFolderSource, usePhrases } from '../src/store/PhraseContext';
import { colors, radius, spacing } from '../src/theme/colors';
import { useTopInset } from '../src/hooks/useTopInset';

const SECTIONS: { source: PhraseFolderSource; title: string; desc: string; empty: string }[] = [
  { source: 'curated', title: 'カスタマイズ教材', desc: 'あなたの職業・趣味・性格・経歴に合わせて、運営が選んだ単語です', empty: 'プロフィールに合わせた教材が用意され次第、ここに表示されます' },
  { source: 'official', title: '運営提供', desc: 'あなたの英語レベルに合わせた、覚えてほしい単語・フレーズです', empty: 'あなたのレベルの教材が用意され次第、ここに表示されます' },
  { source: 'custom', title: 'マイフォルダ', desc: '自由に追加・編集・削除できる、あなた専用のフォルダです', empty: '' },
];

// screen key: phrase
export default function PhraseScreen() {
  const topInset = useTopInset();
  const { folders, folderCount, addFolder, deleteFolder, renameFolder, openRegister } = usePhrases();
  const [renameTarget, setRenameTarget] = useState<{ id: number; name: string } | null>(null);
  const [showAddFolder, setShowAddFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);

  const confirmAddFolder = () => {
    if (!newFolderName.trim()) return;
    if (renameTarget) renameFolder(renameTarget.id, newFolderName.trim());
    else addFolder(newFolderName.trim());
    setRenameTarget(null);
    setNewFolderName('');
    setShowAddFolder(false);
  };

  return (
    <ScrollView style={styles.screen}>
      <TopBar title="MYフレーズ" backRoute="/(tabs)/home" />

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>MYフレーズ</Text>
        <Pressable onPress={() => openRegister('', true)}>
          <Text style={styles.addLink}>＋ フレーズを追加</Text>
        </Pressable>
      </View>

      {SECTIONS.map((sec) => {
        const list = folders.filter((f) => f.source === sec.source);
        return (
          <View key={sec.source}>
            <Text style={styles.groupTitle}>{sec.title}</Text>
            <Text style={styles.groupDesc}>{sec.desc}</Text>
            <View style={styles.grid}>
              {list.map((f) => (
                <Pressable
                  key={f.id}
                  style={styles.folderCard}
                  onPress={() => router.push({ pathname: '/phrase_folder', params: { folderId: f.id } } as never)}
                >
                  {f.source === 'custom' && (
                    <>
                      <Pressable style={styles.delBtn} onPress={() => setDeleteTarget(f.id)} hitSlop={8}>
                        <Ionicons name="close" size={12} color={colors.textSecondary} />
                      </Pressable>
                      <Pressable
                        style={[styles.delBtn, { right: spacing.xs + 26 }]}
                        onPress={() => {
                          setRenameTarget({ id: f.id, name: f.name });
                          setNewFolderName(f.name);
                          setShowAddFolder(true);
                        }}
                        hitSlop={8}
                      >
                        <Ionicons name="create-outline" size={12} color={colors.textSecondary} />
                      </Pressable>
                    </>
                  )}
                  <Text style={styles.badge}>{folderCount(f.id)}</Text>
                  <Text style={styles.folderTitle}>{f.name}</Text>
                  <Text style={styles.folderSub}>{sec.title}</Text>
                </Pressable>
              ))}
              {sec.source === 'custom' && (
                <Pressable
                  style={[styles.folderCard, styles.addCard]}
                  onPress={() => {
                    setRenameTarget(null);
                    setNewFolderName('');
                    setShowAddFolder(true);
                  }}
                >
                  <Ionicons name="add-circle-outline" size={22} color={colors.textSecondary} />
                  <Text style={styles.folderTitle}>新規フォルダ</Text>
                </Pressable>
              )}
              {list.length === 0 && sec.source !== 'custom' && <Text style={styles.emptyGroup}>{sec.empty}</Text>}
            </View>
          </View>
        );
      })}

      <Modal visible={showAddFolder} transparent animationType="slide" onRequestClose={() => setShowAddFolder(false)}>
        <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={[styles.sheet, { paddingTop: topInset + spacing.lg }]}>
            <Text style={styles.sheetTitle}>{renameTarget ? 'フォルダ名を変更' : '新しいフォルダを追加'}</Text>
            <Text style={styles.sheetDesc}>フレーズを整理するための、あなた専用のフォルダです</Text>
            <TextInput
              style={styles.input}
              value={newFolderName}
              onChangeText={setNewFolderName}
              placeholder="例）会議で使える表現"
              placeholderTextColor={colors.textSecondary}
            />
            <View style={styles.sheetRow}>
              <Pressable style={styles.cancelBtn} onPress={() => setShowAddFolder(false)}>
                <Text style={styles.cancelText}>キャンセル</Text>
              </Pressable>
              <Pressable style={styles.confirmBtn} onPress={confirmAddFolder}>
                <Text style={styles.confirmText}>{renameTarget ? '保存する' : '追加する'}</Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal visible={!!deleteTarget} transparent animationType="fade" onRequestClose={() => setDeleteTarget(null)}>
        <View style={styles.overlay}>
          <View style={[styles.sheet, { paddingTop: topInset + spacing.lg }]}>
            <Text style={styles.sheetTitle}>このフォルダを削除しますか？</Text>
            <Text style={styles.sheetDesc}>中のフレーズもまとめて削除されます。この操作は元に戻せません。</Text>
            <View style={styles.sheetRow}>
              <Pressable style={styles.cancelBtn} onPress={() => setDeleteTarget(null)}>
                <Text style={styles.cancelText}>キャンセル</Text>
              </Pressable>
              <Pressable
                style={styles.deleteBtn}
                onPress={() => {
                  if (deleteTarget) deleteFolder(deleteTarget);
                  setDeleteTarget(null);
                }}
              >
                <Text style={styles.confirmText}>削除する</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginHorizontal: spacing.lg, marginTop: spacing.lg },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  groupTitle: { fontSize: 13, fontWeight: '700', color: colors.textPrimary, marginHorizontal: spacing.lg, marginTop: spacing.lg },
  groupDesc: { fontSize: 11, color: colors.textSecondary, marginHorizontal: spacing.lg, marginTop: 2 },
  emptyGroup: { fontSize: 11, color: colors.textSecondary, paddingVertical: spacing.sm },
  addLink: { color: colors.coral, fontSize: 12, fontWeight: '600' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  folderCard: {
    width: '47%',
    aspectRatio: 1.3,
    backgroundColor: colors.white,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    justifyContent: 'center',
  },
  addCard: { alignItems: 'center', justifyContent: 'center', gap: spacing.xs, borderStyle: 'dashed' },
  delBtn: { position: 'absolute', top: spacing.xs, right: spacing.xs, width: 20, height: 20, borderRadius: 10, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
  badge: { fontSize: 11, color: colors.textSecondary },
  folderTitle: { fontSize: 13, fontWeight: '700', color: colors.textPrimary, marginTop: spacing.xs },
  folderSub: { fontSize: 10, color: colors.textSecondary, marginTop: 2 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-start' },
  sheet: { backgroundColor: colors.white, borderBottomLeftRadius: radius.lg, borderBottomRightRadius: radius.lg, padding: spacing.lg },
  sheetTitle: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
  sheetDesc: { fontSize: 12, color: colors.textSecondary, marginTop: spacing.xs, lineHeight: 18 },
  input: { marginTop: spacing.md, borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, fontSize: 13, color: colors.textPrimary },
  sheetRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg },
  cancelBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.md, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border },
  cancelText: { color: colors.textPrimary, fontWeight: '600' },
  confirmBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.md, borderRadius: radius.pill, backgroundColor: colors.coral },
  deleteBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.md, borderRadius: radius.pill, backgroundColor: colors.danger },
  confirmText: { color: colors.white, fontWeight: '700' },
});
