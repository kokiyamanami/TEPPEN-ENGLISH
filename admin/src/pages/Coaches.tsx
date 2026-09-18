import { FormEvent, useEffect, useState } from 'react';
import { api } from '../api/client';
import { Modal } from '../components/Modal';
import { useToast } from '../context/ToastContext';

type Coach = { id: number; name: string; email: string; specialty: string };

export default function Coaches() {
  const toast = useToast();
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [showEdit, setShowEdit] = useState<Coach | 'new' | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Coach | null>(null);

  const load = () => api.get<Coach[]>('/coaches').then(setCoaches);

  useEffect(() => {
    load();
  }, []);

  const openNew = () => {
    setName('');
    setEmail('');
    setSpecialty('');
    setShowEdit('new');
  };

  const openEdit = (c: Coach) => {
    setName(c.name);
    setEmail(c.email);
    setSpecialty(c.specialty);
    setShowEdit(c);
  };

  const save = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    if (showEdit === 'new') {
      await api.post('/coaches', { name: name.trim(), email: email.trim(), specialty: specialty.trim() });
      toast('コーチを追加しました');
    } else if (showEdit) {
      await api.patch(`/coaches/${showEdit.id}`, { name: name.trim(), email: email.trim(), specialty: specialty.trim() });
      toast('コーチ情報を更新しました');
    }
    setShowEdit(null);
    load();
  };

  const doDelete = async () => {
    if (!deleteTarget) return;
    await api.delete(`/coaches/${deleteTarget.id}`);
    toast('コーチを削除しました');
    setDeleteTarget(null);
    load();
  };

  return (
    <div>
      <h1 className="page-title">コーチ管理</h1>
      <div className="filter-row">
        <button className="btn btn-primary" style={{ marginLeft: 'auto' }} onClick={openNew}>
          ＋ コーチを追加
        </button>
      </div>
      <table className="table">
        <thead>
          <tr>
            <th>氏名</th>
            <th>メール</th>
            <th>専門分野</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {coaches.map((c) => (
            <tr key={c.id}>
              <td style={{ fontWeight: 600 }}>{c.name}</td>
              <td style={{ color: 'var(--text-secondary)' }}>{c.email}</td>
              <td>{c.specialty}</td>
              <td>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn" style={{ padding: '4px 12px' }} onClick={() => openEdit(c)}>
                    編集
                  </button>
                  <button className="btn" style={{ padding: '4px 12px' }} onClick={() => setDeleteTarget(c)}>
                    削除
                  </button>
                </div>
              </td>
            </tr>
          ))}
          {coaches.length === 0 && (
            <tr>
              <td colSpan={4} style={{ color: 'var(--text-secondary)' }}>
                コーチが登録されていません
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {showEdit && (
        <Modal onClose={() => setShowEdit(null)}>
          <form onSubmit={save}>
            <div className="modal-title">{showEdit === 'new' ? 'コーチを追加' : 'コーチ情報を編集'}</div>
            <label className="field-label">氏名</label>
            <input className="input" style={{ width: '100%' }} value={name} onChange={(e) => setName(e.target.value)} required />
            <label className="field-label">メールアドレス</label>
            <input className="input" style={{ width: '100%' }} type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <label className="field-label">専門分野</label>
            <input
              className="input"
              style={{ width: '100%' }}
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
              placeholder="例）ビジネス英語・プレゼンテーション"
            />
            <div className="modal-actions">
              <button type="button" className="btn" onClick={() => setShowEdit(null)}>
                キャンセル
              </button>
              <button type="submit" className="btn btn-primary">
                {showEdit === 'new' ? '追加' : '保存'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {deleteTarget && (
        <Modal onClose={() => setDeleteTarget(null)}>
          <div className="modal-title">{deleteTarget.name}を削除しますか？</div>
          <div className="modal-desc">この操作は元に戻せません。</div>
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
