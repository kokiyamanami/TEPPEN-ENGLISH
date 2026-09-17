import { BACKEND_URL } from '../api/client';

function resolveUrl(url: string) {
  return url.startsWith('http') ? url : `${BACKEND_URL}${url}`;
}

export function Avatar({ url, name, size = 32 }: { url?: string | null; name: string; size?: number }) {
  const style = { width: size, height: size, borderRadius: size / 2, fontSize: size * 0.42 };
  if (url) {
    return (
      <img
        src={resolveUrl(url)}
        alt={name}
        style={{ ...style, objectFit: 'cover', border: '1px solid var(--border, #eee)' }}
      />
    );
  }
  return (
    <div
      style={{
        ...style,
        background: 'var(--navy, #00375D)',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 700,
      }}
    >
      {(name || 'U').charAt(0)}
    </div>
  );
}
