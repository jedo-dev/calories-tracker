import { useEffect, useState } from 'react';
import { apiClient } from '../api/client';
import { t } from '../i18n';
import { useTheme } from '../theme/useTheme';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import Loader from '../ui/Loader';
import { Text } from '../ui/Text';

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

  if (loading) {
    return (
      <Loader />
    );
  }

  return (
    <div style={{ padding: theme.spacing.lg, maxWidth: '600px', margin: '0 auto', minHeight: 'calc(100vh - 64px)', backgroundColor: theme.palette.bg }}>


      <div style={{ display: 'flex', gap: theme.spacing.sm, marginBottom: theme.spacing.lg }}>
        <Button
          variant={mode === 'friends' ? 'primary' : 'secondary'}
          onClick={() => setMode('friends')}
          style={{ flex: 1 }}
        >
          {t('league.friends')}
        </Button>
        <Button
          variant={mode === 'global' ? 'primary' : 'secondary'}
          onClick={() => setMode('global')}
          style={{ flex: 1 }}
        >
          {t('league.global')}
        </Button>
      </div>



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
                {t('league.me')}
              </Text>
              <Text>
                #{data.me.rank} · {data.me.xpWeek} XP
              </Text>
            </Card>
          )}

          {data.items.length === 0 ? (
            <Card style={{ textAlign: 'center', padding: theme.spacing.xl }}>
              <Text muted>{t('league.noData')}</Text>
            </Card>
          ) : (
            data.items.map((item) => (
              <Card key={item.user.id} style={{ marginBottom: theme.spacing.sm }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.md }}>
                  <Text variant="h2" style={{ minWidth: '40px', color: theme.palette.brown_50 }}>
                    #{item.rank}
                  </Text>
                  <Text variant="h2" style={{ fontSize: '24px' }}>
                    {item.user.avatarEmoji}
                  </Text>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <Text style={{ color: theme.palette.text }} bold>{item.user.displayName}</Text>
                    {item.user.username && (
                      <Text variant="small" style={{ fontSize: '12px' }} muted>@{item.user.username}</Text>
                    )}
                  </div>
                  <Text style={{ color: theme.palette.text }} bold>{item.xpWeek} XP</Text>
                </div>
              </Card>
            ))
          )}
        </>
      )}
    </div>
  );
}
