import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../api/client';
import { useTelegramAuth } from '../hooks/useTelegramAuth';
import { t } from '../i18n';
import { useTheme } from '../theme/useTheme';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { DashboardRing } from '../ui/DashboardRing';
import { Text } from '../ui/Text';

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

interface DashboardData {
  date: string;
  consumed: {
    kcal: number;
    protein: number;
    fat: number;
    carb: number;
  };
  targets: {
    kcalTarget: number;
    proteinTargetG: number;
    fatTargetG: number;
    carbTargetG: number;
  } | null;
  progress: {
    kcalPct: number;
    proteinPct: number;
    fatPct: number;
    carbPct: number;
  } | null;
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

function parseDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function TodayPage() {
  const { loading: loadingUser, error: errorUser } = useTelegramAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const [date, setDate] = useState(formatDate(new Date()));
  const [entries, setEntries] = useState<Entry[]>([]);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [socialStats, setSocialStats] = useState<SocialStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [entriesRes, dashboardRes, socialRes] = await Promise.all([
        apiClient.get(`/entries?date=${date}`),
        apiClient.get(`/dashboard/day?date=${date}`),
        apiClient.get('/social/me'),
      ]);
      setEntries(entriesRes.data);
      setDashboard(dashboardRes.data);
      setSocialStats(socialRes.data);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || t('dashboard.loadFailed'));
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

  const changeDate = (days: number) => {
    const currentDate = parseDate(date);
    currentDate.setDate(currentDate.getDate() + days);
    setDate(formatDate(currentDate));
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDate(e.target.value);
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.lg, flexWrap: 'wrap', gap: theme.spacing.md }}>
        <Text variant="h1" style={{ flex: 1, minWidth: '200px' }}>
          {t('today.dateTitle', { date })}
        </Text>
        <div style={{ display: 'flex', gap: theme.spacing.sm, alignItems: 'center' }}>
          <Button variant="secondary" size="sm" onClick={() => changeDate(-1)} style={{ width: 'auto', minWidth: '40px' }}>
            ←
          </Button>
          <input
            type="date"
            value={date}
            onChange={handleDateChange}
            style={{
              padding: theme.spacing.sm,
              fontSize: theme.typography.small.fontSize,
              backgroundColor: theme.palette.surface,
              color: theme.palette.text,
              border: `1px solid ${theme.palette.border}`,
              borderRadius: theme.radius.sm,
            }}
          />
          <Button variant="secondary" size="sm" onClick={() => changeDate(1)} style={{ width: 'auto', minWidth: '40px' }}>
            →
          </Button>
        </div>
      </div>

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

      {!dashboard?.targets && (
        <Card style={{ marginBottom: theme.spacing.lg, backgroundColor: theme.palette.primary + '20', border: `2px solid ${theme.palette.primary}` }}>
          <Text variant="h2" style={{ marginBottom: theme.spacing.md }}>
            {t('profile.fillProfileBanner')}
          </Text>
          <Button onClick={() => navigate('/profile')} style={{ marginTop: theme.spacing.md }}>
            {t('profile.goToProfile')}
          </Button>
        </Card>
      )}

      {dashboard && dashboard.targets && dashboard.progress && (
        <Card style={{ marginBottom: theme.spacing.lg, padding: theme.spacing.xl }}>
          <DashboardRing
            consumed={dashboard.consumed}
            targets={dashboard.targets}
            progress={dashboard.progress}
          />
        </Card>
      )}

      {dashboard && !dashboard.targets && (
        <Card style={{ marginBottom: theme.spacing.lg }}>
          <Text variant="h2" style={{ marginBottom: theme.spacing.md }}>
            {t('today.totals')}
          </Text>
          <Text variant="h2" bold style={{ marginBottom: theme.spacing.md, fontSize: '24px' }}>
            {t('totals.kcal', { value: dashboard.consumed.kcal.toFixed(1) })}
          </Text>
          <br />
          <Text muted style={{ marginBottom: theme.spacing.xs }}>
            {t('totals.macros', {
              protein: dashboard.consumed.protein.toFixed(1),
              fat: dashboard.consumed.fat.toFixed(1),
              carb: dashboard.consumed.carb.toFixed(1),
            })}
          </Text>
          <Text variant="small" muted style={{ marginTop: theme.spacing.sm }}>
            {getEntriesCountText(entries.length)}
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

