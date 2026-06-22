import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../api/client';
import DayChanger from '../features/TodayComponents/DayChanger';
import FoodList from '../features/TodayComponents/FoodList';
import { t } from '../i18n';
import { useTheme } from '../theme/useTheme';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { DashboardRing } from '../ui/DashboardRing';
import Loader from '../ui/Loader';
import { Text } from '../ui/Text';

export interface Entry {
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
    createdAt: Date;
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





  if (loading) {
    return (
      <Loader />
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
    <div style={{ padding: theme.spacing.lg, maxWidth: '600px', margin: '0 auto', minHeight: 'calc(100vh - 64px)', backgroundColor: theme.palette.bg }}>

      <DayChanger setDate={setDate} date={date} registrationDate={socialStats?.user.createdAt} />
      {socialStats && (
        <Card style={{ marginBottom: theme.spacing.lg, backgroundColor: theme.palette.primary + '10' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: theme.spacing.md }}>
            <div>
              <Text variant="small" muted>{t('commandCenter.streak')}</Text>
              <Text variant="h2" bold>
                {t('today.streakDays', { count: socialStats.stats.currentStreak })} 🔥
              </Text>
            </div>
            <div style={{ textAlign: 'right' }}>
              <Text variant="small" muted>{t('today.xpWeek')}</Text>
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
        <Card style={{ marginBottom: theme.spacing.lg, padding: theme.spacing.xl, backgroundColor: "unset", border: 'unset' }}>
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

      <div style={{ marginBottom: theme.spacing.lg, zIndex: 10 }}>
        <Button onClick={() => navigate('/entry/new')}>{t('today.addEntry')}</Button>
      </div>

      <FoodList
        entries={entries}
        handleDelete={handleDelete}
      />
    </div>
  );
}

