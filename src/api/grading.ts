import { BACKEND_URL } from '../config/api';
import { fetchWithTimeout, TIMEOUT_MS } from './http';
import { authHeaders } from './mobileAuth';

export type GradingResult = { transcript: string; pass: boolean; comment: string; recorded?: boolean };

// ミッション課題の合否をサーバー側で記録するための種別（自由練習などは指定しない）
export type GradingMission = 'daily:photo' | 'daily:question' | 'weekly' | 'monthly';

export async function submitForGrading(
  uri: string,
  taskLabel: string,
  promptEN: string,
  promptJP: string,
  mission?: GradingMission
): Promise<GradingResult> {
  const formData = new FormData();
  formData.append('audio', {
    uri,
    name: 'recording.m4a',
    type: 'audio/m4a',
  } as unknown as Blob);
  formData.append('taskLabel', taskLabel);
  formData.append('promptEN', promptEN);
  formData.append('promptJP', promptJP);
  if (mission) formData.append('mission', mission);

  // Content-Typeは指定しない: fetchがFormDataから正しいmultipart境界を自動付与する
  const res = await fetchWithTimeout(`${BACKEND_URL}/api/grade`, {
    method: 'POST',
    headers: await authHeaders(),
    body: formData,
  }, TIMEOUT_MS.grading);

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`grading request failed (${res.status}): ${text}`);
  }

  return res.json();
}
