import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { usePhrases } from '../store/PhraseContext';
import { colors, radius, spacing } from '../theme/colors';

export function PhraseRegisterModal() {
  const { registerState, closeRegister, confirmRegister, folders, addFolder } = usePhrases();
  const [text, setText] = useState('');
  const [folderId, setFolderId] = useState<string | null>(null);
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  useEffect(() => {
    if (registerState.visible) {
      setText(registerState.text);
      setFolderId(registerState.folderId);
      setShowNewFolder(false);
      setNewFolderName('');
    }
  }, [registerState.visible, registerState.text, registerState.folderId]);

  const confirmNewFolder = () => {
    if (!newFolderName.trim()) return;
    const id = addFolder(newFolderName.trim());
    setFolderId(id);
    setShowNewFolder(false);
    setNewFolderName('');
  };

  return (
    <Modal visible={registerState.visible} transparent animationType="fade" onRequestClose={closeRegister}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <Text style={styles.title}>MYフレーズに登録</Text>

          {registerState.editable ? (
            <TextInput
              style={styles.textArea}
              multiline
              value={text}
              onChangeText={setText}
              placeholder="気になった表現を入力・貼り付け"
              placeholderTextColor={colors.textSecondary}
            />
          ) : (
            <View style={styles.textPreview}>
              <Text style={styles.textPreviewText}>{text}</Text>
            </View>
          )}

          <Text style={styles.label}>カテゴリを選ぶ</Text>
          <View style={styles.chipRow}>
            {folders.map((f) => (
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

          <View style={styles.rowBtn}>
            <Pressable style={styles.cancelBtn} onPress={closeRegister}>
              <Text style={styles.cancelText}>キャンセル</Text>
            </Pressable>
            <Pressable
              style={styles.confirmBtn}
              onPress={() => folderId && text.trim() && confirmRegister(text.trim(), folderId)}
            >
              <Text style={styles.confirmText}>登録する</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.white, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, padding: spacing.lg },
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
  rowBtn: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg },
  cancelBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.md, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border },
  cancelText: { color: colors.textPrimary, fontWeight: '600' },
  confirmBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.md, borderRadius: radius.pill, backgroundColor: colors.coral },
  confirmText: { color: colors.white, fontWeight: '700' },
});
