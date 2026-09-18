import { FormEvent, useEffect, useState } from 'react';
import { api } from '../api/client';
import { Modal } from '../components/Modal';
import { Pagination } from '../components/Pagination';
import { useToast } from '../context/ToastContext';
import { usePagination } from '../hooks/usePagination';

type Material = { id: number; title: string; week: string; status: string };

export default function Materials() {
  const toast = useToast();
  const [materials, setMaterials] = useState<Material[]>([]);
  const { page, setPage, totalPages, pageItems, total } = usePagination(materials);
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState('');
  const [week, setWeek] = useState('');

  const load = () => api.get<Material[]>('/materials').then(setMaterials);

  useEffect(() => {
    load();
  }, []);

  const toggleStatus = async (m: Material) => {
    const next = m.status === 'published' ? 'draft' : 'published';
    await api.patch(`/materials/${m.id}`, { status: next });
    toast(next === 'published' ? '公開しました' : '下書きに戻しました');
    load();
  };

  const create = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    await api.post('/materials', { title: title.trim(), week, status: 'draft' });
    toast('教材を作成しました（下書き）');
    setShowCreate(false);
    setTitle('');
    setWeek('');
    load();
  };

  return (
    <div>
      <h1 className="page-title">教材管理</h1>
      <div className="filter-row">
        <button className="btn btn-primary" style={{ marginLeft: 'auto' }} onClick={() => setShowCreate(true)}>
          ＋ 教材を追加
        </button>
      </div>
      <table className="table">
        <thead>
          <tr>
            <th>タイトル</th>
            <th>週</th>
            <th>状態</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {pageItems.map((m) => (
            <tr key={m.id}>
              <td style={{ fontWeight: 600 }}>{m.title}</td>
              <td>{m.week}</td>
              <td>
                <span className="tag">{m.status === 'published' ? '公開' : '下書き'}</span>
              </td>
              <td>
                <button className="btn" style={{ padding: '4px 12px' }} onClick={() => toggleStatus(m)}>
                  {m.status === 'published' ? '下書きに戻す' : '公開する'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <Pagination page={page} totalPages={totalPages} total={total} onChange={setPage} />

      {showCreate && (
        <Modal onClose={() => setShowCreate(false)}>
          <form onSubmit={create}>
            <div className="modal-title">教材を追加</div>
            <label className="field-label">タイトル</label>
            <input className="input" style={{ width: '100%' }} value={title} onChange={(e) => setTitle(e.target.value)} required />
            <label className="field-label">週（例: WEEK 15）</label>
            <input className="input" style={{ width: '100%' }} value={week} onChange={(e) => setWeek(e.target.value)} />
            <div className="modal-actions">
              <button type="button" className="btn" onClick={() => setShowCreate(false)}>
                キャンセル
              </button>
              <button type="submit" className="btn btn-primary">
                下書き保存
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
