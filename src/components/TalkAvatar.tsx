import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { TalkThread } from '../data/talk';
import { colors } from '../theme/colors';

export function TalkAvatar({ thread, size = 44 }: { thread: TalkThread; size?: number }) {
  return (
    <View style={[styles.wrap, { width: size, height: size, borderRadius: size / 2, backgroundColor: thread.color }]}>
      {thread.kind === 'official' ? (
        <Ionicons name="megaphone" size={size * 0.45} color={colors.white} />
      ) : thread.kind === 'group' ? (
        <Ionicons name="people" size={size * 0.45} color={colors.white} />
      ) : (
        <Text style={[styles.letter, { fontSize: size * 0.4 }]}>{thread.letter}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
  letter: { color: colors.white, fontWeight: '700' },
});
