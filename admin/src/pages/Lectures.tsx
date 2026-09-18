import { FormEvent, useEffect, useState } from 'react';
import { api } from '../api/client';
import { Modal } from '../components/Modal';
import { Pagination } from '../components/Pagination';
import { useToast } from '../context/ToastContext';
import { usePagination } from '../hooks/usePagination';

type Lecture = {
  id: number;
  youtube_id: string;
  title: string;
  instructor: string;
  category: string;
  sort_order: number;
};

function thumbnailUrl(youtubeId: string) {
  return `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`;
}

// youtube.com/watch?v=ID・youtu.be/ID・shorts/ID等のURL、または動画IDそのものの入力を許容する
function extractYoutubeId(input: string): string {
  const trimmed = input.trim();
  try {
    const url = new URL(trimmed);
    if (url.hostname.includes('youtu.be')) {
      return url.pathname.split('/').filter(Boolean)[0] || trimmed;
    }
    if (url.hostname.includes('youtube.com')) {
      const v = url.searchParams.get('v');
      if (v) return v;
      const match = url.pathname.match(/\/(embed|shorts)\/([^/?]+)/);
      if (match) return match[2];
    }
  } catch {
    // URLとして解釈できない場合はIDそのものとして扱う
  }
  return trimmed;
}

export default function Lectures() {
  const toast = useToast();
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const categories = Array.from(new Set(lectures.map((l) => l.category).filter(Boolean)));
  const filtered = lectures.filter((l) => {
    if (search && !l.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (categoryFilter && l.category !== categoryFilter) return false;
    return true;
  });
  const { page, setPage, totalPages, pageItems, total } = usePagination(filtered);
  const [showEdit, setShowEdit] = useState<Lecture | 'new' | null>(null);
  const [youtubeId, setYoutubeId] = useState('');
  const [title, setTitle] = useState('');
  const [instructor, setInstructor] = useState('TEPPEN ENGLISH');
  const [category, setCategory] = useState('');
  const [sortOrder, setSortOrder] = useState('0');

  const load = () => api.get<Lecture[]>('/lectures').then(setLectures);

  useEffect(() => {
    load();
  }, []);

  const openNew = () => {
    setYoutubeId('');
    setTitle('');
    setInstructor('TEPPEN ENGLISH');
    setCategory('');
    setSortOrder(String(lectures.length));
    setShowEdit('new');
  };

  const openEdit = (l: Lecture) => {
    setYoutubeId(l.youtube_id);
    setTitle(l.title);
    setInstructor(l.instructor);
    setCategory(l.category);
    setSortOrder(String(l.sort_order));
    setShowEdit(l);
  };

  const save = async (e: FormEvent) => {
    e.preventDefault();
    if (!youtubeId.trim() || !title.trim()) return;
    const payload = { youtubeId: extractYoutubeId(youtubeId), title: title.trim(), instructor, category, sortOrder: Number(sortOrder) || 0 };
    if (showEdit === 'new') {
      await api.post('/lectures', payload);
      toast('動画を追加しました');
    } else if (showEdit) {
      await api.patch(`/lectures/${showEdit.id}`, payload);
      toast('動画を更新しました');
    }
    setShowEdit(null);
    load();
  };

  const remove = async (l: Lecture) => {
    if (!window.confirm(`「${l.title}」を削除しますか？`)) return;
    await api.delete(`/lectures/${l.id}`);
    toast('削除しました');
    load();
  };

  return (
    <div>
      <h1 className="page-title">動画管理</h1>
      <p style={{ color: 'var(--text-secondary, #666)', marginTop: -8, marginBottom: 16 }}>
        Userアプリのトレーニング「動画」カテゴリに表示するYouTube動画です。YouTubeの動画IDはURLの v= の後ろの部分です。
      </p>
      <div className="filter-row">
        <input className="input" placeholder="タイトルで検索" value={search} onChange={(e) => setSearch(e.target.value)} />
        <select className="input" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
          <option value="">全カテゴリ</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <button className="btn btn-primary" style={{ marginLeft: 'auto' }} onClick={openNew}>
          ＋ 動画を追加
        </button>
      </div>
      <table className="table">
        <thead>
          <tr>
            <th>サムネイル</th>
            <th>タイトル</th>
            <th>カテゴリ</th>
            <th>表示順</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {pageItems.map((l) => (
            <tr key={l.id}>
              <td>
                <img src={thumbnailUrl(l.youtube_id)} alt={l.title} style={{ width: 96, height: 54, objectFit: 'cover', borderRadius: 6 }} />
              </td>
              <td style={{ maxWidth: 320 }}>{l.title}</td>
              <td>
                <span className="tag">{l.category || '未分類'}</span>
              </td>
              <td>{l.sort_order}</td>
              <td>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn" style={{ padding: '4px 12px' }} onClick={() => openEdit(l)}>
                    編集
                  </button>
                  <button className="btn" style={{ padding: '4px 12px' }} onClick={() => remove(l)}>
                    削除
                  </button>
                </div>
              </td>
            </tr>
          ))}
          {pageItems.length === 0 && (
            <tr>
              <td colSpan={5} style={{ color: 'var(--text-secondary)' }}>
                該当する動画がありません
              </td>
            </tr>
          )}
        </tbody>
      </table>
      <Pagination page={page} totalPages={totalPages} total={total} onChange={setPage} />

      {showEdit && (
        <Modal onClose={() => setShowEdit(null)}>
          <form onSubmit={save}>
            <div className="modal-title">{showEdit === 'new' ? '動画を追加' : '動画を編集'}</div>
            <label className="field-label">YouTube動画URL（またはID）</label>
            <input
              className="input"
              style={{ width: '100%' }}
              value={youtubeId}
              onChange={(e) => setYoutubeId(e.target.value)}
              placeholder="例: https://www.youtube.com/watch?v=HXH-qL4DltE"
              required
            />
            <label className="field-label">タイトル</label>
            <input className="input" style={{ width: '100%' }} value={title} onChange={(e) => setTitle(e.target.value)} required />
            <label className="field-label">講師名</label>
            <input className="input" style={{ width: '100%' }} value={instructor} onChange={(e) => setInstructor(e.target.value)} />
            <label className="field-label">カテゴリ</label>
            <input
              className="input"
              style={{ width: '100%' }}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="例: 学習法 / ビジネス英語 / スピーキング"
            />
            <label className="field-label">表示順（小さいほど先に表示）</label>
            <input className="input" type="number" style={{ width: '100%' }} value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} />
            <div className="modal-actions">
              <button type="button" className="btn" onClick={() => setShowEdit(null)}>
                キャンセル
              </button>
              <button type="submit" className="btn btn-primary">
                保存
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
