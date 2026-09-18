import { FormEvent, useEffect, useState } from 'react';
import { api } from '../api/client';
import { Modal } from '../components/Modal';
import { useToast } from '../context/ToastContext';

type Deck = {
  id: number;
  kind: 'official' | 'curated';
  name: string;
  level: number | null;
  attr: string | null;
  attr_value: string | null;
  item_count: number;
  student_count: number;
};
type Item = { id: number; text: string; text_jp: string };

// アプリのオンボーディングの選択肢と同じ
const JOB_OPTIONS = ['営業', 'マーケティング', 'エンジニア', '人事', '経理・財務', '企画', 'カスタマーサポート', 'コンサルタント', '経営・役員'];
const HOBBY_OPTIONS = ['読書', '映画鑑賞', '旅行', 'スポーツ観戦', 'ゴルフ', '料理', '音楽', 'ゲーム', 'カフェ巡り', 'ランニング', 'ヨガ', '写真'];
const ATTR_LABEL: Record<string, string> = { job: '職業', hobby: '趣味', personality: '性格', career: '経歴' };

type Form = { id: number | null; kind: 'official' | 'curated'; name: string; level: number; attr: string; attrValue: string; itemsText: string };
const EMPTY: Form = { id: null, kind: 'official', name: '', level: 1, attr: 'job', attrValue: JOB_OPTIONS[0], itemsText: '' };

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
    setForm({ id: d.id, kind: d.kind, name: d.name, level: d.level ?? 1, attr: d.attr ?? 'job', attrValue: d.attr_value ?? '', itemsText: toText(items) });
  };

  const save = async (e: FormEvent) => {
    e.preventDefault();
    if (!form) return;
    setSaving(true);
    try {
      const body = { kind: form.kind, name: form.name, level: form.level, attr: form.attr, attrValue: form.attrValue };
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

  const condition = (d: Deck) => (d.kind === 'official' ? `レベル Phase ${d.level}` : `${ATTR_LABEL[d.attr ?? ''] ?? ''}: ${d.attr_value}`);
  const setAttr = (attr: string) =>
    setForm((f) => f && { ...f, attr, attrValue: attr === 'job' ? JOB_OPTIONS[0] : attr === 'hobby' ? HOBBY_OPTIONS[0] : '' });

  return (
    <div>
      <h1 className="page-title">フレーズ教材</h1>
      <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 12 }}>
        アプリの「MYフレーズ」に表示される教材です。<b>運営提供</b>は生徒のレベル（Phase）ごと、<b>カスタマイズ教材</b>はプロフィール（職業・趣味・性格・経歴）が条件に当てはまる生徒に自動で配布されます。
      </p>
      <div className="filter-row">
        <button className="btn btn-primary" style={{ marginLeft: 'auto' }} onClick={() => setForm(EMPTY)}>
          ＋ 教材を追加
        </button>
      </div>
      <table className="table">
        <thead>
          <tr>
            <th>種類</th>
            <th>教材名</th>
            <th>配布条件</th>
            <th>項目数</th>
            <th>配布済み生徒</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {decks.map((d) => (
            <tr key={d.id}>
              <td>
                <span className="tag">{d.kind === 'official' ? '運営提供' : 'カスタマイズ教材'}</span>
              </td>
              <td style={{ fontWeight: 600 }}>{d.name}</td>
              <td>{condition(d)}</td>
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
            <label className="field-label">種類</label>
            <select className="input" style={{ width: '100%' }} value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value as Form['kind'] })}>
              <option value="official">運営提供（レベル別）</option>
              <option value="curated">カスタマイズ教材（プロフィール連動）</option>
            </select>
            <label className="field-label">教材名（アプリのフォルダ名）</label>
            <input className="input" style={{ width: '100%' }} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            {form.kind === 'official' ? (
              <>
                <label className="field-label">対象レベル（Phase）</label>
                <select className="input" style={{ width: '100%' }} value={form.level} onChange={(e) => setForm({ ...form, level: Number(e.target.value) })}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <option key={n} value={n}>
                      Phase {n}
                    </option>
                  ))}
                </select>
              </>
            ) : (
              <>
                <label className="field-label">プロフィールの項目</label>
                <select className="input" style={{ width: '100%' }} value={form.attr} onChange={(e) => setAttr(e.target.value)}>
                  {Object.entries(ATTR_LABEL).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
                <label className="field-label">{form.attr === 'job' || form.attr === 'hobby' ? '該当する選択肢' : '含まれるキーワード（例: 慎重、海外駐在）'}</label>
                {form.attr === 'job' || form.attr === 'hobby' ? (
                  <select className="input" style={{ width: '100%' }} value={form.attrValue} onChange={(e) => setForm({ ...form, attrValue: e.target.value })}>
                    {(form.attr === 'job' ? JOB_OPTIONS : HOBBY_OPTIONS).map((o) => (
                      <option key={o}>{o}</option>
                    ))}
                  </select>
                ) : (
                  <input className="input" style={{ width: '100%' }} value={form.attrValue} onChange={(e) => setForm({ ...form, attrValue: e.target.value })} required />
                )}
              </>
            )}
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
