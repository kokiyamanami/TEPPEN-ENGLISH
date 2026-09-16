import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable } from 'react-native';
import { TtsVoice, useTtsPlayer } from '../hooks/useTtsPlayer';
import { colors } from '../theme/colors';

export function TtsLineButton({
  text,
  voice = 'alloy',
  style,
  size = 13,
}: {
  text: string;
  voice?: TtsVoice;
  style?: object;
  size?: number;
}) {
  const { playing, preparing, toggle } = useTtsPlayer(text, voice);
  return (
    <Pressable style={style} onPress={toggle} hitSlop={8}>
      {preparing ? (
        <ActivityIndicator size="small" color={colors.textPrimary} />
      ) : (
        <Ionicons name={playing ? 'pause' : 'play'} size={size} color={colors.textPrimary} />
      )}
    </Pressable>
  );
}
