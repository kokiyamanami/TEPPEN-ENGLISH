import { BACKEND_URL } from '../config/api';

export type RankingUser = { name: string; weeklyStudyMin: number };
export type RankingGroup = { name: string; memberCount: number; weeklyStudyMin: number };

export async function fetchRanking(): Promise<{ users: RankingUser[]; groups: RankingGroup[] }> {
  const res = await fetch(`${BACKEND_URL}/api/ranking`);
  if (!res.ok) throw new Error(`ranking fetch failed (${res.status})`);
  return res.json();
}
