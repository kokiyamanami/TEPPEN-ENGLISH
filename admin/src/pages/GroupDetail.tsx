import { FormEvent, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api/client';
import { Modal } from '../components/Modal';
import { useToast } from '../context/ToastContext';

type GroupDetailData = {
  group: { id: number; name: string; status: string };
  members: { id: number; name: string; phase: number; status: string }[];
  dailyStats: { date: string; study_min: number; speak_min: number }[];
  goals: { id: number; week_start: string; study_goal: number; speak_goal: number; achieved: number }[];
  summary: { totalStudy: number; totalSpeak: number };
};

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

  const load = () => {
    api.get<GroupDetailData>(`/groups/${id}`).then(setData);
  };

  useEffect(() => {
    load();
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

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
          <div className="section-title">メンバー一覧</div>
          <div className="card" style={{ padding: 0 }}>
            <table className="table">
              <tbody>
                {data.members.map((m) => (
                  <tr key={m.id}>
                    <td>
                      <Link to={`/students/${m.id}`} style={{ color: 'var(--navy)', fontWeight: 600, textDecoration: 'none' }}>
                        {m.name}
                      </Link>
                    </td>
                    <td>Phase {m.phase}</td>
                    <td>{m.status === 'active' ? '有効' : '無効'}</td>
                  </tr>
                ))}
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
    </div>
  );
}
