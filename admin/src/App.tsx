import { Navigate, Route, HashRouter, Routes, useLocation } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import AdBanners from './pages/AdBanners';
import Announcements from './pages/Announcements';
import Coaches from './pages/Coaches';
import GroupDetail from './pages/GroupDetail';
import Groups from './pages/Groups';
import Lectures from './pages/Lectures';
import Login from './pages/Login';
import Materials from './pages/Materials';
import PhraseDecks from './pages/PhraseDecks';
import Overview from './pages/Overview';
import Settings from './pages/Settings';
import Staff from './pages/Staff';
import StudentDetail from './pages/StudentDetail';
import Students from './pages/Students';

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main">{children}</main>
    </div>
  );
}

// adminOnly: 運営管理者のみ開けるページ（コーチはダッシュボードへ戻す）
function RequireAuth({ children, adminOnly = false }: { children: React.ReactNode; adminOnly?: boolean }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <div className="loading-wrap">読み込み中…</div>;
  if (!user) return <Navigate to="/login" replace />;
  // 初期パスワードのままのアカウントは、設定画面でパスワードを変更するまで他のページを開けない
  if (user.mustChangePassword && location.pathname !== '/settings') return <Navigate to="/settings" replace />;
  if (adminOnly && user.role !== 'admin') return <Navigate to="/overview" replace />;
  return <Shell>{children}</Shell>;
}

export default function App() {
  return (
    <HashRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/overview"
              element={
                <RequireAuth>
                  <Overview />
                </RequireAuth>
              }
            />
            <Route
              path="/students"
              element={
                <RequireAuth>
                  <Students />
                </RequireAuth>
              }
            />
            <Route
              path="/students/:id"
              element={
                <RequireAuth>
                  <StudentDetail />
                </RequireAuth>
              }
            />
            <Route
              path="/groups"
              element={
                <RequireAuth>
                  <Groups />
                </RequireAuth>
              }
            />
            <Route
              path="/groups/:id"
              element={
                <RequireAuth>
                  <GroupDetail />
                </RequireAuth>
              }
            />
            <Route
              path="/coaches"
              element={
                <RequireAuth adminOnly>
                  <Coaches />
                </RequireAuth>
              }
            />
            <Route
              path="/phrase-decks"
              element={
                <RequireAuth adminOnly>
                  <PhraseDecks />
                </RequireAuth>
              }
            />
            <Route
              path="/materials"
              element={
                <RequireAuth adminOnly>
                  <Materials />
                </RequireAuth>
              }
            />
            <Route
              path="/announcements"
              element={
                <RequireAuth adminOnly>
                  <Announcements />
                </RequireAuth>
              }
            />
            <Route
              path="/lectures"
              element={
                <RequireAuth adminOnly>
                  <Lectures />
                </RequireAuth>
              }
            />
            <Route
              path="/ads"
              element={
                <RequireAuth adminOnly>
                  <AdBanners />
                </RequireAuth>
              }
            />
            <Route
              path="/settings"
              element={
                <RequireAuth>
                  <Settings />
                </RequireAuth>
              }
            />
            <Route
              path="/staff"
              element={
                <RequireAuth adminOnly>
                  <Staff />
                </RequireAuth>
              }
            />
            <Route path="*" element={<Navigate to="/overview" replace />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </HashRouter>
  );
}
