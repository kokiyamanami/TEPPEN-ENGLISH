import { FormEvent, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api/client';
import { Avatar } from '../components/Avatar';
import { Modal } from '../components/Modal';
import { useToast } from '../context/ToastContext';
import { monthStr, todayStr } from '../utils/date';

type StudentDetailData = {
  student: {
    id: number;
    name: string;
    email: string;
    phone: string;
    avatar_url: string | null;
    group_name: string | null;
    phase: number;
    status: string;
  };
  speakingStats: { date: string; study_min: number; speak_min: number }[];
  monthlyMissions: { id: number; month: string; pass: number; date: string }[];
  phaseHistory: { id: number; phase: number; date: string; listening: number; accuracy: number; fluency: number; clarity: number }[];
  unitSubmissions: { id: number; unit: number; submitted_at: string; status: string }[];
  chatMessages: { id: number; sender: string; text: string; time: string }[];
  phrases: { id: number; text: string; folder_name: string }[];
};

export default function StudentDetail() {
  const { id } = useParams();
  const toast = useToast();
  const [data, setData] = useState<StudentDetailData | null>(null);
  const [showPhaseForm, setShowPhaseForm] = useState(false);
  const [showPhaseConfirm, setShowPhaseConfirm] = useState(false);
  const [phaseForm, setPhaseForm] = useState({ phase: 1, listening: 3, accuracy: 3, fluency: 3, clarity: 3 });
  const [showMonthlyForm, setShowMonthlyForm] = useState(false);
  const [showMonthlyConfirm, setShowMonthlyConfirm] = useState(false);
  const [monthlyForm, setMonthlyForm] = useState({ month: monthStr(), pass: true });
  const [showStars, setShowStars] = useState<StudentDetailData['phaseHistory'][number] | null>(null);
  const [chatInput, setChatInput] = useState('');
  const [notFound, setNotFound] = useState(false);

  const load = () => {
    api
      .get<StudentDetailData>(`/students/${id}`)
      .then((d) => {
        setNotFound(false);
        setData(d);
        setPhaseForm((prev) => ({ ...prev, phase: d.student.phase }));
      })
      .catch(() => setNotFound(true));
  };

  useEffect(() => {
    load();
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (notFound && !data) {
    return (
      <div className="loading-wrap">
        生徒が見つかりません。<Link to="/students">生徒一覧に戻る</Link>
      </div>
    );
  }
  if (!data) return <div className="loading-wrap">読み込み中…</div>;
  const { student } = data;

  const confirmPhase = async () => {
    await api.post(`/students/${id}/phase`, { ...phaseForm, date: todayStr() });
    toast('Phaseを更新しました');
    setShowPhaseConfirm(false);
    setShowPhaseForm(false);
    load();
  };

  const confirmMonthly = async () => {
    await api.post(`/students/${id}/monthly`, { ...monthlyForm, date: todayStr() });
    toast('Monthlyミッション結果を保存しました');
    setShowMonthlyConfirm(false);
    setShowMonthlyForm(false);
    load();
  };

  const approveUnit = async (unitId: number) => {
    await api.post(`/students/${id}/units/${unitId}/approve`);
    toast('提出を承認しました');
    load();
  };

  const sendChat = async (e: FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    await api.post(`/students/${id}/chat`, { text: chatInput.trim() });
    setChatInput('');
    load();
  };

  return (
    <div>
      <div className="breadcrumb">
        <Link to="/students">生徒一覧</Link> › {student.name}
      </div>
      <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <Avatar url={student.avatar_url} name={student.name} size={40} />
        {student.name}
      </h1>

      <div className="grid-2">
        {/* Phase履歴 */}
        <div>
          <div className="section-title">
            Phase履歴
            <button className="btn" onClick={() => setShowPhaseForm(true)}>
              Phaseを変更
            </button>
          </div>
          <div className="card">
            <div style={{ fontSize: 13, marginBottom: 10 }}>
              現在: <strong>Phase {student.phase}</strong>
            </div>
            <table className="table">
              <thead>
                <tr>
                  <th>日付</th>
                  <th>Phase</th>
                  <th>評価</th>
                </tr>
              </thead>
              <tbody>
                {data.phaseHistory.map((p) => (
                  <tr key={p.id}>
                    <td>{p.date}</td>
                    <td>Phase {p.phase}</td>
                    <td>
                      <span className="tag clickable" onClick={() => setShowStars(p)}>
                        詳細を見る
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 基本情報 */}
        <div>
          <div className="section-title">基本情報</div>
          <div className="card">
            <table className="table">
              <tbody>
                <tr>
                  <td style={{ color: 'var(--text-secondary)' }}>氏名</td>
                  <td>{student.name}</td>
                </tr>
                <tr>
                  <td style={{ color: 'var(--text-secondary)' }}>グループ</td>
                  <td>{student.group_name || '未所属'}</td>
                </tr>
                <tr>
                  <td style={{ color: 'var(--text-secondary)' }}>メール</td>
                  <td>{student.email}</td>
                </tr>
                <tr>
                  <td style={{ color: 'var(--text-secondary)' }}>電話番号</td>
                  <td>{student.phone}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Monthlyミッション */}
      <div className="section-title">
        Monthlyミッション
        <button className="btn" onClick={() => setShowMonthlyForm(true)}>
          合否を記録
        </button>
      </div>
      <div className="card" style={{ padding: 0 }}>
        <table className="table">
          <thead>
            <tr>
              <th>月</th>
              <th>結果</th>
              <th>日付</th>
            </tr>
          </thead>
          <tbody>
            {data.monthlyMissions.map((m) => (
              <tr key={m.id}>
                <td>{m.month}</td>
                <td className={m.pass ? 'badge-pass' : 'badge-fail'}>{m.pass ? '合格' : '不合格'}</td>
                <td style={{ color: 'var(--text-secondary)' }}>{m.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 初心者Unit提出 */}
      <div className="section-title">初心者Unit提出</div>
      <div className="card" style={{ padding: 0 }}>
        <table className="table">
          <thead>
            <tr>
              <th>Unit</th>
              <th>提出日</th>
              <th>状態</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {data.unitSubmissions.map((u) => (
              <tr key={u.id} style={u.status === 'pending' ? { background: 'rgba(232,130,95,0.06)' } : undefined}>
                <td>UNIT {u.unit}</td>
                <td>{u.submitted_at}</td>
                <td>{u.status === 'pending' ? '新規提出' : '承認済み'}</td>
                <td>
                  {u.status === 'pending' && (
                    <button className="btn btn-primary" style={{ padding: '4px 12px' }} onClick={() => approveUnit(u.id)}>
                      合格を出す
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {data.unitSubmissions.length === 0 && (
              <tr>
                <td colSpan={4} style={{ color: 'var(--text-secondary)' }}>
                  提出はありません
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="grid-2">
        {/* スピーキング履歴 + チャット */}
        <div>
          <div className="section-title">スピーキング履歴</div>
          <div className="card" style={{ maxHeight: 220, overflowY: 'auto' }}>
            <table className="table">
              <tbody>
                {data.speakingStats.map((s, i) => (
                  <tr key={i}>
                    <td>{s.date}</td>
                    <td>学習{s.study_min}分</td>
                    <td>発話{s.speak_min}分</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="section-title">コーチとのやり取り</div>
          <div className="card">
            <div style={{ maxHeight: 200, overflowY: 'auto', marginBottom: 12 }}>
              {data.chatMessages.map((m) => (
                <div key={m.id} style={{ marginBottom: 8, textAlign: m.sender === 'coach' ? 'right' : 'left' }}>
                  <div
                    style={{
                      display: 'inline-block',
                      background: m.sender === 'coach' ? 'var(--navy)' : 'var(--bg)',
                      color: m.sender === 'coach' ? 'var(--white)' : 'var(--text)',
                      borderRadius: 10,
                      padding: '6px 10px',
                      fontSize: 12,
                      maxWidth: '80%',
                    }}
                  >
                    {m.text}
                  </div>
                </div>
              ))}
            </div>
            <form onSubmit={sendChat} style={{ display: 'flex', gap: 8 }}>
              <input className="input" style={{ flex: 1 }} value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="メッセージを送る" />
              <button className="btn btn-primary">送信</button>
            </form>
          </div>
        </div>

        {/* MYフレーズ */}
        <div>
          <div className="section-title">MYフレーズ集</div>
          <div className="card">
            {data.phrases.map((p) => (
              <div key={p.id} style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 13 }}>{p.text}</div>
                <span className="tag">{p.folder_name}</span>
              </div>
            ))}
            {data.phrases.length === 0 && <div style={{ color: 'var(--text-secondary)', fontSize: 12 }}>登録なし</div>}
          </div>
        </div>
      </div>

      {/* Phase変更フォーム */}
      {showPhaseForm && (
        <Modal onClose={() => setShowPhaseForm(false)}>
          <div className="modal-title">Phaseを変更</div>
          <label className="field-label">変更後Phase</label>
          <select
            className="input"
            style={{ width: '100%' }}
            value={phaseForm.phase}
            onChange={(e) => setPhaseForm({ ...phaseForm, phase: Number(e.target.value) })}
          >
            {[1, 2, 3, 4, 5].map((p) => (
              <option key={p} value={p}>
                Phase {p}
              </option>
            ))}
          </select>
          {(['listening', 'accuracy', 'fluency', 'clarity'] as const).map((k) => (
            <div key={k}>
              <label className="field-label">{{ listening: 'リスニング', accuracy: '正確性', fluency: '流暢性', clarity: '明瞭さ' }[k]}</label>
              <select
                className="input"
                style={{ width: '100%' }}
                value={phaseForm[k]}
                onChange={(e) => setPhaseForm({ ...phaseForm, [k]: Number(e.target.value) })}
              >
                {[1, 2, 3, 4, 5].map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
          ))}
          <div className="modal-actions">
            <button className="btn" onClick={() => setShowPhaseForm(false)}>
              キャンセル
            </button>
            <button className="btn btn-primary" onClick={() => setShowPhaseConfirm(true)}>
              次へ
            </button>
          </div>
        </Modal>
      )}

      {showPhaseConfirm && (
        <Modal onClose={() => setShowPhaseConfirm(false)}>
          <div className="modal-title">この内容で確定しますか？</div>
          <div className="modal-desc">
            Phase {phaseForm.phase} に変更します（リスニング{phaseForm.listening}／正確性{phaseForm.accuracy}／流暢性{phaseForm.fluency}
            ／明瞭さ{phaseForm.clarity}）
          </div>
          <div className="modal-actions">
            <button className="btn" onClick={() => setShowPhaseConfirm(false)}>
              戻る
            </button>
            <button className="btn btn-primary" onClick={confirmPhase}>
              確定する
            </button>
          </div>
        </Modal>
      )}

      {/* Monthly合否フォーム */}
      {showMonthlyForm && (
        <Modal onClose={() => setShowMonthlyForm(false)}>
          <div className="modal-title">Monthlyミッション結果を記録</div>
          <label className="field-label">対象月</label>
          <input
            className="input"
            style={{ width: '100%' }}
            type="month"
            value={monthlyForm.month}
            onChange={(e) => setMonthlyForm({ ...monthlyForm, month: e.target.value })}
          />
          <label className="field-label">結果</label>
          <select
            className="input"
            style={{ width: '100%' }}
            value={monthlyForm.pass ? 'pass' : 'fail'}
            onChange={(e) => setMonthlyForm({ ...monthlyForm, pass: e.target.value === 'pass' })}
          >
            <option value="pass">合格</option>
            <option value="fail">不合格</option>
          </select>
          <div className="modal-actions">
            <button className="btn" onClick={() => setShowMonthlyForm(false)}>
              キャンセル
            </button>
            <button className="btn btn-primary" onClick={() => setShowMonthlyConfirm(true)}>
              次へ
            </button>
          </div>
        </Modal>
      )}

      {showMonthlyConfirm && (
        <Modal onClose={() => setShowMonthlyConfirm(false)}>
          <div className="modal-title">この内容で確定しますか？</div>
          <div className="modal-desc">
            {monthlyForm.month}: {monthlyForm.pass ? '合格' : '不合格'}
          </div>
          <div className="modal-actions">
            <button className="btn" onClick={() => setShowMonthlyConfirm(false)}>
              戻る
            </button>
            <button className="btn btn-primary" onClick={confirmMonthly}>
              確定する
            </button>
          </div>
        </Modal>
      )}

      {/* 達成度スター表示 */}
      {showStars && (
        <Modal onClose={() => setShowStars(null)}>
          <div className="modal-title">
            Phase {showStars.phase} 達成度（{showStars.date}）
          </div>
          {(['listening', 'accuracy', 'fluency', 'clarity'] as const).map((k) => (
            <div key={k} style={{ marginTop: 10 }}>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>
                {{ listening: 'リスニング', accuracy: '正確性', fluency: '流暢性', clarity: '明瞭さ' }[k]}
              </div>
              <div className="star-row">
                {[1, 2, 3, 4, 5].map((n) => (
                  <span key={n} className={`star${n <= showStars[k] ? ' filled' : ''}`}>
                    ★
                  </span>
                ))}
              </div>
            </div>
          ))}
          <div className="modal-actions">
            <button className="btn" onClick={() => setShowStars(null)}>
              閉じる
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
