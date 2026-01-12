import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../api/client';
import { useTelegramAuth } from '../hooks/useTelegramAuth';
import { t } from '../i18n';
import { useTheme } from '../theme/useTheme';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Text } from '../ui/Text';
import { Header } from '../widget/Header/Header';

interface Entry {
  _id: string;
  productName: string;
  grams: number;
  kcal: number;
  protein: number;
  fat: number;
  carb: number;
  time?: string;
  mealType: string;
}

interface DayStats {
  date: string;
  totals: {
    kcal: number;
    protein: number;
    fat: number;
    carb: number;
  };
  entriesCount: number;
}

interface SocialStats {
  user: {
    id: string;
    username?: string;
    displayName: string;
    avatarEmoji: string;
  };
  stats: {
    xpTotal: number;
    xpWeek: number;
    weekKey: string;
    currentStreak: number;
    bestStreak: number;
    lastLoggedDate?: string;
  };
}

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function TodayPage() {
  const { loading: loadingUser, error: errorUser } = useTelegramAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const [date] = useState(formatDate(new Date()));
  const [entries, setEntries] = useState<Entry[]>([]);
  const [stats, setStats] = useState<DayStats | null>(null);
  const [socialStats, setSocialStats] = useState<SocialStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [entriesRes, statsRes, socialRes] = await Promise.all([
        apiClient.get(`/entries?date=${date}`),
        apiClient.get(`/stats/day?date=${date}`),
        apiClient.get('/social/me'),
      ]);
      setEntries(entriesRes.data);
      setStats(statsRes.data);
      setSocialStats(socialRes.data);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || t('stats.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [date]);

  const handleDelete = async (id: string) => {
    if (!confirm(t('today.deleteConfirm'))) return;
    try {
      await apiClient.delete(`/entries/${id}`);
      await loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || t('today.deleteFailed'));
    }
  };

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
  if (loading) {
    return (
      <div style={{ padding: theme.spacing.lg, textAlign: 'center' }}>
        <Text>{t('common.loading')}</Text>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: theme.spacing.lg }}>
        <Text variant="h2" style={{ color: theme.palette.danger }}>
          {t('common.error')}: {error}
        </Text>
      </div>
    );
  }

  const getEntriesCountText = (count: number) => {
    if (count === 1) return t('today.entriesCount_one', { count });
    if (count >= 2 && count <= 4) return t('today.entriesCount_few', { count });
    return t('today.entriesCount_many', { count });
  };

  return (
    <div style={{ padding: theme.spacing.lg, maxWidth: '600px', margin: '0 auto', minHeight: '100vh', backgroundColor: theme.palette.bg }}>

      <Header />

    

      <Text variant="h1" style={{ marginBottom: theme.spacing.lg }}>
        {t('today.dateTitle', { date })}
      </Text>

      {socialStats && (
        <Card style={{ marginBottom: theme.spacing.lg, backgroundColor: theme.palette.primary + '10' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: theme.spacing.md }}>
            <div>
              <Text variant="small" muted>Серия</Text>
              <Text variant="h2" bold>
                {socialStats.stats.currentStreak} дней 🔥
              </Text>
            </div>
            <div style={{ textAlign: 'right' }}>
              <Text variant="small" muted>XP за неделю</Text>
              <Text variant="h2" bold>
                {socialStats.stats.xpWeek}
              </Text>
            </div>
          </div>
        </Card>
      )}

      {stats && (
        <Card style={{ marginBottom: theme.spacing.lg }}>
          <Text variant="h2" style={{ marginBottom: theme.spacing.md }}>
            {t('today.totals')}
          </Text>
          <Text variant="h2" bold style={{ marginBottom: theme.spacing.md, fontSize: '24px' }}>
            {t('totals.kcal', { value: stats.totals.kcal.toFixed(1) })}
          </Text>
          <Text muted style={{ marginBottom: theme.spacing.xs }}>
            {t('totals.macros', {
              protein: stats.totals.protein.toFixed(1),
              fat: stats.totals.fat.toFixed(1),
              carb: stats.totals.carb.toFixed(1),
            })}
          </Text>
          <Text variant="small" muted style={{ marginTop: theme.spacing.sm }}>
            {getEntriesCountText(stats.entriesCount)}
          </Text>
        </Card>
      )}

      <div style={{ marginBottom: theme.spacing.lg }}>
        <Button onClick={() => navigate('/entry/new')}>{t('today.addEntry')}</Button>
      </div>

      <div>
        <Text variant="h2" style={{ marginBottom: theme.spacing.md }}>
          {t('today.entries')}
        </Text>
        {entries.length === 0 ? (
          <Card style={{ textAlign: 'center', padding: theme.spacing.xl }}>
            <Text muted>{t('today.noEntries')}</Text>
          </Card>
        ) : (
          entries.map((entry) => (
            <Card key={entry._id} style={{ marginBottom: theme.spacing.md }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: theme.spacing.md }}>
                <div style={{ flex: 1 }}>
                  <Text bold style={{ marginBottom: theme.spacing.xs }}>
                    {entry.productName}
                  </Text>
                  <Text variant="small" style={{ marginBottom: theme.spacing.xs }}>
                    {entry.grams}г · {t('totals.kcal', { value: entry.kcal.toFixed(1) })}
                  </Text>
                  <Text variant="small" muted>
                    {t('totals.macros', {
                      protein: entry.protein.toFixed(1),
                      fat: entry.fat.toFixed(1),
                      carb: entry.carb.toFixed(1),
                    })}
                  </Text>
                  {(entry.time || entry.mealType !== 'other') && (
                    <Text variant="small" muted style={{ marginTop: theme.spacing.xs }}>
                      {entry.time && `${entry.time} `}
                      {entry.mealType !== 'other' && t(`mealType.${entry.mealType}` as any)}
                    </Text>
                  )}
                </div>
                <div style={{ display: 'flex', gap: theme.spacing.sm, flexDirection: 'column' }}>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => navigate(`/entry/${entry._id}`)}
                    style={{ width: 'auto', minWidth: '80px' }}
                  >
                    {t('common.edit')}
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleDelete(entry._id)}
                    style={{ width: 'auto', minWidth: '80px' }}
                  >
                    {t('common.delete')}
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

