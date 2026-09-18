import { useEffect, useMemo, useState } from 'react';
import { apiGet } from '../api/mobileAuth';
import { FREE_PRACTICE_LOG_MOCK, SpeakingLogItem } from '../data/records';

type MissionHistory = {
  daily: { date: string; type: string; pass: number }[];
  weekly: { week_start: string; pass: number; date: string }[];
  monthly: { month: string; pass: number; date: string }[];
};

function parseYmd(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

// Daily/Weekly/Monthlyミッションの実績（実データ）とフリー練習ログ（永続化未実装のためモック）を
// まとめて日付降順にした「スピーキング履歴」。records画面・全件表示画面の両方から使う
export function useSpeakingLog(): SpeakingLogItem[] {
  const [missionLog, setMissionLog] = useState<SpeakingLogItem[]>([]);

  useEffect(() => {
    apiGet<MissionHistory>('/mission-history')
      .then((res) => {
        const daily: SpeakingLogItem[] = res.daily.map((d) => ({
          date: parseYmd(d.date),
          title: `Dailyミッション（${d.type === 'photo' ? '写真描写' : '質問回答'}）`,
          kind: 'daily',
          pass: !!d.pass,
        }));
        const weekly: SpeakingLogItem[] = res.weekly.map((w) => ({
          date: parseYmd(w.date),
          title: `Weeklyミッション（${w.week_start}の週）`,
          kind: 'weekly',
          pass: !!w.pass,
        }));
        const monthly: SpeakingLogItem[] = res.monthly.map((m) => ({
          date: parseYmd(m.date),
          title: `Monthlyミッション（${m.month}）`,
          kind: 'monthly',
          pass: !!m.pass,
        }));
        setMissionLog([...daily, ...weekly, ...monthly]);
      })
      .catch(() => {});
  }, []);

  return useMemo(
    () => [...FREE_PRACTICE_LOG_MOCK, ...missionLog].sort((a, b) => b.date.getTime() - a.date.getTime()),
    [missionLog]
  );
}
