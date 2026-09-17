import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import * as mobileAuth from '../api/mobileAuth';

type SessionContextValue = {
  isAuthenticated: boolean;
  loading: boolean;
  signup: (email: string, password: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    mobileAuth
      .getStoredToken()
      .then((token) => setIsAuthenticated(!!token))
      .finally(() => setLoading(false));
  }, []);

  const signup = async (email: string, password: string) => {
    await mobileAuth.signup(email, password);
    setIsAuthenticated(true);
  };

  const login = async (email: string, password: string) => {
    await mobileAuth.login(email, password);
    setIsAuthenticated(true);
  };

  const logout = async () => {
    await mobileAuth.clearToken();
    setIsAuthenticated(false);
  };

  return (
    <SessionContext.Provider value={{ isAuthenticated, loading, signup, login, logout }}>{children}</SessionContext.Provider>
  );
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used within SessionProvider');
  return ctx;
}
