import { Navigate, Route, HashRouter, Routes } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import Announcements from './pages/Announcements';
import Coaches from './pages/Coaches';
import GroupDetail from './pages/GroupDetail';
import Groups from './pages/Groups';
import Login from './pages/Login';
import Materials from './pages/Materials';
import Overview from './pages/Overview';
import Settings from './pages/Settings';
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

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-wrap">読み込み中…</div>;
  if (!user) return <Navigate to="/login" replace />;
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
                <RequireAuth>
                  <Coaches />
                </RequireAuth>
              }
            />
            <Route
              path="/materials"
              element={
                <RequireAuth>
                  <Materials />
                </RequireAuth>
              }
            />
            <Route
              path="/announcements"
              element={
                <RequireAuth>
                  <Announcements />
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
            <Route path="*" element={<Navigate to="/overview" replace />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </HashRouter>
  );
}
