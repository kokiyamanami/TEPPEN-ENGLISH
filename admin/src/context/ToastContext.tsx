import { createContext, ReactNode, useCallback, useContext, useEffect, useRef, useState } from 'react';

const ToastContext = createContext<((msg: string) => void) | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [msg, setMsg] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback((m: string) => {
    setMsg(m);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setMsg(null), 3000);
  }, []);

  // 各ページのAPI呼び出しはcatchされていないため、失敗しても無反応にならないようここで通知する
  useEffect(() => {
    const onRejection = (e: PromiseRejectionEvent) => {
      e.preventDefault();
      const reason = e.reason;
      show(reason instanceof Error && reason.message ? reason.message : '通信に失敗しました');
    };
    window.addEventListener('unhandledrejection', onRejection);
    return () => window.removeEventListener('unhandledrejection', onRejection);
  }, [show]);

  return (
    <ToastContext.Provider value={show}>
      {children}
      {msg && <div className="toast">{msg}</div>}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
