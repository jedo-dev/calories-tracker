import { useEffect, useState } from 'react';
import { apiClient } from '../api/client';
import { t } from '../i18n';
import { useTheme } from '../theme/useTheme';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import Loader from '../ui/Loader';
import { Text } from '../ui/Text';

function formatDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getWeekDates(offset = 0): { from: string; to: string } {
  const now = new Date();
  const day = now.getDay() || 7;
  const monday = new Date(now);
  monday.setDate(now.getDate() - day + 1 + offset * 7);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return { from: formatDate(monday), to: formatDate(sunday) };
}

function getMonthDates(offset = 0): { from: string; to: string } {
  const now = new Date();
  const first = new Date(now.getFullYear(), now.getMonth() + offset, 1);
  const last = new Date(now.getFullYear(), now.getMonth() + offset + 1, 0);
  return { from: formatDate(first), to: formatDate(last) };
}

interface DayData {
  entries: any[];
  workouts: any[];
  weight: number | null;
}

export function ReportsPage() {
  const theme = useTheme();
  const [period, setPeriod] = useState<'week' | 'month'>('week');
  const [offset, setOffset] = useState(0);
  const [data, setData] = useState<DayData[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    const dates = period === 'week' ? getWeekDates(offset) : getMonthDates(offset);
    try {
      const allDates: string[] = [];
      const from = new Date(dates.from);
      const to = new Date(dates.to);
      for (let d = new Date(from); d <= to; d.setDate(d.getDate() + 1)) {
        allDates.push(formatDate(d));
      }

      const results: DayData[] = [];
      for (const date of allDates) {
        const [entriesRes, workoutsRes, weightRes] = await Promise.all([
          apiClient.get(`/entries?date=${date}`).catch(() => ({ data: [] })),
          apiClient.get('/workouts/sessions', { params: { date } }).catch(() => ({ data: [] })),
          apiClient.get('/weight', { params: { limit: 1 } }).catch(() => ({ data: [] })),
        ]);
        results.push({
          entries: entriesRes.data || [],
          workouts: workoutsRes.data || [],
          weight: weightRes.data?.[0]?.weightKg || null,
        });
      }
      setData(results);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, [period, offset]);

  const totalKcal = data.reduce((s, d) => s + d.entries.reduce((es: number, e: any) => es + (e.kcal || 0), 0), 0);
  const totalBurned = data.reduce((s, d) => s + d.workouts.reduce((ws: number, w: any) => ws + (w.totalCaloriesBurned || 0), 0), 0);
  const totalWorkouts = data.reduce((s, d) => s + d.workouts.length, 0);
  const daysWithData = data.filter(d => d.entries.length > 0).length;
  const avgKcal = daysWithData > 0 ? Math.round(totalKcal / daysWithData) : 0;
  const weights = data.filter(d => d.weight).map(d => d.weight!);
  const avgWeight = weights.length > 0 ? (weights.reduce((s, w) => s + w, 0) / weights.length).toFixed(1) : '—';

  const periodLabel = period === 'week'
    ? `${getWeekDates(offset).from} — ${getWeekDates(offset).to}`
    : `${getMonthDates(offset).from.slice(0, 7)}`;

  if (loading) return <Loader />;

  return (
    <div style={{ padding: theme.spacing.lg, maxWidth: '600px', margin: '0 auto', minHeight: 'calc(100vh - 64px)', backgroundColor: theme.palette.bg }}>
      <Text variant="h1" style={{ marginBottom: theme.spacing.lg }}>📊 {t('report.title')}</Text>

      {/* Period selector */}
      <div style={{ display: 'flex', gap: theme.spacing.sm, marginBottom: theme.spacing.md }}>
        <Button variant={period === 'week' ? 'primary' : 'ghost'} onClick={() => { setPeriod('week'); setOffset(0); }} style={{ flex: 1 }}>
          {t('report.weekly')}
        </Button>
        <Button variant={period === 'month' ? 'primary' : 'ghost'} onClick={() => { setPeriod('month'); setOffset(0); }} style={{ flex: 1 }}>
          {t('report.monthly')}
        </Button>
      </div>

      {/* Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.lg }}>
        <Button variant="ghost" size="sm" onClick={() => setOffset(offset - 1)} style={{ width: 'auto' }}>←</Button>
        <Text variant="small" muted>{periodLabel}</Text>
        <Button variant="ghost" size="sm" onClick={() => setOffset(offset + 1)} disabled={offset >= 0} style={{ width: 'auto' }}>→</Button>
      </div>

      {/* Stats grid */}
      {daysWithData === 0 ? (
        <Card style={{ textAlign: 'center', padding: theme.spacing.xl }}>
          <Text muted>{t('report.noData')}</Text>
        </Card>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: theme.spacing.sm, marginBottom: theme.spacing.lg }}>
          <Card style={{ textAlign: 'center' }}>
            <Text variant="small" muted>{t('report.avgKcal')}</Text>
            <Text variant="h2" bold style={{ color: theme.palette.primary }}>{avgKcal}</Text>
          </Card>
          <Card style={{ textAlign: 'center' }}>
            <Text variant="small" muted>{t('report.totalBurned')}</Text>
            <Text variant="h2" bold style={{ color: theme.palette.success }}>{Math.round(totalBurned)}</Text>
          </Card>
          <Card style={{ textAlign: 'center' }}>
            <Text variant="small" muted>{t('report.workouts')}</Text>
            <Text variant="h2" bold>{totalWorkouts}</Text>
          </Card>
          <Card style={{ textAlign: 'center' }}>
            <Text variant="small" muted>{t('report.avgWeight')}</Text>
            <Text variant="h2" bold>{avgWeight}</Text>
          </Card>
        </div>
      )}

      {/* Daily breakdown */}
      {data.map((day, i) => {
        const dayKcal = day.entries.reduce((s: number, e: any) => s + (e.kcal || 0), 0);
        const dayBurned = day.workouts.reduce((s: number, w: any) => s + (w.totalCaloriesBurned || 0), 0);
        const dates = period === 'week' ? getWeekDates(offset) : getMonthDates(offset);
        const allDates: string[] = [];
        const from = new Date(dates.from);
        const to = new Date(dates.to);
        for (let d = new Date(from); d <= to; d.setDate(d.getDate() + 1)) allDates.push(formatDate(d));
        const dateStr = allDates[i];

        return (
          <Card key={dateStr} style={{ marginBottom: theme.spacing.xs, padding: theme.spacing.sm }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text variant="small" muted>{dateStr.slice(5)}</Text>
              <div style={{ display: 'flex', gap: theme.spacing.md }}>
                {dayKcal > 0 && <Text variant="small" style={{ color: theme.palette.success }}>{Math.round(dayKcal)} ккал</Text>}
                {dayBurned > 0 && <Text variant="small" style={{ color: theme.palette.primary }}>−{Math.round(dayBurned)}</Text>}
                {day.weight && <Text variant="small" bold>{day.weight}кг</Text>}
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
