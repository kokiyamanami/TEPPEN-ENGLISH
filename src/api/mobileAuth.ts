import AsyncStorage from '@react-native-async-storage/async-storage';
import { BACKEND_URL } from '../config/api';

const TOKEN_KEY = 'teppen_token';

export async function getStoredToken(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export async function storeToken(token: string) {
  await AsyncStorage.setItem(TOKEN_KEY, token);
}

export async function clearToken() {
  await AsyncStorage.removeItem(TOKEN_KEY);
}

export async function signup(email: string, password: string): Promise<string> {
  const res = await fetch(`${BACKEND_URL}/api/mobile/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'サインアップに失敗しました');
  await storeToken(data.token);
  return data.token;
}

export async function login(email: string, password: string): Promise<string> {
  const res = await fetch(`${BACKEND_URL}/api/mobile/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'ログインに失敗しました');
  await storeToken(data.token);
  return data.token;
}

export async function authedFetch(path: string, options: RequestInit = {}) {
  const token = await getStoredToken();
  const res = await fetch(`${BACKEND_URL}/api/mobile${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  return res;
}

export async function apiGet<T>(path: string): Promise<T> {
  const res = await authedFetch(path);
  if (!res.ok) throw new Error(`GET ${path} failed (${res.status})`);
  return res.json();
}

export async function apiPost<T>(path: string, data?: unknown): Promise<T> {
  const res = await authedFetch(path, { method: 'POST', body: JSON.stringify(data ?? {}) });
  if (!res.ok) throw new Error(`POST ${path} failed (${res.status})`);
  return res.json();
}

export async function apiPatch<T>(path: string, data?: unknown): Promise<T> {
  const res = await authedFetch(path, { method: 'PATCH', body: JSON.stringify(data ?? {}) });
  if (!res.ok) throw new Error(`PATCH ${path} failed (${res.status})`);
  return res.json();
}

export async function apiDelete<T>(path: string): Promise<T> {
  const res = await authedFetch(path, { method: 'DELETE' });
  if (!res.ok) throw new Error(`DELETE ${path} failed (${res.status})`);
  return res.json();
}

// mimeType文字列 -> 拡張子・安全なContent-Typeの対応表。
// URIの末尾を文字列パースして拡張子を推測すると、Androidのcontent://URIなど
// 拡張子を含まないURIで壊れたヘッダーになりアップロードが失敗するため、
// expo-image-pickerが返すmimeTypeを優先的に使う
const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/heic': 'heic',
  'image/heif': 'heic',
};

export async function uploadAvatar(uri: string, mimeType?: string | null, fileName?: string | null): Promise<{ avatarUrl: string }> {
  const token = await getStoredToken();
  const formData = new FormData();

  const normalizedMime = mimeType && MIME_TO_EXT[mimeType.toLowerCase()] ? mimeType.toLowerCase() : null;
  const extFromFileName = fileName?.includes('.') ? fileName.split('.').pop()?.toLowerCase() : null;
  const ext = normalizedMime ? MIME_TO_EXT[normalizedMime] : extFromFileName && /^[a-z0-9]{2,4}$/.test(extFromFileName) ? extFromFileName : 'jpg';
  const type = normalizedMime || 'image/jpeg';

  formData.append('avatar', {
    uri,
    name: `avatar.${ext}`,
    type,
  } as unknown as Blob);

  // Content-Typeは指定しない: fetchがFormDataから正しいmultipart境界を自動付与する
  const res = await fetch(`${BACKEND_URL}/api/mobile/avatar`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: formData,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`avatar upload failed (${res.status}): ${text}`);
  }
  return res.json();
}
