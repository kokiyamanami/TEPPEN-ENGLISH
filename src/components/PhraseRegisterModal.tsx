import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { usePhrases } from '../store/PhraseContext';
import { colors, radius, spacing } from '../theme/colors';
import { useTopInset } from '../hooks/useTopInset';

export function PhraseRegisterModal() {
  const topInset = useTopInset();
  const { registerState, closeRegister, confirmRegister, folders, addFolder, deletePhrase, setRegisterType } = usePhrases();
  const type = registerState.contentType;
  const myFolders = folders.filter((f) => f.source === 'custom' && f.content_type === type);
  const [text, setText] = useState('');
  const [textJP, setTextJP] = useState('');
  const [folderId, setFolderId] = useState<number | null>(null);
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  useEffect(() => {
    if (registerState.visible) {
      setText(registerState.text);
      setTextJP(registerState.textJP);
      setFolderId(registerState.folderId);
      setShowNewFolder(false);
      setNewFolderName('');
    }
  }, [registerState.visible, registerState.text, registerState.textJP, registerState.folderId]);

  const confirmNewFolder = async () => {
    if (!newFolderName.trim()) return;
    try {
      const id = await addFolder(newFolderName.trim(), type);
      setFolderId(id);
      setShowNewFolder(false);
      setNewFolderName('');
    } catch {
      Alert.alert('フォルダを作成できませんでした', '通信状況を確認して、もう一度お試しください。');
    }
  };

  return (
    <Modal visible={registerState.visible} transparent animationType="slide" onRequestClose={closeRegister}>
      <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[styles.sheet, { paddingTop: topInset + spacing.lg }]}>
          <Text style={styles.title}>{registerState.editId !== null ? 'フレーズを編集' : 'MYフレーズに登録'}</Text>

          {registerState.editable ? (
            <TextInput
              style={styles.textArea}
              multiline
              value={text}
              onChangeText={setText}
              placeholder={type === 'word' ? '英単語を入力' : '英語のフレーズを入力・貼り付け'}
              placeholderTextColor={colors.textSecondary}
            />
          ) : (
            <View style={styles.textPreview}>
              <Text style={styles.textPreviewText}>{text}</Text>
            </View>
          )}

          <TextInput
            style={[styles.textArea, { minHeight: 44 }]}
            multiline
            value={textJP}
            onChangeText={setTextJP}
            placeholder="日本語訳（任意）"
            placeholderTextColor={colors.textSecondary}
          />

          {registerState.editId === null && (
            <View style={styles.typeRow}>
              {(['phrase', 'word'] as const).map((t) => (
                <Pressable key={t} style={[styles.typeBtn, type === t && styles.typeBtnSel]} onPress={() => setRegisterType(t)}>
                  <Text style={[styles.typeText, type === t && styles.typeTextSel]}>{t === 'phrase' ? 'フレーズ' : '単語'}</Text>
                </Pressable>
              ))}
            </View>
          )}
          <Text style={styles.label}>マイフォルダを選ぶ</Text>
          <View style={styles.chipRow}>
            {myFolders.map((f) => (
              <Pressable
                key={f.id}
                style={[styles.chip, folderId === f.id && styles.chipSel]}
                onPress={() => setFolderId(f.id)}
              >
                <Text style={[styles.chipText, folderId === f.id && styles.chipTextSel]}>{f.name}</Text>
              </Pressable>
            ))}
            <Pressable style={[styles.chip, styles.chipAdd]} onPress={() => setShowNewFolder(true)}>
              <Ionicons name="add" size={13} color={colors.textPrimary} />
              <Text style={styles.chipText}>新規</Text>
            </Pressable>
          </View>

          {showNewFolder && (
            <View style={styles.newFolderRow}>
              <TextInput
                style={styles.newFolderInput}
                value={newFolderName}
                onChangeText={setNewFolderName}
                placeholder="新しいカテゴリ名"
                placeholderTextColor={colors.textSecondary}
              />
              <Pressable style={styles.newFolderBtn} onPress={confirmNewFolder}>
                <Text style={styles.newFolderBtnText}>追加</Text>
              </Pressable>
            </View>
          )}

          {registerState.editId !== null && (
            <Pressable
              style={styles.deleteLink}
              onPress={() =>
                Alert.alert('このフレーズを削除しますか？', '元に戻せません。', [
                  { text: 'キャンセル', style: 'cancel' },
                  {
                    text: '削除する',
                    style: 'destructive',
                    onPress: () => {
                      deletePhrase(registerState.editId as number);
                      closeRegister();
                    },
                  },
                ])
              }
            >
              <Text style={styles.deleteLinkText}>このフレーズを削除</Text>
            </Pressable>
          )}

          <View style={styles.rowBtn}>
            <Pressable style={styles.cancelBtn} onPress={closeRegister}>
              <Text style={styles.cancelText}>キャンセル</Text>
            </Pressable>
            <Pressable
              style={styles.confirmBtn}
              onPress={() => folderId !== null && text.trim() && confirmRegister(text.trim(), folderId, textJP.trim())}
            >
              <Text style={styles.confirmText}>{registerState.editId !== null ? '保存する' : '登録する'}</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-start' },
  sheet: { backgroundColor: colors.white, borderBottomLeftRadius: radius.lg, borderBottomRightRadius: radius.lg, padding: spacing.lg },
  title: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
  textArea: { marginTop: spacing.md, borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, padding: spacing.sm, minHeight: 60, fontSize: 13, color: colors.textPrimary, textAlignVertical: 'top' },
  textPreview: { marginTop: spacing.md, backgroundColor: colors.background, borderRadius: radius.sm, padding: spacing.sm },
  textPreviewText: { fontSize: 13, color: colors.textPrimary, lineHeight: 18 },
  label: { fontSize: 12, color: colors.textSecondary, marginTop: spacing.md, marginBottom: spacing.xs },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  chip: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill, paddingVertical: 6, paddingHorizontal: spacing.sm },
  chipSel: { backgroundColor: colors.navy, borderColor: colors.navy },
  chipAdd: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  chipText: { fontSize: 12, color: colors.textPrimary },
  chipTextSel: { color: colors.white },
  newFolderRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  newFolderInput: { flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, paddingHorizontal: spacing.sm, fontSize: 13, color: colors.textPrimary },
  newFolderBtn: { backgroundColor: colors.coral, borderRadius: radius.sm, paddingHorizontal: spacing.md, alignItems: 'center', justifyContent: 'center' },
  newFolderBtnText: { color: colors.white, fontWeight: '700', fontSize: 12 },
  typeRow: { flexDirection: 'row', gap: spacing.xs, marginTop: spacing.md },
  typeBtn: { flex: 1, alignItems: 'center', paddingVertical: 6, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border },
  typeBtnSel: { backgroundColor: colors.navy, borderColor: colors.navy },
  typeText: { fontSize: 12, color: colors.textPrimary, fontWeight: '600' },
  typeTextSel: { color: colors.white },
  deleteLink: { alignSelf: 'flex-start', marginTop: spacing.md },
  deleteLinkText: { color: colors.danger, fontSize: 12, fontWeight: '600' },
  rowBtn: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg },
  cancelBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.md, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border },
  cancelText: { color: colors.textPrimary, fontWeight: '600' },
  confirmBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.md, borderRadius: radius.pill, backgroundColor: colors.coral },
  confirmText: { color: colors.white, fontWeight: '700' },
});
