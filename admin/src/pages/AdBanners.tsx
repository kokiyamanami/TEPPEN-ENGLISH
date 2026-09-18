import { ChangeEvent, FormEvent, useEffect, useState } from 'react';
import { api, BACKEND_URL, uploadFile } from '../api/client';
import { Modal } from '../components/Modal';
import { Pagination } from '../components/Pagination';
import { useToast } from '../context/ToastContext';
import { usePagination } from '../hooks/usePagination';

function resolveUrl(url: string) {
  return url.startsWith('http') ? url : `${BACKEND_URL}${url}`;
}

type Placement = 'home' | 'talk' | 'mypage';

type AdBanner = {
  id: number;
  image_url: string;
  link_url: string | null;
  placement: Placement;
  enabled: number;
  sort_order: number;
};

const PLACEMENT_LABEL: Record<Placement, string> = { home: 'トレーニング（ホーム）', talk: 'トーク', mypage: 'マイページ' };
const PLACEMENT_DESC: Record<Placement, string> = {
  home: 'Userアプリ下部タブ「トレーニング」の、標高カードの下に表示されます',
  talk: 'Userアプリ下部タブ「トーク」の、スレッド一覧の上部に表示されます',
  mypage: 'Userアプリ下部タブ「マイページ」の、プロフィール欄の下に表示されます',
};
const PLACEMENT_FILTERS: (Placement | 'all')[] = ['all', 'home', 'talk', 'mypage'];

