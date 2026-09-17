import { FormEvent, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { Avatar } from '../components/Avatar';
import { Modal } from '../components/Modal';
import { useToast } from '../context/ToastContext';

type Student = {
  id: number;
  name: string;
  avatar_url: string | null;
  group_id: number | null;
  group_name: string | null;
  status: string;
  last_login: string;
  weeklySpeakMin: number;
  monthlyMissions: { month: string; pass: number; date: string }[];
};

type Group = { id: number; name: string };

export default function Students() {
  const toast = useToast();
  const [students, setStudents] = useState<Student[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [search, setSearch] = useState('');
  const [groupFilter, setGroupFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [popupStudent, setPopupStudent] = useState<Student | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newGroupId, setNewGroupId] = useState('');

  const load = () => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (groupFilter) params.set('groupId', groupFilter);
    if (statusFilter) params.set('status', statusFilter);
    api.get<Student[]>(`/students?${params.toString()}`).then(setStudents);
  };

  useEffect(() => {
    api.get<Group[]>('/groups').then(setGroups);
  }, []);

  useEffect(() => {
    load();
  }, [search, groupFilter, statusFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleStatus = async (s: Student) => {
    const next = s.status === 'active' ? 'inactive' : 'active';
    await api.patch(`/students/${s.id}`, { status: next });
    toast(`${s.name}を${next === 'active' ? '有効化' : '無効化'}しました`);
    load();
  };

  const addStudent = async (e: FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    await api.post('/students', { name: newName.trim(), groupId: newGroupId || null });
    toast('生徒を追加しました');
    setShowAdd(false);
    setNewName('');
    setNewGroupId('');
    load();
  };

  return (
    <div>
      <h1 className="page-title">生徒一覧</h1>

      <div className="filter-row">
        <input className="input" placeholder="名前で検索" value={search} onChange={(e) => setSearch(e.target.value)} />
        <select className="input" value={groupFilter} onChange={(e) => setGroupFilter(e.target.value)}>
          <option value="">全グループ</option>
          {groups.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>
        <select className="input" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">全ステータス</option>
          <option value="active">有効</option>
          <option value="inactive">無効</option>
        </select>
        <button className="btn btn-primary" style={{ marginLeft: 'auto' }} onClick={() => setShowAdd(true)}>
          ＋ 生徒を追加
        </button>
      </div>

      <table className="table">
        <thead>
          <tr>
            <th>氏名</th>
            <th>グループ</th>
            <th>発話時間（週）</th>
            <th>Monthlyミッション</th>
            <th>最終ログイン</th>
            <th>状態</th>
          </tr>
        </thead>
        <tbody>
          {students.map((s) => {
            const latest = s.monthlyMissions[0];
            return (
              <tr key={s.id}>
                <td>
                  <Link
                    to={`/students/${s.id}`}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--navy)', fontWeight: 600, textDecoration: 'none' }}
                  >
                    <Avatar url={s.avatar_url} name={s.name} size={28} />
                    {s.name}
                  </Link>
                </td>
                <td>
                  {s.group_name ? (
                    <Link to={`/groups/${s.group_id}`} className="tag clickable">
                      {s.group_name}
                    </Link>
                  ) : (
                    <span className="tag">未所属</span>
                  )}
                </td>
                <td>{s.weeklySpeakMin}分</td>
                <td>
                  <span className="tag clickable" onClick={() => setPopupStudent(s)}>
                    {latest ? (latest.pass ? '合格' : '不合格') : '記録なし'}
                  </span>
                </td>
                <td style={{ color: 'var(--text-secondary)' }}>{s.last_login}</td>
                <td>
                  <button className="btn" style={{ padding: '4px 12px' }} onClick={() => toggleStatus(s)}>
                    {s.status === 'active' ? '有効' : '無効'}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {popupStudent && (
        <Modal onClose={() => setPopupStudent(null)}>
          <div className="modal-title">{popupStudent.name} · Monthlyミッション履歴</div>
          <table className="table" style={{ marginTop: 12 }}>
            <tbody>
              {popupStudent.monthlyMissions.map((m, i) => (
                <tr key={i}>
                  <td>{m.month}</td>
                  <td>{m.date}</td>
                  <td className={m.pass ? 'badge-pass' : 'badge-fail'}>{m.pass ? '合格' : '不合格'}</td>
                </tr>
              ))}
              {popupStudent.monthlyMissions.length === 0 && (
                <tr>
                  <td>記録がありません</td>
                </tr>
              )}
            </tbody>
          </table>
          <div className="modal-actions">
            <button className="btn" onClick={() => setPopupStudent(null)}>
              閉じる
            </button>
          </div>
        </Modal>
      )}

      {showAdd && (
        <Modal onClose={() => setShowAdd(false)}>
          <form onSubmit={addStudent}>
            <div className="modal-title">生徒を追加</div>
            <div className="modal-desc">氏名とグループを入力してください。詳細情報は追加後に生徒詳細から編集できます。</div>
            <label className="field-label">氏名</label>
            <input className="input" style={{ width: '100%' }} value={newName} onChange={(e) => setNewName(e.target.value)} required />
            <label className="field-label">グループ</label>
            <select className="input" style={{ width: '100%' }} value={newGroupId} onChange={(e) => setNewGroupId(e.target.value)}>
              <option value="">未所属</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
            <div className="modal-actions">
              <button type="button" className="btn" onClick={() => setShowAdd(false)}>
                キャンセル
              </button>
              <button type="submit" className="btn btn-primary">
                追加する
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
