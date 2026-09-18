import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { apiGet, apiPost } from '../api/mobileAuth';
import { TALK_THREADS_SEED, TalkMessage, TalkThread } from '../data/talk';
import { useSession } from './SessionContext';

// 実際のコーチとのやり取りは管理画面の生徒詳細（chat_messagesテーブル）と共有する
const COACH_CHAT_KEY = 'tutor';
// 運営からのお知らせスレッドは実際の announcements（公開済み・自分宛て）を表示する
const ANNOUNCE_KEY = 'announce';

type ChatMessageRow = { id: number; sender: string; text: string; time: string };
type AnnouncementRow = { id: number; title: string; body: string; created_at: string };

function formatChatTime(iso: string): string {
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

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
  const { isAuthenticated } = useSession();
  const [threads, setThreads] = useState<Record<string, TalkThread>>(TALK_THREADS_SEED);

  const loadCoachChat = () => {
    apiGet<ChatMessageRow[]>('/chat')
      .then((rows) => {
        const messages: TalkMessage[] = rows.map((r) => ({
          from: r.sender === 'student' ? 'me' : 'them',
          text: r.text,
          time: formatChatTime(r.time),
        }));
        setThreads((prev) => ({ ...prev, [COACH_CHAT_KEY]: { ...prev[COACH_CHAT_KEY], messages, unread: 0 } }));
      })
      .catch(() => {});
  };

  const loadAnnouncements = () => {
    apiGet<AnnouncementRow[]>('/announcements')
      .then((rows) => {
        const messages: TalkMessage[] = rows
          .slice()
          .reverse()
          .map((a) => ({ from: 'them', text: a.body ? `【${a.title}】\n${a.body}` : `【${a.title}】`, time: a.created_at }));
        setThreads((prev) => ({ ...prev, [ANNOUNCE_KEY]: { ...prev[ANNOUNCE_KEY], messages } }));
      })
      .catch(() => {});
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadCoachChat();
      loadAnnouncements();
    } else {
      setThreads(TALK_THREADS_SEED);
    }
  }, [isAuthenticated]);

  const markRead = (key: string) => {
    setThreads((prev) => (prev[key]?.unread ? { ...prev, [key]: { ...prev[key], unread: 0 } } : prev));
  };

  const sendMessage = (key: string, text: string) => {
    const now = 'たった今';

    if (key === COACH_CHAT_KEY) {
      setThreads((prev) => {
        const thread = prev[key];
        if (!thread) return prev;
        return { ...prev, [key]: { ...thread, messages: [...thread.messages, { from: 'me', text, time: now }] } };
      });
      apiPost('/chat', { text }).catch(() => {});
      return;
    }

    let kind: TalkThread['kind'] | undefined;
    let history: TalkMessage[] = [];
    setThreads((prev) => {
      const thread = prev[key];
      if (!thread) return prev;
      kind = thread.kind;
      const updated: TalkThread = { ...thread, messages: [...thread.messages, { from: 'me', text, time: now }] };
      history = updated.messages;
      return { ...prev, [key]: updated };
    });

    if (kind === 'ai') {
      const appendReply = (reply: string) =>
        setThreads((prev) => {
          const thread = prev[key];
          if (!thread) return prev;
          return { ...prev, [key]: { ...thread, messages: [...thread.messages, { from: 'them', text: reply, time: now }] } };
        });
      // 実際のAI返信。失敗時（オフライン等）は定型の返信にフォールバック
      apiPost<{ reply: string }>('/chat-ai', { persona: key, history })
        .then((res) => appendReply(res.reply || AI_REPLIES[0]))
        .catch(() => appendReply(AI_REPLIES[Math.floor(Math.random() * AI_REPLIES.length)]));
    }
  };

  return <TalkContext.Provider value={{ threads, markRead, sendMessage }}>{children}</TalkContext.Provider>;
}

export function useTalk() {
  const ctx = useContext(TalkContext);
  if (!ctx) throw new Error('useTalk must be used within TalkProvider');
  return ctx;
}
