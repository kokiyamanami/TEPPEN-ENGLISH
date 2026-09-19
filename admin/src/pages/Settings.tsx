import { FormEvent, useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function Settings() {
  const { user, updateUser } = useAuth();
  const toast = useToast();
  const [name, setName] = useState(user?.name ?? '');
  const [notifyEmail, setNotifyEmail] = useState(user?.notifyEmail ?? true);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changing, setChanging] = useState(false);

  const changePassword = async (e: FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast('新しいパスワードが一致しません');
      return;
    }
    setChanging(true);
    try {
      await api.post('/me/password', { currentPassword, newPassword });
      updateUser({ mustChangePassword: false });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast('パスワードを変更しました');
    } finally {
      setChanging(false);
    }
  };

  const save = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      toast('氏名を入力してください');
      return;
    }
    await api.patch('/me', { name: trimmed, notifyEmail });
    updateUser({ name: trimmed, notifyEmail });
    toast('設定を保存しました');
  };

  if (!user) return null;

  return (
    <div>
      <h1 className="page-title">設定</h1>
      {user.mustChangePassword && (
        <div className="card" style={{ maxWidth: 420, marginBottom: 16, borderColor: 'var(--danger)' }}>
          <strong style={{ color: 'var(--danger)' }}>初期パスワードの変更が必要です</strong>
          <div style={{ fontSize: 12, marginTop: 6 }}>安全のため、下の「パスワード変更」で新しいパスワードを設定するまで、他の画面は使えません。</div>
        </div>
      )}
      <form className="card" style={{ maxWidth: 420 }} onSubmit={save}>
        <label className="field-label">氏名</label>
        <input className="input" style={{ width: '100%' }} value={name} onChange={(e) => setName(e.target.value)} />

        <label className="field-label">メールアドレス</label>
        <input className="input" style={{ width: '100%' }} value={user.email} disabled />

        <label className="field-label">役割</label>
        <input className="input" style={{ width: '100%' }} value={user.role === 'admin' ? '運営管理者' : 'コーチ'} disabled />

        <label className="field-label" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input type="checkbox" checked={notifyEmail} onChange={(e) => setNotifyEmail(e.target.checked)} />
          メール通知を受け取る
        </label>

        <button className="btn btn-primary" style={{ marginTop: 20 }}>
          変更を保存
        </button>
      </form>

      <form className="card" style={{ maxWidth: 420, marginTop: 16 }} onSubmit={changePassword}>
        <div className="section-title" style={{ marginTop: 0 }}>
          パスワード変更
        </div>
        <label className="field-label">現在のパスワード</label>
        <input className="input" style={{ width: '100%' }} type="password" autoComplete="current-password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
        <label className="field-label">新しいパスワード（10文字以上）</label>
        <input className="input" style={{ width: '100%' }} type="password" autoComplete="new-password" minLength={10} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
        <label className="field-label">新しいパスワード（確認）</label>
        <input className="input" style={{ width: '100%' }} type="password" autoComplete="new-password" minLength={10} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
        <button className="btn btn-primary" style={{ marginTop: 20 }} disabled={changing}>
          {changing ? '変更中…' : 'パスワードを変更'}
        </button>
      </form>
    </div>
  );
}
