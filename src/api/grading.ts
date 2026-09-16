import { BACKEND_URL } from '../config/api';

export type GradingResult = { transcript: string; pass: boolean; comment: string };

export async function submitForGrading(
  uri: string,
  taskLabel: string,
  promptEN: string,
  promptJP: string
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

  // Content-Typeは指定しない: fetchがFormDataから正しいmultipart境界を自動付与する
  const res = await fetch(`${BACKEND_URL}/api/grade`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`grading request failed (${res.status}): ${text}`);
  }

  return res.json();
}
