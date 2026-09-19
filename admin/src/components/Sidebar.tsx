import { NavLink, useNavigate } from 'react-router-dom';
import logoWhite from '../assets/logo-white.png';
import { useAuth } from '../context/AuthContext';

const MAIN_LINKS = [
  { to: '/overview', label: 'ダッシュボード' },
  { to: '/students', label: '生徒一覧' },
  { to: '/groups', label: 'グループ管理' },
];

// adminOnly: 運営管理者のみ表示・操作できるメニュー（サーバー側でも同じ制限をかけている）
const OPS_LINKS = [
  { to: '/coaches', label: 'コーチ管理', adminOnly: true },
  { to: '/materials', label: '教材管理', adminOnly: true },
  { to: '/phrase-decks', label: 'フレーズ教材', adminOnly: true },
  { to: '/lectures', label: '動画管理', adminOnly: true },
  { to: '/announcements', label: 'お知らせ管理', adminOnly: true },
  { to: '/ads', label: '広告管理', adminOnly: true },
  { to: '/staff', label: 'スタッフ管理', adminOnly: true },
  { to: '/settings', label: '設定', adminOnly: false },
];

export function Sidebar() {
  const { user, logout } = useAuth();
  const opsLinks = OPS_LINKS.filter((l) => !l.adminOnly || user?.role === 'admin');
  const navigate = useNavigate();

  return (
    <nav className="sidebar">
      <div className="sidebar-brand">
        <img src={logoWhite} alt="TEPPEN ENGLISH" className="sidebar-logo" />
        <span className="sidebar-brand-sub">管理画面</span>
      </div>
      <div className="sidebar-group-label">メイン</div>
      {MAIN_LINKS.map((l) => (
        <NavLink key={l.to} to={l.to} className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}>
          {l.label}
        </NavLink>
      ))}
      <div className="sidebar-group-label">運営</div>
      {opsLinks.map((l) => (
        <NavLink key={l.to} to={l.to} className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}>
          {l.label}
        </NavLink>
      ))}
      <div className="sidebar-footer">
        <button
          className="sidebar-link"
          onClick={() => {
            logout();
            navigate('/login');
          }}
        >
          ログアウト
        </button>
      </div>
    </nav>
  );
}
