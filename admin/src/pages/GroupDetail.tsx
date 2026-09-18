import { FormEvent, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api/client';
import { Avatar } from '../components/Avatar';
import { Modal } from '../components/Modal';
import { useToast } from '../context/ToastContext';

type GroupDetailData = {
  group: { id: number; name: string; status: string };
  members: { id: number; name: string; avatar_url: string | null; phase: number; status: string }[];
  dailyStats: { date: string; study_min: number; speak_min: number }[];
  goals: { id: number; week_start: string; study_goal: number; speak_goal: number; achieved: number }[];
  summary: { totalStudy: number; totalSpeak: number };
};

type StudentSearchResult = { id: number; name: string; avatar_url: string | null; group_id: number | null; group_name: string | null };

function isMonday() {
  return new Date().getDay() === 1;
}

export default function GroupDetail() {
  const { id } = useParams();
  const toast = useToast();
  const [data, setData] = useState<GroupDetailData | null>(null);
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [showGoalConfirm, setShowGoalConfirm] = useState(false);
  const [goalForm, setGoalForm] = useState({ studyGoal: 90, speakGoal: 30 });
  const [showAddMember, setShowAddMember] = useState(false);
  const [memberSearch, setMemberSearch] = useState('');
  const [searchResults, setSearchResults] = useState<StudentSearchResult[]>([]);
  const [removeTarget, setRemoveTarget] = useState<{ id: number; name: string } | null>(null);

  const load = () => {
    api.get<GroupDetailData>(`/groups/${id}`).then(setData);
  };

  useEffect(() => {
    load();
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!showAddMember) return;
    const params = new URLSearchParams();
    if (memberSearch) params.set('search', memberSearch);
    api.get<StudentSearchResult[]>(`/students?${params.toString()}`).then(setSearchResults);
  }, [showAddMember, memberSearch]);

  if (!data) return <div className="loading-wrap">読み込み中…</div>;

  const buckets = [...data.dailyStats].reverse().slice(-14);
  const maxVal = Math.max(...buckets.map((b) => b.study_min), 1);

  const confirmGoal = async () => {
    const monday = new Date();
    const day = monday.getDay();
    monday.setDate(monday.getDate() - (day === 0 ? 6 : day - 1));
    await api.post(`/groups/${id}/goals`, { weekStart: monday.toISOString().slice(0, 10), ...goalForm });
    toast('目標を設定しました');
    setShowGoalConfirm(false);
    setShowGoalForm(false);
    load();
  };

  const addMember = async (studentId: number, name: string) => {
    await api.patch(`/students/${studentId}`, { groupId: id });
    toast(`${name}を追加しました`);
    setShowAddMember(false);
    setMemberSearch('');
    load();
  };

  const removeMember = async () => {
    if (!removeTarget) return;
    await api.patch(`/students/${removeTarget.id}`, { groupId: null });
    toast(`${removeTarget.name}をグループから外しました`);
    setRemoveTarget(null);
    load();
  };

  return (
    <div>
      <div className="breadcrumb">
        <Link to="/groups">グループ管理</Link> › {data.group.name}
      </div>
      <h1 className="page-title">{data.group.name}</h1>

      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
        <div className="kpi-card">
          <div className="kpi-label">直近30日 総学習時間</div>
          <div className="kpi-value">{data.summary.totalStudy}分</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">直近30日 総発話時間</div>
          <div className="kpi-value">{data.summary.totalSpeak}分</div>
        </div>
      </div>

      <div className="section-title">学習時間推移（直近14日・日次）</div>
      <div className="card">
        <div className="chart-bars">
          {buckets.map((b, i) => {
            const totalH = Math.round((b.study_min / maxVal) * 120);
            const speakH = b.study_min ? Math.round(totalH * (b.speak_min / b.study_min)) : 0;
            const otherH = totalH - speakH;
            return (
              <div key={i} className="chart-col">
                <div className="chart-bar" style={{ height: Math.max(totalH, 2) }}>
                  <div className="chart-seg-study" style={{ height: otherH }} />
                  <div className="chart-seg-speak" style={{ height: speakH }} />
                </div>
                <div className="chart-label">{b.date.slice(5)}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid-2">
        <div>
          <div className="section-title">
            目標設定
            <button className="btn" onClick={() => setShowGoalForm(true)}>
              目標を設定
            </button>
          </div>
          <div className="card" style={{ padding: 0 }}>
            <table className="table">
              <thead>
                <tr>
                  <th>週</th>
                  <th>学習目標</th>
                  <th>発話目標</th>
                  <th>達成</th>
                </tr>
              </thead>
              <tbody>
                {data.goals.map((g) => (
                  <tr key={g.id}>
                    <td>{g.week_start}</td>
                    <td>{g.study_goal}分/日</td>
                    <td>{g.speak_goal}分/日</td>
                    <td className={g.achieved ? 'badge-pass' : 'badge-fail'}>{g.achieved ? '達成' : '未達成'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <div className="section-title">
            メンバー一覧（{data.members.length}名）
            <button className="btn" onClick={() => setShowAddMember(true)}>
              ＋ メンバーを追加
            </button>
          </div>
          <div className="card" style={{ padding: 0 }}>
            <table className="table">
              <tbody>
                {data.members.map((m) => (
                  <tr key={m.id}>
                    <td>
                      <Link
                        to={`/students/${m.id}`}
                        style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--navy)', fontWeight: 600, textDecoration: 'none' }}
                      >
                        <Avatar url={m.avatar_url} name={m.name} size={24} />
                        {m.name}
                      </Link>
                    </td>
                    <td>Phase {m.phase}</td>
                    <td>{m.status === 'active' ? '有効' : '無効'}</td>
                    <td>
                      <button className="btn" style={{ padding: '4px 12px' }} onClick={() => setRemoveTarget({ id: m.id, name: m.name })}>
                        グループから外す
                      </button>
                    </td>
                  </tr>
                ))}
                {data.members.length === 0 && (
                  <tr>
                    <td colSpan={4} style={{ color: 'var(--text-secondary)' }}>
                      メンバーがいません
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showGoalForm && (
        <Modal onClose={() => setShowGoalForm(false)}>
          <div className="modal-title">目標設定</div>
          <div className="modal-desc">{isMonday() ? '今週の目標として設定します。' : '目標設定は本来月曜日限定の運用です（開発用に常時許可）。'}</div>
          <label className="field-label">学習時間目標（分/日）</label>
          <input
            className="input"
            style={{ width: '100%' }}
            type="number"
            value={goalForm.studyGoal}
            onChange={(e) => setGoalForm({ ...goalForm, studyGoal: Number(e.target.value) })}
          />
          <label className="field-label">発話時間目標（分/日）</label>
          <input
            className="input"
            style={{ width: '100%' }}
            type="number"
            value={goalForm.speakGoal}
            onChange={(e) => setGoalForm({ ...goalForm, speakGoal: Number(e.target.value) })}
          />
          <div className="modal-actions">
            <button className="btn" onClick={() => setShowGoalForm(false)}>
              キャンセル
            </button>
            <button className="btn btn-primary" onClick={() => setShowGoalConfirm(true)}>
              次へ
            </button>
          </div>
        </Modal>
      )}

      {showGoalConfirm && (
        <Modal onClose={() => setShowGoalConfirm(false)}>
          <div className="modal-title">この内容で確定しますか？</div>
          <div className="modal-desc">
            学習{goalForm.studyGoal}分/日・発話{goalForm.speakGoal}分/日 として設定します。
          </div>
          <div className="modal-actions">
            <button className="btn" onClick={() => setShowGoalConfirm(false)}>
              戻る
            </button>
            <button className="btn btn-primary" onClick={confirmGoal}>
              確定する
            </button>
          </div>
        </Modal>
      )}

      {showAddMember && (
        <Modal
          onClose={() => {
            setShowAddMember(false);
            setMemberSearch('');
          }}
        >
          <div className="modal-title">メンバーを追加</div>
          <input
            className="input"
            style={{ width: '100%' }}
            placeholder="名前で検索"
            value={memberSearch}
            onChange={(e) => setMemberSearch(e.target.value)}
            autoFocus
          />
          <div style={{ maxHeight: 320, overflowY: 'auto', marginTop: 12 }}>
            {searchResults
              .filter((s) => String(s.group_id ?? '') !== String(id))
              .map((s) => (
                <div
                  key={s.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '8px 4px',
                    borderBottom: '1px solid var(--border)',
                  }}
                >
                  <Avatar url={s.avatar_url} name={s.name} size={28} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600 }}>{s.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{s.group_name ? `現在: ${s.group_name}` : '未所属'}</div>
                  </div>
                  <button className="btn btn-primary" style={{ padding: '4px 12px' }} onClick={() => addMember(s.id, s.name)}>
                    追加
                  </button>
                </div>
              ))}
            {searchResults.filter((s) => String(s.group_id ?? '') !== String(id)).length === 0 && (
              <div style={{ color: 'var(--text-secondary)', fontSize: 13, padding: '8px 4px' }}>該当する生徒がいません</div>
            )}
          </div>
          <div className="modal-actions">
            <button
              className="btn"
              onClick={() => {
                setShowAddMember(false);
                setMemberSearch('');
              }}
            >
              閉じる
            </button>
          </div>
        </Modal>
      )}

      {removeTarget && (
        <Modal onClose={() => setRemoveTarget(null)}>
          <div className="modal-title">{removeTarget.name}をグループから外しますか？</div>
          <div className="modal-desc">生徒アカウント自体は削除されず、未所属になります。</div>
          <div className="modal-actions">
            <button className="btn" onClick={() => setRemoveTarget(null)}>
              キャンセル
            </button>
            <button className="btn btn-danger" onClick={removeMember}>
              外す
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
