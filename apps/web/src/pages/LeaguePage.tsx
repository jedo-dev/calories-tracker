import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { EmptyState } from '../ui/EmptyState';
import Loader from '../ui/Loader';
import { Text } from '../ui/Text';

const LEAGUE_IMAGES: Record<string, string> = {
  Bronze: rankBronze,
  Silver: rankSilver,
  Gold: rankGold,
  Diamond: rankDiamond,
};

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
  const navigate = useNavigate();
  const [mode, setMode] = useState<'friends' | 'global'>('friends');
  const [data, setData] = useState<LeaderboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [myUserId, setMyUserId] = useState<string | null>(null);

  const loadLeaderboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const endpoint = mode === 'friends' ? '/leaderboard/week/friends' : '/leaderboard/week/global';
      const [leaderboardRes, meRes] = await Promise.all([
        apiClient.get(endpoint),
        apiClient.get('/social/me').catch(() => null),
      ]);
      setData(leaderboardRes.data);
      if (meRes?.data?.user?.id) {
        setMyUserId(meRes.data.user.id);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeaderboard();
  }, [mode]);

  if (loading) return <Loader />;

  const leagueImg = data?.me?.league ? LEAGUE_IMAGES[data.me.league.name] || rankBronze : rankBronze;

  return (
    <div style={{ padding: theme.spacing.lg, maxWidth: '600px', margin: '0 auto', minHeight: 'calc(100vh - 64px)', backgroundColor: theme.palette.bg, paddingBottom: '80px' }}>
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
          {/* My Stats Card */}
          {data.me && (
            <Card style={{ marginBottom: theme.spacing.md, backgroundColor: theme.palette.primary + '20', border: `2px solid ${theme.palette.primary}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.sm }}>
                <Text variant="h2" bold>{t('league.myPlace')}</Text>
                <div style={{
                  padding: '4px 12px',
                  borderRadius: '12px',
                  backgroundColor: data.me.league.color + '30',
                  border: `2px solid ${data.me.league.color}`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}>
                  <img
                    src={leagueImg}
                    alt={data.me.league.name}
                    style={{ width: '24px', height: '24px', objectFit: 'contain' }}
                  />
                  <Text bold style={{ color: data.me.league.color }}>{data.me.league.name}</Text>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: theme.spacing.sm, marginBottom: theme.spacing.sm }}>
                <div style={{ textAlign: 'center' }}>
                  <Text variant="small" muted>{t('league.myPlace')}</Text>
                  <Text variant="h2" bold>#{data.me.rank}</Text>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <Text variant="small" muted>{t('league.xpWeek')}</Text>
                  <Text variant="h2" bold>{data.me.xpWeek}</Text>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <Text variant="small" muted>{t('league.xpTotal')}</Text>
                  <Text variant="h2" bold>{data.me.xpTotal}</Text>
                </div>
              </div>

              {data.me.nextLeagueXP && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <Text variant="small" muted>{t('league.progressToNext')}</Text>
                    <Text variant="small" muted>{data.me.progress}%</Text>
                  </div>
                  <div style={{ backgroundColor: theme.palette.bg, borderRadius: theme.radius.sm, height: '8px', overflow: 'hidden' }}>
                    <div style={{
                      width: `${data.me.progress}%`,
                      height: '100%',
                      backgroundColor: data.me.league.color,
                      borderRadius: theme.radius.sm,
                      transition: 'width 0.3s',
                    }} />
                  </div>
                  <Text variant="small" muted style={{ marginTop: '4px', display: 'block' }}>
                    {t('league.xpRemaining', { xp: data.me.nextLeagueXP, remaining: data.me.nextLeagueXP - data.me.xpTotal })}
                  </Text>
                </div>
              )}
            </Card>
          )}

          {/* Quick Actions */}
          <Card style={{ marginBottom: theme.spacing.md }}>
            <Text variant="h2" style={{ marginBottom: theme.spacing.sm }}>{t('league.quickActions')}</Text>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: theme.spacing.sm }}>
              <Button variant="ghost" onClick={() => navigate('/entry/new')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: theme.spacing.xs }}>
                🍽️ {t('league.addFood')}
              </Button>
              <Button variant="ghost" onClick={() => navigate('/workouts')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: theme.spacing.xs }}>
                💪 {t('league.startWorkout')}
              </Button>
              <Button variant="ghost" onClick={() => navigate('/today')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: theme.spacing.xs }}>
                💧 {t('league.logWater')}
              </Button>
              <Button variant="ghost" onClick={() => navigate('/weight')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: theme.spacing.xs }}>
                ⚖️ {t('league.logWeight')}
              </Button>
            </div>
          </Card>

          {/* XP Tips */}
          <Card style={{ marginBottom: theme.spacing.md, borderLeft: `3px solid ${theme.palette.primary}` }}>
            <Text variant="h2" style={{ marginBottom: theme.spacing.sm }}>{t('league.howToGetXp')}</Text>
            <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.xs }}>
              <Text variant="small">📝 {t('league.xpTip1')}</Text>
              <Text variant="small">➕ {t('league.xpTip2')}</Text>
              <Text variant="small">💪 {t('league.xpTip3')}</Text>
              <Text variant="small">💧 {t('league.xpTip4')}</Text>
            </div>
          </Card>

          {/* Leaderboard */}
          {data.items.length === 0 ? (
            <EmptyState
              image={emptyLeague}
              title={t('league.noData')}
            />
          ) : (
            data.items.map((item) => {
              const isMe = myUserId && item.user.id === myUserId;
              return (
                <Card
                  key={item.user.id}
                  style={{
                    marginBottom: theme.spacing.sm,
                    cursor: 'pointer',
                    border: isMe ? `2px solid ${theme.palette.primary}` : undefined,
                    backgroundColor: isMe ? theme.palette.primary + '10' : undefined,
                  }}
                  onClick={() => navigate(`/users/${item.user.id}`)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.md }}>
                    <Text variant="h2" style={{ minWidth: '40px', color: item.rank <= 3 ? theme.palette.primary : theme.palette.brown_50 }}>
                      #{item.rank}
                    </Text>
                    <div style={{ fontSize: '24px', flexShrink: 0 }}>{item.user.avatarEmoji}</div>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.xs }}>
                        <Text style={{ color: theme.palette.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} bold>{item.user.displayName}</Text>
                        {isMe && (
                          <Text variant="small" style={{ color: theme.palette.primary }}>({t('league.me')})</Text>
                        )}
                      </div>
                      {item.user.username && (
                        <Text variant="small" style={{ fontSize: '12px' }} muted>@{item.user.username}</Text>
                      )}
                    </div>
                    <Text style={{ color: theme.palette.text }} bold>{item.xpWeek} XP</Text>
                  </div>
                </Card>
              );
            })
          )}
        </>
      )}
    </div>
  );
}
