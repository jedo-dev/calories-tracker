import { useEffect, useState } from 'react';
import { apiClient } from '../api/client';
import emptyLeague from '../assets/03_empty_states/empty_league.jpg';
import rankBronze from '../assets/07_achievements/rank_bronze.jpg';
import rankSilver from '../assets/07_achievements/rank_silver.jpg';
import rankGold from '../assets/07_achievements/rank_gold.jpg';
import rankDiamond from '../assets/07_achievements/rank_diamond.jpg';
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

interface League {
  name: string;
  color: string;
  minXP: number;
  maxXP: number;
}

interface LeaderboardResponse {
  weekKey: string;
  me?: {
    rank: number;
    xpWeek: number;
    xpTotal: number;
    league: League;
    nextLeagueXP: number | null;
    progress: number;
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
          {/* League Header */}
          <Card style={{ marginBottom: theme.spacing.md, backgroundColor: theme.palette.primary + '10' }}>
            <Text variant="h1" style={{ marginBottom: theme.spacing.sm }}>🏆 Лига недели</Text>
            <Text variant="small" muted>{data.weekKey}</Text>
          </Card>

          {/* My Stats Card */}
          {data.me && (
            <Card style={{ marginBottom: theme.spacing.md, backgroundColor: theme.palette.primary + '20', border: `2px solid ${theme.palette.primary}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.sm }}>
                <Text variant="h2" bold>Мое место</Text>
                <div style={{ 
                  padding: '4px 12px', 
                  borderRadius: '12px', 
                  backgroundColor: data.me.league.color + '30',
                  border: `2px solid ${data.me.league.color}`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <img 
                    src={data.me.league.name === 'Diamond' ? rankDiamond : 
                         data.me.league.name === 'Gold' ? rankGold : 
                         data.me.league.name === 'Silver' ? rankSilver : rankBronze} 
                    alt={data.me.league.name} 
                    style={{ width: '24px', height: '24px', objectFit: 'contain' }} 
                  />
                  <Text bold style={{ color: data.me.league.color }}>{data.me.league.name}</Text>
                </div>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: theme.spacing.sm, marginBottom: theme.spacing.sm }}>
                <div style={{ textAlign: 'center' }}>
                  <Text variant="small" muted>Место</Text>
                  <Text variant="h2" bold>#{data.me.rank}</Text>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <Text variant="small" muted>XP за неделю</Text>
                  <Text variant="h2" bold>{data.me.xpWeek}</Text>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <Text variant="small" muted>Всего XP</Text>
                  <Text variant="h2" bold>{data.me.xpTotal}</Text>
                </div>
              </div>

              {/* League Progress */}
              {data.me.nextLeagueXP && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <Text variant="small" muted>Прогресс до следующей лиги</Text>
                    <Text variant="small" muted>{data.me.progress}%</Text>
                  </div>
                  <div style={{ backgroundColor: theme.palette.bg, borderRadius: theme.radius.sm, height: '8px', overflow: 'hidden' }}>
                    <div style={{ 
                      width: `${data.me.progress}%`, 
                      height: '100%', 
                      backgroundColor: data.me.league.color, 
                      borderRadius: theme.radius.sm, 
                      transition: 'width 0.3s' 
                    }} />
                  </div>
                  <Text variant="small" muted style={{ marginTop: '4px', display: 'block' }}>
                    До {data.me.nextLeagueXP} XP осталось {data.me.nextLeagueXP - data.me.xpTotal} XP
                  </Text>
                </div>
              )}
            </Card>
          )}

          {data.items.length === 0 ? (
            <Card style={{ textAlign: 'center', padding: theme.spacing.xl }}>
              <img src={emptyLeague} alt="" style={{ width: '120px', height: '120px', objectFit: 'contain', marginBottom: theme.spacing.md, opacity: 0.8 }} />
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
