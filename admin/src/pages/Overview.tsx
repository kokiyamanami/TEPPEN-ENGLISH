import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';

type OverviewData = {
  kpi: { totalStudents: number; activeRate: number; avgSpeakMin: number; monthlyPassRate: number };
  recentLogins: { id: number; name: string; last_login: string; group_name: string }[];
  groupCounts: { id: number; name: string; count: number }[];
};

export default function Overview() {
  const [data, setData] = useState<OverviewData | null>(null);

  useEffect(() => {
    api.get<OverviewData>('/overview').then(setData);
  }, []);

  if (!data) return <div className="loading-wrap">読み込み中…</div>;

  const maxCount = Math.max(...data.groupCounts.map((g) => g.count), 1);

  return (
    <div>
      <h1 className="page-title">ダッシュボード</h1>

      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-label">総生徒数</div>
          <div className="kpi-value">{data.kpi.totalStudents}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">アクティブ率</div>
          <div className="kpi-value">{data.kpi.activeRate}%</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">平均発話時間（30日）</div>
          <div className="kpi-value">{data.kpi.avgSpeakMin}分</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Monthly直近合格率</div>
          <div className="kpi-value">{data.kpi.monthlyPassRate}%</div>
        </div>
      </div>

      <div className="grid-2">
        <div>
          <div className="section-title">最近ログインした生徒</div>
          <div className="card" style={{ padding: 0 }}>
            <table className="table">
              <tbody>
                {data.recentLogins.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <Link to={`/students/${s.id}`} style={{ color: 'var(--navy)', fontWeight: 600, textDecoration: 'none' }}>
                        {s.name}
                      </Link>
                    </td>
                    <td>
                      <span className="tag">{s.group_name ?? '未所属'}</span>
                    </td>
                    <td style={{ textAlign: 'right', color: 'var(--text-secondary)' }}>{s.last_login}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <div className="section-title">グループ別 生徒数</div>
          <div className="card">
            <div className="chart-bars">
              {data.groupCounts.map((g) => (
                <Link key={g.id} to={`/groups/${g.id}`} className="chart-col" style={{ textDecoration: 'none' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text)' }}>{g.count}</div>
                  <div
                    className="chart-bar chart-seg-study"
                    style={{ height: `${Math.max(8, (g.count / maxCount) * 100)}px` }}
                  />
                  <div className="chart-label">{g.name}</div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
