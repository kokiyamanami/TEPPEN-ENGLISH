import { BACKEND_URL } from '../config/api';
import { Profile } from '../store/ProfileContext';

export type GeneratedDialogue = {
  counterpart: string;
  lines: { from: 'me' | 'them'; text: string; textJP: string }[];
};

export async function generateDialogueRemote(scene: string, profile: Profile): Promise<GeneratedDialogue> {
  const res = await fetch(`${BACKEND_URL}/api/generate/dialogue`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ scene, profile }),
  });
  if (!res.ok) throw new Error(`generate dialogue failed (${res.status})`);
  return res.json();
}

export type GeneratedPresentation = { topic: string; paragraphsEN: string[]; paragraphsJP: string[] };

export async function generatePresentationRemote(profile: Profile, topic?: string): Promise<GeneratedPresentation> {
  const res = await fetch(`${BACKEND_URL}/api/generate/presentation`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ profile, topic }),
  });
  if (!res.ok) throw new Error(`generate presentation failed (${res.status})`);
  return res.json();
}
