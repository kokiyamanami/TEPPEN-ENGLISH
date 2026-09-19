import { FormEvent, useEffect, useState } from 'react';
import { api } from '../api/client';
import { Modal } from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

type StaffUser = { id: number; name: string; email: string; role: 'admin' | 'coach'; mustChangePassword: boolean };

const ROLE_LABEL = { admin: '運営管理者', coach: 'コーチ' } as const;
const MIN_PASSWORD_LENGTH = 10;

// 管理画面にログインするスタッフのアカウント管理（運営管理者のみ）
export default function Staff() {
  const toast = useToast();
  const { user: me } = useAuth();
  const [staff, setStaff] = useState<StaffUser[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', role: 'coach', password: '' });
  const [editTarget, setEditTarget] = useState<StaffUser | null>(null);
  const [resetTarget, setResetTarget] = useState<StaffUser | null>(null);
  const [resetPassword, setResetPassword] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<StaffUser | null>(null);

  const load = () => api.get<StaffUser[]>('/staff').then(setStaff);

  useEffect(() => {
    load();
  }, []);

  const create = async (e: FormEvent) => {
    e.preventDefault();
    await api.post('/staff', { ...form, name: form.name.trim(), email: form.email.trim() });
    toast('スタッフを追加しました（初回ログイン時にパスワード変更が必要です）');
    setShowCreate(false);
    setForm({ name: '', email: '', role: 'coach', password: '' });
    load();
  };

  const saveEdit = async (e: FormEvent) => {
    e.preventDefault();
    if (!editTarget) return;
    await api.patch(`/staff/${editTarget.id}`, { name: editTarget.name.trim(), role: editTarget.role });
    toast('更新しました');
    setEditTarget(null);
    load();
  };

  const doReset = async (e: FormEvent) => {
    e.preventDefault();
    if (!resetTarget) return;
    await api.post(`/staff/${resetTarget.id}/reset-password`, { password: resetPassword });
    toast('パスワードを再発行しました（次回ログイン時に変更が必要です）');
    setResetTarget(null);
    setResetPassword('');
    load();
  };

  const doDelete = async () => {
    if (!deleteTarget) return;
    await api.delete(`/staff/${deleteTarget.id}`);
    toast('スタッフを削除しました');
    setDeleteTarget(null);
    load();
  };

  return (
    <div>
      <h1 className="page-title">スタッフ管理</h1>
      <p style={{ color: 'var(--text-secondary, #666)', marginTop: -8, marginBottom: 16 }}>
        管理画面にログインするアカウントです。<strong>運営管理者</strong>はすべての操作ができ、<strong>コーチ</strong>は生徒・グループの運用のみ行えます
        （教材・お知らせ・動画・広告・コーチ管理・一括操作・スタッフ管理は運営管理者のみ）。
      </p>
      <div className="filter-row">
        <button className="btn btn-primary" style={{ marginLeft: 'auto' }} onClick={() => setShowCreate(true)}>
          ＋ スタッフを追加
        </button>
      </div>

      <table className="table">
        <thead>
          <tr>
            <th>氏名</th>
            <th>メール</th>
            <th>役割</th>
            <th>状態</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {staff.map((s) => (
            <tr key={s.id}>
              <td style={{ fontWeight: 600 }}>
                {s.name}
                {s.id === me?.id ? '（自分）' : ''}
              </td>
              <td style={{ color: 'var(--text-secondary)' }}>{s.email}</td>
              <td>
                <span className="tag">{ROLE_LABEL[s.role]}</span>
              </td>
              <td>{s.mustChangePassword ? <span className="tag">初期パスワード（未変更）</span> : '通常'}</td>
              <td>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn" style={{ padding: '4px 12px' }} onClick={() => setEditTarget(s)}>
                    編集
                  </button>
                  <button className="btn" style={{ padding: '4px 12px' }} onClick={() => setResetTarget(s)}>
                    パスワード再発行
                  </button>
                  {s.id !== me?.id && (
                    <button className="btn" style={{ padding: '4px 12px' }} onClick={() => setDeleteTarget(s)}>
                      削除
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {showCreate && (
        <Modal onClose={() => setShowCreate(false)}>
          <form onSubmit={create}>
            <div className="modal-title">スタッフを追加</div>
            <div className="modal-desc">初期パスワードを本人に伝えてください。本人は初回ログイン時に、必ずパスワードを変更します。</div>
            <label className="field-label">氏名</label>
            <input className="input" style={{ width: '100%' }} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            <label className="field-label">メールアドレス</label>
            <input className="input" style={{ width: '100%' }} type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            <label className="field-label">役割</label>
            <select className="input" style={{ width: '100%' }} value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              <option value="coach">コーチ</option>
              <option value="admin">運営管理者</option>
            </select>
            <label className="field-label">初期パスワード（{MIN_PASSWORD_LENGTH}文字以上）</label>
            <input className="input" style={{ width: '100%' }} type="text" autoComplete="off" minLength={MIN_PASSWORD_LENGTH} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
            <div className="modal-actions">
              <button type="button" className="btn" onClick={() => setShowCreate(false)}>
                キャンセル
              </button>
              <button type="submit" className="btn btn-primary">
                追加する
              </button>
            </div>
          </form>
        </Modal>
      )}

      {editTarget && (
        <Modal onClose={() => setEditTarget(null)}>
          <form onSubmit={saveEdit}>
            <div className="modal-title">スタッフを編集</div>
            <label className="field-label">氏名</label>
            <input className="input" style={{ width: '100%' }} value={editTarget.name} onChange={(e) => setEditTarget({ ...editTarget, name: e.target.value })} required />
            <label className="field-label">役割</label>
            <select className="input" style={{ width: '100%' }} value={editTarget.role} onChange={(e) => setEditTarget({ ...editTarget, role: e.target.value as StaffUser['role'] })}>
              <option value="coach">コーチ</option>
              <option value="admin">運営管理者</option>
            </select>
            <div className="modal-actions">
              <button type="button" className="btn" onClick={() => setEditTarget(null)}>
                キャンセル
              </button>
              <button type="submit" className="btn btn-primary">
                保存
              </button>
            </div>
          </form>
        </Modal>
      )}

      {resetTarget && (
        <Modal onClose={() => setResetTarget(null)}>
          <form onSubmit={doReset}>
            <div className="modal-title">{resetTarget.name}のパスワードを再発行</div>
            <div className="modal-desc">新しいパスワードを本人に伝えてください。本人は次回ログイン時に、必ずパスワードを変更します。</div>
            <label className="field-label">新しいパスワード（{MIN_PASSWORD_LENGTH}文字以上）</label>
            <input className="input" style={{ width: '100%' }} type="text" autoComplete="off" minLength={MIN_PASSWORD_LENGTH} value={resetPassword} onChange={(e) => setResetPassword(e.target.value)} required />
            <div className="modal-actions">
              <button type="button" className="btn" onClick={() => setResetTarget(null)}>
                キャンセル
              </button>
              <button type="submit" className="btn btn-primary">
                再発行する
              </button>
            </div>
          </form>
        </Modal>
      )}

      {deleteTarget && (
        <Modal onClose={() => setDeleteTarget(null)}>
          <div className="modal-title">{deleteTarget.name}を削除しますか？</div>
          <div className="modal-desc">このアカウントでは、以後ログインできなくなります。この操作は元に戻せません。</div>
          <div className="modal-actions">
            <button className="btn" onClick={() => setDeleteTarget(null)}>
              キャンセル
            </button>
            <button className="btn btn-danger" onClick={doDelete}>
              削除する
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
