import {
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';
import { useEffect, useState } from 'react';
import { Alert } from 'react-native';

export type AudioRecordPhase = 'idle' | 'recording' | 'recorded';

// 実マイク録音（expo-audio）。録音済みファイルはuriから取得しAI添削APIへ送信する
export function useAudioRecordFlow() {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder, 200);
  const [phase, setPhase] = useState<AudioRecordPhase>('idle');
  const [uri, setUri] = useState<string | null>(null);

  useEffect(() => {
    setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
  }, []);

  const start = async () => {
    const { granted } = await AudioModule.requestRecordingPermissionsAsync();
    if (!granted) {
      Alert.alert('マイクへのアクセスが必要です', '設定アプリからマイクの利用を許可してください。');
      return;
    }
    await recorder.prepareToRecordAsync();
    recorder.record();
    setPhase('recording');
  };

  const stop = async () => {
    await recorder.stop();
    setUri(recorder.uri ?? null);
    setPhase('recorded');
  };

  const retake = () => {
    setUri(null);
    setPhase('idle');
  };

  const reset = () => {
    setUri(null);
    setPhase('idle');
  };

  return {
    phase,
    seconds: Math.floor((recorderState.durationMillis ?? 0) / 1000),
    uri,
    start,
    stop,
    retake,
    reset,
  };
}
