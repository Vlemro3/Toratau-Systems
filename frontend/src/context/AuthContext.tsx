/**
 * Контекст авторизации — хранит текущего пользователя и токен.
 */
import { createContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { User } from '../types';
import * as authApi from '../api/auth';
import type { RegisterRequest } from '../api/auth';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => void;
  setUser: (u: User) => void;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isForeman: boolean;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  loading: true,
  login: async () => {},
  register: async () => {},
  logout: () => {},
  setUser: () => {},
  isAdmin: false,
  isSuperAdmin: false,
  isForeman: false,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  /** Попытка восстановить сессию при загрузке */
  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    authApi
      .getMe()
      .then((u) => setUser(u))
      .catch(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken(null);
      })
      .finally(() => setLoading(false));
  }, [token]);

  const login = useCallback(async (username: string, password: string) => {
    const resp = await authApi.login(username, password);
    localStorage.setItem('token', resp.access_token);
    localStorage.setItem('user', JSON.stringify(resp.user));
    setToken(resp.access_token);
    setUser(resp.user);
  }, []);

  const register = useCallback(async (data: RegisterRequest) => {
    const resp = await authApi.register(data);
    localStorage.setItem('token', resp.access_token);
    localStorage.setItem('user', JSON.stringify(resp.user));
    setToken(resp.access_token);
    setUser(resp.user);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  }, []);

  const isAdmin = user?.role === 'admin';
  const isSuperAdmin = user?.role === 'superAdmin';
  const isForeman = user?.role === 'foreman';

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, setUser, isAdmin, isSuperAdmin, isForeman }}>
      {children}
    </AuthContext.Provider>
  );
}
