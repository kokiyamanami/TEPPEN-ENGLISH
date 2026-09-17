import { FormEvent, useEffect, useState } from 'react';
import { api } from '../api/client';
import { Modal } from '../components/Modal';
import { useToast } from '../context/ToastContext';

type AdBanner = {
  id: number;
  image_url: string;
  link_url: string | null;
  enabled: number;
  sort_order: number;
};

export default function AdBanners() {
  const toast = useToast();
  const [ads, setAds] = useState<AdBanner[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [sortOrder, setSortOrder] = useState('0');

  const load = () => api.get<AdBanner[]>('/ads').then(setAds);

  useEffect(() => {
    load();
  }, []);

  const toggleEnabled = async (ad: AdBanner) => {
    await api.patch(`/ads/${ad.id}`, { enabled: ad.enabled ? false : true });
    toast(ad.enabled ? '非表示にしました' : '表示にしました');
    load();
  };

  const remove = async (ad: AdBanner) => {
    if (!window.confirm('このバナーを削除しますか？')) return;
    await api.delete(`/ads/${ad.id}`);
    toast('削除しました');
    load();
  };

  const create = async (e: FormEvent) => {
    e.preventDefault();
    if (!imageUrl.trim()) return;
    await api.post('/ads', {
      imageUrl: imageUrl.trim(),
      linkUrl: linkUrl.trim(),
      enabled: true,
      sortOrder: Number(sortOrder) || 0,
    });
    toast('バナーを追加しました');
    setShowCreate(false);
    setImageUrl('');
    setLinkUrl('');
    setSortOrder('0');
    load();
  };

  return (
    <div>
      <h1 className="page-title">広告管理</h1>
      <p style={{ color: 'var(--text-secondary, #666)', marginTop: -8, marginBottom: 16 }}>
        Userアプリのホーム画面に表示するバナー広告です。有効なものが複数ある場合は自動でローテーション表示されます。
      </p>
      <div className="filter-row">
        <button className="btn btn-primary" style={{ marginLeft: 'auto' }} onClick={() => setShowCreate(true)}>
          ＋ バナーを追加
        </button>
      </div>
      <table className="table">
        <thead>
          <tr>
            <th>プレビュー</th>
            <th>リンク先</th>
            <th>表示順</th>
            <th>状態</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {ads.map((ad) => (
            <tr key={ad.id}>
              <td>
                <img src={ad.image_url} alt="banner" style={{ width: 160, height: 43, objectFit: 'cover', borderRadius: 6 }} />
              </td>
              <td style={{ maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis' }}>{ad.link_url || '-'}</td>
              <td>{ad.sort_order}</td>
              <td>
                <span className="tag">{ad.enabled ? '表示中' : '非表示'}</span>
              </td>
              <td style={{ display: 'flex', gap: 8 }}>
                <button className="btn" style={{ padding: '4px 12px' }} onClick={() => toggleEnabled(ad)}>
                  {ad.enabled ? '非表示にする' : '表示する'}
                </button>
                <button className="btn" style={{ padding: '4px 12px' }} onClick={() => remove(ad)}>
                  削除
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {showCreate && (
        <Modal onClose={() => setShowCreate(false)}>
          <form onSubmit={create}>
            <div className="modal-title">バナーを追加</div>
            <label className="field-label">画像URL</label>
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
              <button type="button" className="btn" onClick={() => setShowCreate(false)}>
                キャンセル
              </button>
              <button type="submit" className="btn btn-primary">
                追加
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
