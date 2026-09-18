import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { api } from '../api/client';

type AdminUser = { id: number; name: string; email: string; role: string; notifyEmail: boolean };

type AuthContextValue = {
  user: AdminUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (patch: Partial<AdminUser>) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .get<AdminUser>('/me')
      .then(setUser)
      .catch(() => localStorage.removeItem('admin_token'))
      .finally(() => setLoading(false));
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.post<{ token: string; user: AdminUser }>('/login', { email, password });
    localStorage.setItem('admin_token', res.token);
    setUser(res.user);
  };

  const logout = () => {
    localStorage.removeItem('admin_token');
    setUser(null);
  };

  const updateUser = (patch: Partial<AdminUser>) => {
    setUser((prev) => (prev ? { ...prev, ...patch } : prev));
  };

  return <AuthContext.Provider value={{ user, loading, login, logout, updateUser }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