export default function AdBanners() {
  const toast = useToast();
  const [ads, setAds] = useState<AdBanner[]>([]);
  const [filter, setFilter] = useState<Placement | 'all'>('all');
  const [showEdit, setShowEdit] = useState<AdBanner | 'new' | null>(null);
  const [imageUrl, setImageUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [placement, setPlacement] = useState<Placement>('home');
  const [sortOrder, setSortOrder] = useState('0');

  const filteredAds = filter === 'all' ? ads : ads.filter((a) => a.placement === filter);
  const { page, setPage, totalPages, pageItems: visibleAds, total } = usePagination(filteredAds);

  const load = () => api.get<AdBanner[]>('/ads').then(setAds);

  useEffect(() => {
    load();
  }, []);

  const toggleEnabled = async (ad: AdBanner) => {
    await api.patch(`/ads/${ad.id}`, { enabled: ad.enabled ? false : true });
    toast(ad.enabled ? '非表示にしました' : '表示にしました');
    load();
  };

  const changePlacement = async (ad: AdBanner, next: Placement) => {
    await api.patch(`/ads/${ad.id}`, { placement: next });
    toast('表示先を変更しました');
    load();
  };

  const remove = async (ad: AdBanner) => {
    if (!window.confirm('このバナーを削除しますか？')) return;
    await api.delete(`/ads/${ad.id}`);
    toast('削除しました');
    load();
  };

  const openNew = () => {
    setImageUrl('');
    setLinkUrl('');
    setPlacement('home');
    setSortOrder(String(ads.length));
    setShowEdit('new');
  };

  const openEdit = (ad: AdBanner) => {
    setImageUrl(ad.image_url);
    setLinkUrl(ad.link_url || '');
    setPlacement(ad.placement);
    setSortOrder(String(ad.sort_order));
    setShowEdit(ad);
  };

  const onPickFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploading(true);
    try {
      const res = await uploadFile('/ads/upload', 'image', file);
      setImageUrl(res.url);
    } catch (err) {
      toast(err instanceof Error ? err.message : 'アップロードに失敗しました');
    } finally {
      setUploading(false);
    }
  };

  const save = async (e: FormEvent) => {
    e.preventDefault();
    if (!imageUrl.trim()) return;
    const payload = { imageUrl: imageUrl.trim(), linkUrl: linkUrl.trim(), placement, sortOrder: Number(sortOrder) || 0 };
    if (showEdit === 'new') {
      await api.post('/ads', { ...payload, enabled: true });
      toast('バナーを追加しました');
    } else if (showEdit) {
      await api.patch(`/ads/${showEdit.id}`, payload);
      toast('バナーを更新しました');
    }
    setShowEdit(null);
    load();
  };

  return (
    <div>
      <h1 className="page-title">広告管理</h1>
      <p style={{ color: 'var(--text-secondary, #666)', marginTop: -8, marginBottom: 16 }}>
        Userアプリの各画面に表示するバナー広告です。表示先ごとに、有効なものが複数あれば自動でローテーション表示されます。
        編集後はUserアプリを開き直すかしばらく待つと反映されます（最大20秒ほどで自動更新）。
      </p>
      <div className="filter-row">
        {PLACEMENT_FILTERS.map((p) => (
          <button
            key={p}
            className="btn"
            style={filter === p ? { background: 'var(--navy, #00375D)', color: '#fff', borderColor: 'var(--navy, #00375D)' } : undefined}
            onClick={() => setFilter(p)}
          >
            {p === 'all' ? 'すべて' : PLACEMENT_LABEL[p]}
          </button>
        ))}
        <button className="btn btn-primary" style={{ marginLeft: 'auto' }} onClick={openNew}>
          ＋ バナーを追加
        </button>
      </div>
      {filter !== 'all' && (
        <p style={{ color: 'var(--text-secondary, #666)', fontSize: 13, marginTop: -4, marginBottom: 12 }}>{PLACEMENT_DESC[filter]}</p>
      )}
      <table className="table">
        <thead>
          <tr>
            <th>プレビュー</th>
            <th>表示先</th>
            <th>リンク先</th>
            <th>表示順</th>
            <th>状態</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {visibleAds.map((ad) => (
            <tr key={ad.id}>
              <td>
                <img
                  src={resolveUrl(ad.image_url)}
                  alt="banner"
                  style={{ width: 160, height: 43, objectFit: 'cover', borderRadius: 6, cursor: 'pointer' }}
                  onClick={() => openEdit(ad)}
                />
              </td>
              <td>
                <select
                  className="input"
                  style={{ padding: '4px 8px' }}
                  value={ad.placement}
                  onChange={(e) => changePlacement(ad, e.target.value as Placement)}
                >
                  {(Object.keys(PLACEMENT_LABEL) as Placement[]).map((p) => (
                    <option key={p} value={p}>
                      {PLACEMENT_LABEL[p]}
                    </option>
                  ))}
                </select>
              </td>
              <td style={{ maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis' }}>{ad.link_url || '-'}</td>
              <td>{ad.sort_order}</td>
              <td>
                <span className="tag">{ad.enabled ? '表示中' : '非表示'}</span>
              </td>
              <td>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn" style={{ padding: '4px 12px' }} onClick={() => openEdit(ad)}>
                    編集
                  </button>
                  <button className="btn" style={{ padding: '4px 12px' }} onClick={() => toggleEnabled(ad)}>
                    {ad.enabled ? '非表示にする' : '表示する'}
                  </button>
                  <button className="btn" style={{ padding: '4px 12px' }} onClick={() => remove(ad)}>
                    削除
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <Pagination page={page} totalPages={totalPages} total={total} onChange={setPage} />

      {showEdit && (
        <Modal onClose={() => setShowEdit(null)}>
          <form onSubmit={save}>
            <div className="modal-title">{showEdit === 'new' ? 'バナーを追加' : 'バナーを編集'}</div>
            <label className="field-label">表示先</label>
            <select className="input" style={{ width: '100%' }} value={placement} onChange={(e) => setPlacement(e.target.value as Placement)}>
              {(Object.keys(PLACEMENT_LABEL) as Placement[]).map((p) => (
                <option key={p} value={p}>
                  {PLACEMENT_LABEL[p]}
                </option>
              ))}
            </select>

            <label className="field-label">バナー画像</label>
            {imageUrl && (
              <img src={resolveUrl(imageUrl)} alt="preview" style={{ width: '100%', maxHeight: 120, objectFit: 'cover', borderRadius: 6, marginBottom: 8 }} />
            )}
            <input type="file" accept="image/*" onChange={onPickFile} disabled={uploading} />
            {uploading && <div style={{ fontSize: 12, color: 'var(--text-secondary, #666)', marginTop: 4 }}>アップロード中…</div>}
            <label className="field-label" style={{ marginTop: 12 }}>
              画像URL（アップロードすると自動で入ります。外部URLを直接指定することも可能）
            </label>
            <input
              className="input"
              style={{ width: '100%' }}
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://example.com/banner.png"
              required
            />
            <label className="field-label">リンク先URL（タップ時に開くページ・任意）</label>
            <input
              className="input"
              style={{ width: '100%' }}
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://teppen-english.com"
            />
            <label className="field-label">表示順（小さいほど先に表示）</label>
            <input
              className="input"
              type="number"
              style={{ width: '100%' }}
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
            />
            <div className="modal-actions">
              <button type="button" className="btn" onClick={() => setShowEdit(null)}>
                キャンセル
              </button>
              <button type="submit" className="btn btn-primary" disabled={uploading}>
                {showEdit === 'new' ? '追加' : '保存'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
