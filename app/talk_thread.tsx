import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { TalkAvatar } from '../src/components/TalkAvatar';
import { useTalk } from '../src/store/TalkContext';
import { colors, radius, spacing } from '../src/theme/colors';

// screen key: talk_thread
export default function TalkThreadScreen() {
  const { key } = useLocalSearchParams<{ key: string }>();
  const { threads, markRead, sendMessage } = useTalk();
  const thread = threads[key ?? ''];
  const [input, setInput] = useState('');
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (key) markRead(key);
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!thread) {
    return (
      <View style={styles.screen}>
        <Text style={styles.empty}>トークが見つかりません</Text>
      </View>
    );
  }

  const send = () => {
    if (!input.trim()) return;
    sendMessage(thread.key, input.trim());
    setInput('');
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  };

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.topbar}>
        <Pressable style={styles.backBtn} onPress={() => router.replace('/(tabs)/talk_list')} hitSlop={12}>
          <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
        </Pressable>
        <Pressable style={styles.headerCenter} onPress={() => router.push({ pathname: '/talk_profile', params: { key: thread.key } } as never)}>
          <TalkAvatar thread={thread} size={30} />
          <Text style={styles.headerName}>{thread.name}</Text>
        </Pressable>
        {thread.callable && (
          <Pressable style={styles.callBtn} onPress={() => router.push({ pathname: '/talk_call', params: { key: thread.key } } as never)}>
            <Ionicons name="call" size={18} color={colors.coral} />
          </Pressable>
        )}
      </View>

      <ScrollView ref={scrollRef} style={styles.thread} contentContainerStyle={styles.threadContent} onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}>
        {thread.messages.map((m, i) => (
          <View key={i} style={[styles.bubbleRow, m.from === 'me' && styles.bubbleRowMe]}>
            {thread.kind === 'group' && m.from === 'them' && m.sender ? <Text style={styles.sender}>{m.sender}</Text> : null}
            <View style={[styles.bubble, m.from === 'me' && styles.bubbleMe]}>
              <Text style={[styles.bubbleText, m.from === 'me' && styles.bubbleTextMe]}>{m.text}</Text>
            </View>
            <Text style={styles.time}>{m.time}</Text>
          </View>
        ))}
      </ScrollView>

      {thread.kind === 'official' ? (
        <View style={styles.officialNote}>
          <Ionicons name="megaphone-outline" size={13} color={colors.textSecondary} />
          <Text style={styles.officialNoteText}>運営からの一方向のお知らせチャンネルです</Text>
        </View>
      ) : (
        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder={`${thread.name}にメッセージ`}
            placeholderTextColor={colors.textSecondary}
          />
          <Pressable style={styles.sendBtn} onPress={send}>
            <Ionicons name="send" size={16} color={colors.white} />
          </Pressable>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  topbar: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.sm, paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.white },
  backBtn: { padding: spacing.xs },
  headerCenter: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  headerName: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  callBtn: { padding: spacing.xs },
  thread: { flex: 1 },
  threadContent: { padding: spacing.lg, gap: spacing.sm },
  bubbleRow: { alignItems: 'flex-start' },
  bubbleRowMe: { alignItems: 'flex-end' },
  sender: { fontSize: 10, color: colors.textSecondary, marginBottom: 2, marginLeft: spacing.xs },
  bubble: { maxWidth: '80%', backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.sm },
  bubbleMe: { backgroundColor: colors.navy, borderColor: colors.navy },
  bubbleText: { fontSize: 13, color: colors.textPrimary, lineHeight: 18 },
  bubbleTextMe: { color: colors.white },
  time: { fontSize: 9, color: colors.textSecondary, marginTop: 2, marginHorizontal: spacing.xs },
  officialNote: { flexDirection: 'row', alignItems: 'center', gap: 4, justifyContent: 'center', padding: spacing.md, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.white },
  officialNoteText: { fontSize: 11, color: colors.textSecondary },
  inputBar: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.white },
  input: { flex: 1, backgroundColor: colors.background, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, fontSize: 13, color: colors.textPrimary },
  sendBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.coral, alignItems: 'center', justifyContent: 'center' },
  empty: { textAlign: 'center', marginTop: spacing.xl, color: colors.textSecondary },
});
