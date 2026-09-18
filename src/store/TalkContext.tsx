import { createContext, ReactNode, useContext, useState } from 'react';
import { TALK_THREADS_SEED, TalkThread } from '../data/talk';

type TalkContextValue = {
  threads: Record<string, TalkThread>;
  markRead: (key: string) => void;
  sendMessage: (key: string, text: string) => void;
};

const TalkContext = createContext<TalkContextValue | null>(null);

const AI_REPLIES = [
  "That's a great point! Tell me more.",
  'Nice! How did that go?',
  "I see what you mean. Let's keep practicing that.",
  'Interesting — can you give me an example?',
];

export function TalkProvider({ children }: { children: ReactNode }) {
  const [threads, setThreads] = useState<Record<string, TalkThread>>(TALK_THREADS_SEED);

  const markRead = (key: string) => {
    setThreads((prev) => (prev[key]?.unread ? { ...prev, [key]: { ...prev[key], unread: 0 } } : prev));
  };

  const sendMessage = (key: string, text: string) => {
    const now = 'たった今';
    let kind: TalkThread['kind'] | undefined;
    setThreads((prev) => {
      const thread = prev[key];
      if (!thread) return prev;
      kind = thread.kind;
      const updated: TalkThread = { ...thread, messages: [...thread.messages, { from: 'me', text, time: now }] };
      return { ...prev, [key]: updated };
    });

    if (kind === 'ai') {
      setTimeout(() => {
        setThreads((prev) => {
          const thread = prev[key];
          if (!thread) return prev;
          const reply = AI_REPLIES[Math.floor(Math.random() * AI_REPLIES.length)];
          return { ...prev, [key]: { ...thread, messages: [...thread.messages, { from: 'them', text: reply, time: now }] } };
        });
      }, 900);
    }
  };

  return <TalkContext.Provider value={{ threads, markRead, sendMessage }}>{children}</TalkContext.Provider>;
}

export function useTalk() {
  const ctx = useContext(TalkContext);
  if (!ctx) throw new Error('useTalk must be used within TalkProvider');
  return ctx;
}
