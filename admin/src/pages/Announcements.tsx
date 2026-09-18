import { FormEvent, useEffect, useState } from 'react';
import { api } from '../api/client';
import { Modal } from '../components/Modal';
import { Pagination } from '../components/Pagination';
import { useToast } from '../context/ToastContext';
import { usePagination } from '../hooks/usePagination';

type Announcement = { id: number; title: string; body: string; target: string; status: string; created_at: string };

export default function Announcements() {
  const toast = useToast();
  const [items, setItems] = useState<Announcement[]>([]);
  const { page, setPage, totalPages, pageItems, total } = usePagination(items);
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [target, setTarget] = useState('全生徒');

  const load = () => api.get<Announcement[]>('/announcements').then(setItems);

  useEffect(() => {
    load();
  }, []);

  const create = async (e: FormEvent, publish: boolean) => {
    e.preventDefault();
    if (!title.trim()) return;
    await api.post('/announcements', { title: title.trim(), body, target, status: publish ? 'published' : 'draft' });
    toast(publish ? '公開しました' : '下書き保存しました');
    setShowCreate(false);
    setTitle('');
    setBody('');
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
        <button className="btn btn-primary" style={{ marginLeft: 'auto' }} onClick={() => setShowCreate(true)}>
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
              <td>{a.target}</td>
              <td>
                <span className="tag">{a.status === 'published' ? '公開' : '下書き'}</span>
              </td>
              <td style={{ color: 'var(--text-secondary)' }}>{a.created_at}</td>
              <td>
                <button className="btn" style={{ padding: '4px 12px' }} onClick={() => togglePublish(a)}>
                  {a.status === 'published' ? '下書きに戻す' : '公開する'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <Pagination page={page} totalPages={totalPages} total={total} onChange={setPage} />

      {showCreate && (
        <Modal onClose={() => setShowCreate(false)}>
          <form>
            <div className="modal-title">お知らせを作成</div>
            <label className="field-label">配信先</label>
            <select className="input" style={{ width: '100%' }} value={target} onChange={(e) => setTarget(e.target.value)}>
              <option value="全生徒">全生徒</option>
              <option value="特定グループ">特定グループ</option>
            </select>
            <label className="field-label">タイトル</label>
            <input className="input" style={{ width: '100%' }} value={title} onChange={(e) => setTitle(e.target.value)} required />
            <label className="field-label">本文</label>
            <textarea className="input" style={{ width: '100%', minHeight: 80 }} value={body} onChange={(e) => setBody(e.target.value)} />
            <div className="modal-actions">
              <button type="button" className="btn" onClick={(e) => create(e as never, false)}>
                下書き保存
              </button>
              <button type="button" className="btn btn-primary" onClick={(e) => create(e as never, true)}>
                公開する
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
