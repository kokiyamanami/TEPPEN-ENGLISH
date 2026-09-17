import { FormEvent, useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function Settings() {
  const { user } = useAuth();
  const toast = useToast();
  const [name, setName] = useState(user?.name ?? '');
  const [notifyEmail, setNotifyEmail] = useState(user?.notifyEmail ?? true);

  const save = async (e: FormEvent) => {
    e.preventDefault();
    await api.patch('/me', { name, notifyEmail });
    toast('設定を保存しました');
  };

  if (!user) return null;

  return (
    <div>
      <h1 className="page-title">設定</h1>
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
    </div>
  );
}
