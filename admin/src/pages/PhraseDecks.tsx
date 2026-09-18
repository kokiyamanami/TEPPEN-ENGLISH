import { FormEvent, useEffect, useState } from 'react';
import { api } from '../api/client';
import { Modal } from '../components/Modal';
import { useToast } from '../context/ToastContext';

type Deck = {
  id: number;
  name: string;
  level: number;
  content_type: 'phrase' | 'word';
  item_count: number;
  student_count: number;
};
type Item = { id: number; text: string; text_jp: string };

type Form = { id: number | null; name: string; level: number; contentType: 'phrase' | 'word'; itemsText: string };
const EMPTY: Form = { id: null, name: '', level: 1, contentType: 'phrase', itemsText: '' };

// 1行に「英語 | 日本語」の形式で入力する
const toText = (items: Item[]) => items.map((i) => (i.text_jp ? `${i.text} | ${i.text_jp}` : i.text)).join('\n');
const parseText = (t: string) =>
  t
    .split('\n')
    .map((line) => {
      const [en, ...jp] = line.split('|');
      return { text: (en || '').trim(), textJP: jp.join('|').trim() };
    })
    .filter((i) => i.text);

export default function PhraseDecks() {
  const toast = useToast();
  const [decks, setDecks] = useState<Deck[]>([]);
  const [form, setForm] = useState<Form | null>(null);
  const [saving, setSaving] = useState(false);

  const load = () => api.get<Deck[]>('/phrase-decks').then(setDecks);
  useEffect(() => {
    load();
  }, []);

  const openEdit = async (d: Deck) => {
    const items = await api.get<Item[]>(`/phrase-decks/${d.id}/items`);
    setForm({ id: d.id, name: d.name, level: d.level, contentType: d.content_type, itemsText: toText(items) });
  };

  const save = async (e: FormEvent) => {
    e.preventDefault();
    if (!form) return;
    setSaving(true);
    try {
      const body = { name: form.name, level: form.level, contentType: form.contentType };
      const id = form.id ?? (await api.post<{ id: number }>('/phrase-decks', body)).id;
      if (form.id) await api.patch(`/phrase-decks/${form.id}`, body);
      await api.put(`/phrase-decks/${id}/items`, { items: parseText(form.itemsText) });
      toast('教材を保存しました（生徒のアプリには次回表示時に反映されます）');
      setForm(null);
      load();
    } catch (err) {
      toast(err instanceof Error ? err.message : '保存に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (d: Deck) => {
    if (!window.confirm(`「${d.name}」を削除しますか？\n配布済みの生徒のフォルダとフレーズも削除されます。`)) return;
    await api.delete(`/phrase-decks/${d.id}`);
    toast('教材を削除しました');
    load();
  };

  return (
    <div>
      <h1 className="page-title">フレーズ教材</h1>
      <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 12 }}>
        アプリの「MYフレーズ」の<b>運営提供</b>に表示される教材です。生徒のレベル（Phase）に合った教材が、オンボーディング完了後に自動で配布されます。
        なお<b>カスタマイズ教材</b>は、生徒のプロフィールからAIが自動で作るため、ここでの管理は不要です。
      </p>
      <div className="filter-row">
        <button className="btn btn-primary" style={{ marginLeft: 'auto' }} onClick={() => setForm(EMPTY)}>
          ＋ 教材を追加
        </button>
      </div>
      <table className="table">
        <thead>
          <tr>
            <th>区分</th>
            <th>教材名</th>
            <th>対象レベル</th>
            <th>項目数</th>
            <th>配布済み生徒</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {decks.map((d) => (
            <tr key={d.id}>
              <td>
                <span className="tag">{d.content_type === 'word' ? '単語' : 'フレーズ'}</span>
              </td>
              <td style={{ fontWeight: 600 }}>{d.name}</td>
              <td>Phase {d.level}</td>
              <td>{d.item_count}</td>
              <td>{d.student_count}人</td>
              <td>
                <button className="btn" style={{ padding: '4px 12px', marginRight: 6 }} onClick={() => openEdit(d)}>
                  編集
                </button>
                <button className="btn" style={{ padding: '4px 12px' }} onClick={() => remove(d)}>
                  削除
                </button>
              </td>
            </tr>
          ))}
          {decks.length === 0 && (
            <tr>
              <td colSpan={6}>教材がありません</td>
            </tr>
          )}
        </tbody>
      </table>

      {form && (
        <Modal onClose={() => setForm(null)}>
          <form onSubmit={save}>
            <div className="modal-title">{form.id ? '教材を編集' : '教材を追加'}</div>
            <label className="field-label">教材名（アプリのフォルダ名）</label>
            <input className="input" style={{ width: '100%' }} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            <label className="field-label">区分（アプリの「フレーズ」「単語」タブ）</label>
            <select className="input" style={{ width: '100%' }} value={form.contentType} onChange={(e) => setForm({ ...form, contentType: e.target.value as Form['contentType'] })}>
              <option value="phrase">フレーズ</option>
              <option value="word">単語</option>
            </select>
            <label className="field-label">対象レベル（Phase）</label>
            <select className="input" style={{ width: '100%' }} value={form.level} onChange={(e) => setForm({ ...form, level: Number(e.target.value) })}>
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>
                  Phase {n}
                </option>
              ))}
            </select>
            <label className="field-label">単語・フレーズ（1行に1つ。「英語 | 日本語」の形式）</label>
            <textarea
              className="input"
              style={{ width: '100%', minHeight: 200, fontFamily: 'inherit' }}
              value={form.itemsText}
              onChange={(e) => setForm({ ...form, itemsText: e.target.value })}
              placeholder={'follow up | 追って連絡する\nkeep me posted | 進捗を教えてください'}
            />
            <div className="modal-actions">
              <button type="button" className="btn" onClick={() => setForm(null)}>
                キャンセル
              </button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                保存
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
