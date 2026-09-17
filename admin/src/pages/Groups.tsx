import { FormEvent, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { Modal } from '../components/Modal';
import { useToast } from '../context/ToastContext';

type Group = { id: number; name: string; status: string; studentCount: number };

export default function Groups() {
  const toast = useToast();
  const [tab, setTab] = useState<'active' | 'inactive'>('active');
  const [groups, setGroups] = useState<Group[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Group | null>(null);

  const load = () => {
    api.get<Group[]>(`/groups?status=${tab}`).then(setGroups);
  };

  useEffect(() => {
    load();
  }, [tab]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleActive = async (g: Group) => {
    const next = g.status === 'active' ? 'inactive' : 'active';
    await api.patch(`/groups/${g.id}`, { status: next });
    toast(`${g.name}を${next === 'active' ? '再アクティブ化' : '非アクティブ化'}しました`);
    load();
  };

  const create = async (e: FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    await api.post('/groups', { name: newName.trim() });
    toast('グループを作成しました');
    setShowCreate(false);
    setNewName('');
    load();
  };

  const doDelete = async () => {
    if (!deleteTarget) return;
    await api.delete(`/groups/${deleteTarget.id}`);
    toast('グループを削除しました');
    setDeleteTarget(null);
    load();
  };

  return (
    <div>
      <h1 className="page-title">グループ管理</h1>

      <div className="filter-row">
        <button className={`btn${tab === 'active' ? ' btn-navy' : ''}`} onClick={() => setTab('active')}>
          ACTIVE
        </button>
        <button className={`btn${tab === 'inactive' ? ' btn-navy' : ''}`} onClick={() => setTab('inactive')}>
          INACTIVE
        </button>
        <button className="btn btn-primary" style={{ marginLeft: 'auto' }} onClick={() => setShowCreate(true)}>
          ＋ 新規グループ作成
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        {groups.map((g) => (
          <div key={g.id} className="card">
            <Link to={`/groups/${g.id}`} style={{ color: 'var(--navy)', fontWeight: 700, fontSize: 15, textDecoration: 'none' }}>
              {g.name}
            </Link>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>{g.studentCount}名 所属</div>
            <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
              <button className="btn" style={{ flex: 1 }} onClick={() => toggleActive(g)}>
                {g.status === 'active' ? '非アクティブ化' : '再アクティブ化'}
              </button>
              <button className="btn btn-danger" onClick={() => setDeleteTarget(g)}>
                削除
              </button>
            </div>
          </div>
        ))}
        {groups.length === 0 && <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>グループがありません</div>}
      </div>

      {showCreate && (
        <Modal onClose={() => setShowCreate(false)}>
          <form onSubmit={create}>
            <div className="modal-title">新規グループ作成</div>
            <label className="field-label">グループ名</label>
            <input className="input" style={{ width: '100%' }} value={newName} onChange={(e) => setNewName(e.target.value)} required />
            <div className="modal-actions">
              <button type="button" className="btn" onClick={() => setShowCreate(false)}>
                キャンセル
              </button>
              <button type="submit" className="btn btn-primary">
                作成する
              </button>
            </div>
          </form>
        </Modal>
      )}

      {deleteTarget && (
        <Modal onClose={() => setDeleteTarget(null)}>
          <div className="modal-title">{deleteTarget.name}を削除しますか？</div>
          <div className="modal-desc">所属する生徒は未所属になります。この操作は元に戻せません。</div>
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
