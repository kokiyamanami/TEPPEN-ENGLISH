// EC2開発サーバーのURL。本番ではビルド時に VITE_BACKEND_URL で上書きする
export const BACKEND_URL: string = import.meta.env.VITE_BACKEND_URL || 'http://35.72.165.240:4000';

// 通信にタイムアウトを付ける（サーバーが詰まったときに、画面が固まり続けないように）
async function fetchWithTimeout(input: string, init: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } catch (e) {
    if ((e as Error).name === 'AbortError') throw new Error('通信がタイムアウトしました');
    throw e;
  } finally {
    clearTimeout(timer);
  }
}

function getToken() {
  return localStorage.getItem('admin_token');
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetchWithTimeout(
    `${BACKEND_URL}/api/admin${path}`,
    {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    },
    30_000
  );
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
    // 初期パスワードのままのアカウントは、パスワードを変更するまで他の操作ができない
    if (res.status === 403 && body.error === 'password_change_required') {
      window.location.hash = '#/settings';
      throw new Error('初期パスワードを変更してください');
    }
    if (res.status === 403 && body.error === 'forbidden') throw new Error('この操作は運営管理者のみ行えます');
    if (res.status === 429) throw new Error('試行回数が多すぎます。しばらく待ってからお試しください');
    throw new Error(body.error || `request failed (${res.status})`);
  }
  return res.json();
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, data?: unknown) => request<T>(path, { method: 'POST', body: JSON.stringify(data ?? {}) }),
  patch: <T>(path: string, data?: unknown) => request<T>(path, { method: 'PATCH', body: JSON.stringify(data ?? {}) }),
  put: <T>(path: string, data?: unknown) => request<T>(path, { method: 'PUT', body: JSON.stringify(data ?? {}) }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};

// multipart/form-data用: Content-Typeを固定しないので、requestではなく独自にfetchする
export async function uploadFile(path: string, field: string, file: File): Promise<{ url: string }> {
  const token = getToken();
  const formData = new FormData();
  formData.append(field, file);
  const res = await fetchWithTimeout(
    `${BACKEND_URL}/api/admin${path}`,
    {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      body: formData,
    },
    60_000
  );
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `upload failed (${res.status})`);
  }
  return res.json();
}

export { getToken };
