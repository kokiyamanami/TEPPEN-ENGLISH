import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { useEffect, useRef, useState } from 'react';
import { BACKEND_URL } from '../config/api';

export type TtsVoice = 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';

// TTS音声を初回再生時に遅延生成（サーバー側でキャッシュ）し、expo-audioで実際に再生する
export function useTtsPlayer(text: string, voice: TtsVoice = 'alloy') {
  const [uri, setUri] = useState<string | null>(null);
  const [preparing, setPreparing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const autoPlayRef = useRef(false);

  const player = useAudioPlayer(uri);
  const status = useAudioPlayerStatus(player);

  useEffect(() => {
    if (autoPlayRef.current && status.isLoaded) {
      autoPlayRef.current = false;
      player.play();
    }
  }, [status.isLoaded, player]);

  const prepare = async (): Promise<string | null> => {
    if (uri) return uri;
    setPreparing(true);
    setError(null);
    try {
      const res = await fetch(`${BACKEND_URL}/api/tts/prepare`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voice }),
      });
      if (!res.ok) throw new Error(`tts prepare failed (${res.status})`);
      const data = await res.json();
      const fullUri = `${BACKEND_URL}${data.url}`;
      setUri(fullUri);
      return fullUri;
    } catch (e) {
      setError('音声の生成に失敗しました');
      return null;
    } finally {
      setPreparing(false);
    }
  };

  const toggle = async () => {
    if (!uri) {
      autoPlayRef.current = true;
      await prepare();
      return;
    }
    if (status.playing) {
      player.pause();
    } else {
      if (status.didJustFinish || status.currentTime >= (status.duration || 0)) {
        player.seekTo(0);
      }
      player.play();
    }
  };

  const seekBy = (deltaSeconds: number) => {
    if (!status.isLoaded) return;
    const next = Math.max(0, Math.min(status.duration || 0, status.currentTime + deltaSeconds));
    player.seekTo(next);
  };

  const setSpeed = (rate: number) => {
    player.setPlaybackRate(rate);
  };

  return {
    playing: status.playing,
    preparing,
    error,
    currentTime: status.currentTime,
    duration: status.duration,
    playbackRate: status.playbackRate || 1,
    toggle,
    seekBy,
    setSpeed,
  };
}
