import { useEffect, useState } from 'react';
import { pageBackground } from '../theme/styles';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../api/client';
import emptyLeague from '../assets/03_empty_states/empty_league.jpg';
import { t } from '../i18n';
import { useTheme } from '../theme/useTheme';
import { EmptyState } from '../ui/EmptyState';
import Loader from '../ui/Loader';
import { Text } from '../ui/Text';
import { ClubHeader } from '../widgets/club/ClubHeader';
import { LeagueMeCard } from '../widgets/league/LeagueMeCard';
import { XpTipsCard } from '../widgets/league/XpTipsCard';
import { LeaderboardList } from '../widgets/league/LeaderboardList';
import type { LeaderboardResponse } from '../widgets/league/types';

type Mode = 'friends' | 'global';

export function LeaguePage() {
  const theme = useTheme();
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>('friends');
  const [data, setData] = useState<LeaderboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [myUserId, setMyUserId] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    const endpoint = mode === 'friends' ? '/leaderboard/week/friends' : '/leaderboard/week/global';
    Promise.all([apiClient.get(endpoint), apiClient.get('/social/me').catch(() => null)])
      .then(([leaderboardRes, meRes]) => {
        setData(leaderboardRes.data);
        if (meRes?.data?.user?.id) setMyUserId(meRes.data.user.id);
      })
      .catch((err: any) => {
        setError(err.response?.data?.message || err.message || t('common.error'));
      })
      .finally(() => setLoading(false));
  }, [mode]);

  if (loading) return <Loader />;

  const tabButton = (key: Mode, label: string) => {
    const active = mode === key;
    return (
      <button
        type="button"
        onClick={() => setMode(key)}
        style={{
          flex: 1,
          padding: '9px 12px',
          borderRadius: '12px',
          border: `1px solid ${active ? theme.palette.primary : 'rgba(255,255,255,0.12)'}`,
          background: active
            ? `linear-gradient(180deg, ${theme.palette.primary}33, ${theme.palette.primary}1f)`
            : 'rgba(255,255,255,0.06)',
          color: active ? theme.palette.primary : theme.palette.textMuted,
          fontSize: '13px',
          fontWeight: 700,
          cursor: 'pointer',
          fontFamily: 'inherit',
        }}
      >
        {label}
      </button>
    );
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        maxWidth: '520px',
        margin: '0 auto',
        padding: '12px',
        paddingBottom: '100px',
        background: pageBackground(theme.palette.bg),
      }}
    >
      <ClubHeader />

      <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
        {tabButton('friends', t('league.friends'))}
        {tabButton('global', t('league.global'))}
      </div>

      {error && (
        <Text variant="small" style={{ display: 'block', color: '#ff8a8a', marginBottom: '10px' }}>
          {error}
        </Text>
      )}

      {data && (
        <>
          {data.me && <LeagueMeCard me={data.me} />}

          {data.items.length === 0 ? (
            <EmptyState image={emptyLeague} title={t('league.noData')} />
          ) : (
            <LeaderboardList items={data.items} myUserId={myUserId} onOpenUser={(id) => navigate(`/users/${id}`)} />
          )}

          <XpTipsCard />
        </>
      )}
    </div>
  );
}
