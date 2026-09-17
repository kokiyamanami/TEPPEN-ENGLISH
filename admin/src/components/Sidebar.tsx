import { NavLink, useNavigate } from 'react-router-dom';
import logoWhite from '../assets/logo-white.png';
import { useAuth } from '../context/AuthContext';

const MAIN_LINKS = [
  { to: '/overview', label: 'ダッシュボード' },
  { to: '/students', label: '生徒一覧' },
  { to: '/groups', label: 'グループ管理' },
];

const OPS_LINKS = [
  { to: '/coaches', label: 'コーチ管理' },
  { to: '/materials', label: '教材管理' },
  { to: '/announcements', label: 'お知らせ管理' },
  { to: '/ads', label: '広告管理' },
  { to: '/settings', label: '設定' },
];

export function Sidebar() {
  const { logout } = useAuth();
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
      {OPS_LINKS.map((l) => (
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
