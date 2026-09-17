import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';

const POLL_INTERVAL_MS = 20000;

// 管理画面での編集がUserアプリに反映されるまでの待ち時間を短くするためのフック。
// タブ/画面が再マウントされなくても、アプリがフォアグラウンドに戻った時と
// 一定間隔ごとに自動でrefetchする（広告バナー・動画一覧など、管理画面が更新するデータ向け）
export function useLiveRefresh(refetch: () => void) {
  const refetchRef = useRef(refetch);
  refetchRef.current = refetch;

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') refetchRef.current();
    });
    const timer = setInterval(() => refetchRef.current(), POLL_INTERVAL_MS);
    return () => {
      sub.remove();
      clearInterval(timer);
    };
  }, []);
}
