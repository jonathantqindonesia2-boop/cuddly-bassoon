'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';

type UserRole = 'admin' | 'kasir';

type UserState = { name: string; role: UserRole } | null;

type AuthContextValue = {
  user: UserState;
  login: (username: string, password: string) => Promise<string | null>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const credentials: Record<string, { password: string; role: UserRole }> = {
  admin: { password: 'admin123', role: 'admin' },
  user: { password: 'user123', role: 'kasir' }
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserState>(null);

  useEffect(() => {
    const raw = window.localStorage.getItem('kelontong-user');
    if (raw) {
      try {
        setUser(JSON.parse(raw));
      } catch {
        window.localStorage.removeItem('kelontong-user');
      }
    }
  }, []);

  const login = async (username: string, password: string) => {
    const account = credentials[username.trim().toLowerCase()];
    if (!account || account.password !== password) {
      return 'Username atau password salah';
    }

    const authUser: UserState = { name: username.trim().toLowerCase(), role: account.role };
    setUser(authUser);
    window.localStorage.setItem('kelontong-user', JSON.stringify(authUser));
    return null;
  };

  const logout = () => {
    setUser(null);
    window.localStorage.removeItem('kelontong-user');
  };

  const value = useMemo(() => ({ user, login, logout }), [user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
