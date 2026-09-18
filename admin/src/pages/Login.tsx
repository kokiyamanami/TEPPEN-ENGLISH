import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logoWhite from '../assets/logo-white.png';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
      navigate('/overview');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ログインに失敗しました');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-wrap">
      <form className="login-card" onSubmit={onSubmit}>
        <div style={{ background: 'var(--navy)', borderRadius: 10, padding: '10px 14px', display: 'inline-block', marginBottom: 14 }}>
          <img src={logoWhite} alt="TEPPEN ENGLISH" style={{ width: 150, height: 'auto', display: 'block' }} />
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 20 }}>コーチ・運営スタッフ用ログイン</div>

        <label className="field-label">メールアドレス</label>
        <input className="input" style={{ width: '100%' }} type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />

        <label className="field-label">パスワード</label>
        <input
          className="input"
          style={{ width: '100%' }}
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        {error && <div style={{ color: 'var(--danger)', fontSize: 12, marginTop: 10 }}>{error}</div>}

        <button className="btn btn-primary" style={{ width: '100%', marginTop: 20, padding: 10 }} disabled={submitting}>
          {submitting ? 'ログイン中…' : 'ログイン'}
        </button>

        <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 14, textAlign: 'center' }}>
          パスワードをお忘れの場合は運営までお問い合わせください
        </div>
      </form>
    </div>
  );
}
