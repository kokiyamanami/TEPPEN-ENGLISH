import { ChangeEvent, FormEvent, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { Avatar } from '../components/Avatar';
import { Modal } from '../components/Modal';
import { Pagination } from '../components/Pagination';
import { useToast } from '../context/ToastContext';
import { usePagination } from '../hooks/usePagination';

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
type BulkRow = { name: string; email: string; phone: string };
type BulkResult = { row: number; ok: boolean; id?: number; error?: string };

// CSVの1行を name,email,phone のカンマ区切りとしてパースする（簡易パーサー、引用符内カンマ等は非対応）
function parseCsv(text: string): BulkRow[] {
  // ExcelがUTF-8で保存したCSVは先頭にBOMが付くため除去する
  return text
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !/^name\s*,/i.test(line)) // ヘッダー行を許容してスキップ
    .map((line) => {
      const [name = '', email = '', phone = ''] = line.split(',').map((v) => v.trim());
      return { name, email, phone };
    })
    .filter((r) => r.name);
}

export default function Students() {
  const toast = useToast();
  const [students, setStudents] = useState<Student[]>([]);
  const { page, setPage, totalPages, pageItems, total } = usePagination(students);
  const [groups, setGroups] = useState<Group[]>([]);
  const [search, setSearch] = useState('');
  const [groupFilter, setGroupFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [popupStudent, setPopupStudent] = useState<Student | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newGroupId, setNewGroupId] = useState('');
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [bulkRows, setBulkRows] = useState<BulkRow[]>([]);
  const [bulkGroupId, setBulkGroupId] = useState('');
  const [bulkResults, setBulkResults] = useState<BulkResult[] | null>(null);

  // 検索を素早く打ち替えた時に、遅れて返ってきた古い結果で一覧が上書きされないようにする
  const requestSeq = useRef(0);
  const load = () => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (groupFilter) params.set('groupId', groupFilter);
    if (statusFilter) params.set('status', statusFilter);
    const seq = ++requestSeq.current;
    api.get<Student[]>(`/students?${params.toString()}`).then((rows) => {
      if (seq === requestSeq.current) setStudents(rows);
    });
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

  const toggleSelectOne = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectPage = () => {
    const pageIds = pageItems.map((s) => s.id);
    const allSelected = pageIds.every((id) => selected.has(id));
    setSelected((prev) => {
      const next = new Set(prev);
      pageIds.forEach((id) => (allSelected ? next.delete(id) : next.add(id)));
      return next;
    });
  };

  const bulkSetStatus = async (status: string) => {
    if (selected.size === 0) return;
    await api.post('/students/bulk-status', { ids: Array.from(selected), status });
    toast(`${selected.size}件を${status === 'active' ? '有効化' : '無効化'}しました`);
    setSelected(new Set());
    load();
  };

  const onPickCsv = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const text = await file.text();
    setBulkRows(parseCsv(text));
    setBulkResults(null);
  };

  const submitBulkImport = async () => {
    if (bulkRows.length === 0) return;
    const rows = bulkRows.map((r) => ({ ...r, groupId: bulkGroupId || null }));
    const res = await api.post<{ results: BulkResult[]; createdCount: number }>('/students/bulk', { rows });
    setBulkResults(res.results);
    toast(`${res.createdCount}件を登録しました`);
    load();
  };

  const closeBulkImport = () => {
    setShowBulkImport(false);
    setBulkRows([]);
    setBulkGroupId('');
    setBulkResults(null);
  };

  const allPageSelected = pageItems.length > 0 && pageItems.every((s) => selected.has(s.id));

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
        <button className="btn" style={{ marginLeft: 'auto' }} onClick={() => setShowBulkImport(true)}>
          CSV一括登録
        </button>
        <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
          ＋ 生徒を追加
        </button>
      </div>

      {selected.size > 0 && (
        <div className="filter-row" style={{ background: 'rgba(232,130,95,0.08)', borderRadius: 8, padding: '8px 12px' }}>
          <span style={{ fontSize: 13, fontWeight: 600 }}>{selected.size}件選択中</span>
          <button className="btn" onClick={() => bulkSetStatus('active')}>
            一括で有効化
          </button>
          <button className="btn" onClick={() => bulkSetStatus('inactive')}>
            一括で無効化
          </button>
          <button className="btn" style={{ marginLeft: 'auto' }} onClick={() => setSelected(new Set())}>
            選択解除
          </button>
        </div>
      )}

      <table className="table">
        <thead>
          <tr>
            <th style={{ width: 32 }}>
              <input type="checkbox" checked={allPageSelected} onChange={toggleSelectPage} />
            </th>
            <th>氏名</th>
            <th>グループ</th>
            <th>発話時間（週）</th>
            <th>Monthlyミッション</th>
            <th>最終ログイン</th>
            <th>状態</th>
          </tr>
        </thead>
        <tbody>
          {pageItems.map((s) => {
            const latest = s.monthlyMissions[0];
            return (
              <tr key={s.id}>
                <td>
                  <input type="checkbox" checked={selected.has(s.id)} onChange={() => toggleSelectOne(s.id)} />
                </td>
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
      <Pagination page={page} totalPages={totalPages} total={total} onChange={setPage} />

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

      {showBulkImport && (
        <Modal onClose={closeBulkImport}>
          <div className="modal-title">CSV一括登録</div>
          <div className="modal-desc">
            1行1名、「氏名,メールアドレス,電話番号」のカンマ区切り（メール・電話は空欄可）。ヘッダー行があっても構いません。
          </div>
          <input type="file" accept=".csv,text/csv" onChange={onPickCsv} />

          {bulkRows.length > 0 && !bulkResults && (
            <>
              <label className="field-label">追加先グループ（任意・全件共通）</label>
              <select className="input" style={{ width: '100%' }} value={bulkGroupId} onChange={(e) => setBulkGroupId(e.target.value)}>
                <option value="">未所属</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
              <div style={{ maxHeight: 220, overflowY: 'auto', marginTop: 12, fontSize: 12 }}>
                {bulkRows.map((r, i) => (
                  <div key={i} style={{ padding: '4px 0', borderBottom: '1px solid var(--border)' }}>
                    {i + 1}. {r.name} {r.email && `（${r.email}）`}
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-secondary)' }}>{bulkRows.length}件を読み込みました</div>
            </>
          )}

          {bulkResults && (
            <div style={{ maxHeight: 220, overflowY: 'auto', marginTop: 12, fontSize: 12 }}>
              {bulkResults.map((r) => (
                <div key={r.row} style={{ padding: '4px 0', color: r.ok ? 'var(--success, green)' : 'var(--danger)' }}>
                  {r.row}行目: {r.ok ? '登録しました' : `失敗（${r.error}）`}
                </div>
              ))}
            </div>
          )}

          <div className="modal-actions">
            <button type="button" className="btn" onClick={closeBulkImport}>
              閉じる
            </button>
            {!bulkResults && (
              <button type="button" className="btn btn-primary" disabled={bulkRows.length === 0} onClick={submitBulkImport}>
                {bulkRows.length}件を登録する
              </button>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
