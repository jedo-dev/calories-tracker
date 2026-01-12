import { useEffect, useState } from 'react';
import { apiClient } from '../api/client';
import { useTelegramAuth } from '../hooks/useTelegramAuth';
import { t } from '../i18n';
import { useTheme } from '../theme/useTheme';
import { Card } from '../ui/Card';
import { Text } from '../ui/Text';
import { Button } from '../ui/Button';
import { Header } from '../widget/Header/Header';

interface LeaderboardItem {
  rank: number;
  user: {
    id: string;
    displayName: string;
    username?: string;
    avatarEmoji: string;
  };
  xpWeek: number;
}

interface LeaderboardResponse {
  weekKey: string;
  me?: {
    rank: number;
    xpWeek: number;
  };
  items: LeaderboardItem[];
}

export function LeaguePage() {
  const { loading: loadingUser, error: errorUser } = useTelegramAuth();
  const theme = useTheme();
  const [mode, setMode] = useState<'friends' | 'global'>('friends');
  const [data, setData] = useState<LeaderboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadLeaderboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const endpoint = mode === 'friends' ? '/leaderboard/week/friends' : '/leaderboard/week/global';
      const response = await apiClient.get(endpoint);
      setData(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeaderboard();
  }, [mode]);

  if (loadingUser) {
    return (
      <div style={{ padding: theme.spacing.lg, textAlign: 'center' }}>
        <Text>{t('common.loading')}</Text>
      </div>
    );
  }

  if (errorUser) {
    return (
      <div style={{ padding: theme.spacing.lg, textAlign: 'center' }}>
        <Text>{t('common.error')}: {errorUser}</Text>
      </div>
    );
  }

  return (
    <div style={{ padding: theme.spacing.lg, maxWidth: '600px', margin: '0 auto', minHeight: '100vh', backgroundColor: theme.palette.bg }}>
     <Header />

      <div style={{ display: 'flex', gap: theme.spacing.sm, marginBottom: theme.spacing.lg }}>
        <Button
          variant={mode === 'friends' ? 'primary' : 'secondary'}
          onClick={() => setMode('friends')}
          style={{ flex: 1 }}
        >
          Друзья
        </Button>
        <Button
          variant={mode === 'global' ? 'primary' : 'secondary'}
          onClick={() => setMode('global')}
          style={{ flex: 1 }}
        >
          Глобальный
        </Button>
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: theme.spacing.xl }}>
          <Text>{t('common.loading')}</Text>
        </div>
      )}

      {error && (
        <Card style={{ marginBottom: theme.spacing.md, backgroundColor: theme.palette.danger + '20' }}>
          <Text style={{ color: theme.palette.danger }}>{error}</Text>
        </Card>
      )}

      {data && (
        <>
          {data.me && (
            <Card style={{ marginBottom: theme.spacing.md, backgroundColor: theme.palette.primary + '20', border: `2px solid ${theme.palette.primary}` }}>
              <Text bold style={{ marginBottom: theme.spacing.xs }}>
                Ты
              </Text>
              <Text>
                #{data.me.rank} · {data.me.xpWeek} XP
              </Text>
            </Card>
          )}

          {data.items.length === 0 ? (
            <Card style={{ textAlign: 'center', padding: theme.spacing.xl }}>
              <Text muted>Нет данных</Text>
            </Card>
          ) : (
            data.items.map((item) => (
              <Card key={item.user.id} style={{ marginBottom: theme.spacing.sm }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.md }}>
                  <Text variant="h2" style={{ minWidth: '40px' }}>
                    #{item.rank}
                  </Text>
                  <Text variant="h2" style={{ fontSize: '24px' }}>
                    {item.user.avatarEmoji}
                  </Text>
                  <div style={{ flex: 1 }}>
                    <Text bold>{item.user.displayName}</Text>
                    {item.user.username && (
                      <Text variant="small" muted>@{item.user.username}</Text>
                    )}
                  </div>
                  <Text bold>{item.xpWeek} XP</Text>
                </div>
              </Card>
            ))
          )}
        </>
      )}
    </div>
  );
}
