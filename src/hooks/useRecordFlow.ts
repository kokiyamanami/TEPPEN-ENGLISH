import { useEffect, useRef, useState } from 'react';

export type RecordPhase = 'idle' | 'recording' | 'recorded';

// TODO(Phase10): expo-audioによる実マイク録音に置き換え。現状はタイマー表示のみのモック
export function useRecordFlow() {
  const [phase, setPhase] = useState<RecordPhase>('idle');
  const [seconds, setSeconds] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (phase === 'recording') {
      timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase]);

  const start = () => {
    setSeconds(0);
    setPhase('recording');
  };
  const stop = () => setPhase('recorded');
  const retake = () => {
    setSeconds(0);
    setPhase('idle');
  };
  const reset = () => {
    setSeconds(0);
    setPhase('idle');
  };

  return { phase, seconds, start, stop, retake, reset };
}

export function formatCallTime(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}
