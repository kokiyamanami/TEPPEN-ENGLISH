import { TtsVoice } from '../hooks/useTtsPlayer';

// プロフィールの「読み上げ音声の性別」に応じてOpenAI TTSの声を選択
export function voiceForGender(voiceGender: string): TtsVoice {
  if (voiceGender === '女性') return 'nova';
  if (voiceGender === '男性') return 'onyx';
  return 'alloy';
}
