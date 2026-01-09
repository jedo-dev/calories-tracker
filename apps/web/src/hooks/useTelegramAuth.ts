import { useState, useEffect } from 'react';
import { apiClient } from '../api/client';

interface User {
  id: string;
  tgUserId: number;
  username?: string;
}

export function useTelegramAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const tg = (window as any).Telegram?.WebApp;
        if (!tg) {
          setError('Telegram WebApp not available');
          setLoading(false);
          return;
        }

        const initData = tg.initData;
        if (!initData) {
          setError('InitData not available');
          setLoading(false);
          return;
        }

        const response = await apiClient.post('/auth/telegram', { initData });
        const { token, user: userData } = response.data;

        localStorage.setItem('token', token);
        setUser(userData);
      } catch (err: any) {
        setError(err.response?.data?.message || err.message || 'Auth failed');
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  return { user, loading, error };
}

