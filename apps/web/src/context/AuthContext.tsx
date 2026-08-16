import React, { createContext, useContext, useEffect, useState } from 'react';
import { apiClient } from '../api/client';

interface User {
  id: string;
  email?: string;
  username?: string;
  tgUserId?: number;
  role?: string;
  emailVerified?: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, username?: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }

    apiClient
      .get('/auth/me')
      .then((res) => setUser(res.data))
      .catch(() => {
        localStorage.removeItem('token');
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const refreshMe = async (fallback: User) => {
    // /auth/me carries fields the login response lacks (e.g. role)
    try {
      const res = await apiClient.get('/auth/me');
      setUser(res.data);
    } catch {
      setUser(fallback);
    }
  };

  const login = async (email: string, password: string) => {
    const res = await apiClient.post('/auth/login', { email, password });
    const { token, user: userData } = res.data;
    localStorage.setItem('token', token);
    setUser(userData);
    await refreshMe(userData);
  };

  const register = async (email: string, password: string, username?: string) => {
    const res = await apiClient.post('/auth/register', { email, password, username });
    const { token, user: userData } = res.data;
    localStorage.setItem('token', token);
    setUser(userData);
    await refreshMe(userData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
