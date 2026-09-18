export const BACKEND_URL = 'http://35.72.165.240:4000';

function getToken() {
  return localStorage.getItem('admin_token');
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`${BACKEND_URL}/api/admin${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  if (res.status === 401) {
    const body = await res.json().catch(() => ({}));
    // /loginへの401はログイン失敗の通常応答なので、セッション切れの強制リダイレクトはかけない
    if (path === '/login') {
      throw new Error(body.error || 'ログインに失敗しました');
    }
    localStorage.removeItem('admin_token');
    window.location.hash = '#/login';
    throw new Error(body.error || 'unauthorized');
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `request failed (${res.status})`);
  }
  return res.json();
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, data?: unknown) => request<T>(path, { method: 'POST', body: JSON.stringify(data ?? {}) }),
  patch: <T>(path: string, data?: unknown) => request<T>(path, { method: 'PATCH', body: JSON.stringify(data ?? {}) }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};

// multipart/form-data用: Content-Typeを固定しないので、requestではなく独自にfetchする
export async function uploadFile(path: string, field: string, file: File): Promise<{ url: string }> {
  const token = getToken();
  const formData = new FormData();
  formData.append(field, file);
  const res = await fetch(`${BACKEND_URL}/api/admin${path}`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: formData,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `upload failed (${res.status})`);
  }
  return res.json();
}

export { getToken };
