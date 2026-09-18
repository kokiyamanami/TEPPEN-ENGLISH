import { FormEvent, useEffect, useState } from 'react';
import { api } from '../api/client';
import { Modal } from '../components/Modal';
import { Pagination } from '../components/Pagination';
import { useToast } from '../context/ToastContext';
import { usePagination } from '../hooks/usePagination';

type Announcement = {
  id: number;
  title: string;
  body: string;
  target: string;
  target_group_id: number | null;
  target_group_name: string | null;
  status: string;
  created_at: string;
};

type Group = { id: number; name: string };

export default function Announcements() {
  const toast = useToast();
  const [items, setItems] = useState<Announcement[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showEdit, setShowEdit] = useState<Announcement | 'new' | null>(null);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [target, setTarget] = useState('全生徒');
  const [targetGroupId, setTargetGroupId] = useState('');

  const filtered = items.filter((a) => {
    if (search && !a.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilter && a.status !== statusFilter) return false;
    return true;
  });
  const { page, setPage, totalPages, pageItems, total } = usePagination(filtered);

  const load = () => api.get<Announcement[]>('/announcements').then(setItems);

  useEffect(() => {
    load();
    api.get<Group[]>('/groups?status=active').then(setGroups);
  }, []);

  const openNew = () => {
    setTitle('');
    setBody('');
    setTarget('全生徒');
    setTargetGroupId('');
    setShowEdit('new');
  };

  const openEdit = (a: Announcement) => {
    setTitle(a.title);
    setBody(a.body || '');
    setTarget(a.target);
    setTargetGroupId(a.target_group_id ? String(a.target_group_id) : '');
    setShowEdit(a);
  };

  const save = async (e: FormEvent, publish?: boolean) => {
    e.preventDefault();
    if (!title.trim()) return;
    if (target === '特定グループ' && !targetGroupId) {
      toast('配信先のグループを選択してください');
      return;
    }
    const payload = {
      title: title.trim(),
      body,
      target,
      targetGroupId: target === '特定グループ' ? Number(targetGroupId) : null,
    };
    if (showEdit === 'new') {
      await api.post('/announcements', { ...payload, status: publish ? 'published' : 'draft' });
      toast(publish ? '公開しました' : '下書き保存しました');
    } else if (showEdit) {
      await api.patch(`/announcements/${showEdit.id}`, payload);
      toast('更新しました');
    }
    setShowEdit(null);
    load();
  };

  const togglePublish = async (a: Announcement) => {
    const next = a.status === 'published' ? 'draft' : 'published';
    await api.patch(`/announcements/${a.id}`, { status: next });
    toast(next === 'published' ? '公開しました' : '下書きに戻しました');
    load();
  };

  return (
    <div>
      <h1 className="page-title">お知らせ管理</h1>
      <div className="filter-row">
        <input className="input" placeholder="タイトルで検索" value={search} onChange={(e) => setSearch(e.target.value)} />
        <select className="input" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">全ステータス</option>
          <option value="published">公開</option>
          <option value="draft">下書き</option>
        </select>
        <button className="btn btn-primary" style={{ marginLeft: 'auto' }} onClick={openNew}>
          ＋ お知らせを作成
        </button>
      </div>
      <table className="table">
        <thead>
          <tr>
            <th>タイトル</th>
            <th>配信先</th>
            <th>状態</th>
            <th>作成日</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {pageItems.map((a) => (
            <tr key={a.id}>
              <td style={{ fontWeight: 600 }}>{a.title}</td>
              <td>{a.target === '特定グループ' ? `特定グループ（${a.target_group_name ?? '不明'}）` : a.target}</td>
              <td>
                <span className="tag">{a.status === 'published' ? '公開' : '下書き'}</span>
              </td>
              <td style={{ color: 'var(--text-secondary)' }}>{a.created_at}</td>
              <td>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn" style={{ padding: '4px 12px' }} onClick={() => openEdit(a)}>
                    編集
                  </button>
                  <button className="btn" style={{ padding: '4px 12px' }} onClick={() => togglePublish(a)}>
                    {a.status === 'published' ? '下書きに戻す' : '公開する'}
                  </button>
                </div>
              </td>
            </tr>
          ))}
          {pageItems.length === 0 && (
            <tr>
              <td colSpan={5} style={{ color: 'var(--text-secondary)' }}>
                該当するお知らせがありません
              </td>
            </tr>
          )}
        </tbody>
      </table>
      <Pagination page={page} totalPages={totalPages} total={total} onChange={setPage} />

      {showEdit && (
        <Modal onClose={() => setShowEdit(null)}>
          <form onSubmit={save}>
            <div className="modal-title">{showEdit === 'new' ? 'お知らせを作成' : 'お知らせを編集'}</div>
            <label className="field-label">配信先</label>
            <select className="input" style={{ width: '100%' }} value={target} onChange={(e) => setTarget(e.target.value)}>
              <option value="全生徒">全生徒</option>
              <option value="特定グループ">特定グループ</option>
            </select>
            {target === '特定グループ' && (
              <>
                <label className="field-label">対象グループ</label>
                <select className="input" style={{ width: '100%' }} value={targetGroupId} onChange={(e) => setTargetGroupId(e.target.value)}>
                  <option value="">選択してください</option>
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>
              </>
            )}
            <label className="field-label">タイトル</label>
            <input className="input" style={{ width: '100%' }} value={title} onChange={(e) => setTitle(e.target.value)} required />
            <label className="field-label">本文</label>
            <textarea className="input" style={{ width: '100%', minHeight: 80 }} value={body} onChange={(e) => setBody(e.target.value)} />
            <div className="modal-actions">
              {showEdit === 'new' ? (
                <>
                  <button type="button" className="btn" onClick={(e) => save(e as never, false)}>
                    下書き保存
                  </button>
                  <button type="button" className="btn btn-primary" onClick={(e) => save(e as never, true)}>
                    公開する
                  </button>
                </>
              ) : (
                <>
                  <button type="button" className="btn" onClick={() => setShowEdit(null)}>
                    キャンセル
                  </button>
                  <button type="submit" className="btn btn-primary">
                    保存
                  </button>
                </>
              )}
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
