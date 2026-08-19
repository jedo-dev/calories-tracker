import { PageHeader } from '../ui/PageHeader';
import { t } from '../i18n';
import { useEffect, useMemo, useState } from 'react';
import { apiClient } from '../api/client';
import emptyReports from '../assets/03_empty_states/empty_reports.png';
import { useTheme } from '../theme/useTheme';
import { EmptyState } from '../ui/EmptyState';
import Loader from '../ui/Loader';
import { ReportsCaloriesChart, ReportsGoalDaysStrip, ReportsKpiGrid, ReportsMacrosChart, ReportsPeriodNavigator, ReportsPeriodSwitcher, ReportsWaterChart, ReportsWeightChart } from '../widgets/reports';
import type { ReportDay, ReportPeriod } from '../widgets/reports';
import { formatDateInput, getPeriodBounds, getPeriodLabel, round1 } from '../widgets/reports';

function sumKcal(day: ReportDay): number {
  return day.entries.reduce((sum, entry) => sum + (entry.kcal || 0), 0);
}

function sumBurned(day: ReportDay): number {
  return day.workouts.reduce((sum, workout) => sum + (workout.totalCaloriesBurned || 0), 0);
}

export function ReportsPage() {
  const theme = useTheme();
  const [period, setPeriod] = useState<ReportPeriod>('week');
  const [offset, setOffset] = useState(0);
  const [data, setData] = useState<ReportDay[]>([]);
  const [kcalGoal, setKcalGoal] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    apiClient
      .get(`/dashboard/day?date=${formatDateInput(new Date())}`)
      .then((res) => {
        if (!cancelled && res.data?.targets?.kcalTarget != null) {
          setKcalGoal(res.data.targets.kcalTarget);
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, []);

  const bounds = useMemo(() => getPeriodBounds(period, offset), [period, offset]);
  const periodLabel = useMemo(() => getPeriodLabel(period, bounds.from, bounds.to), [period, bounds.from, bounds.to]);

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      setLoading(true);
      setError(null);

      try {
        const res = await apiClient.get('/stats/range', {
          params: { from: bounds.from, to: bounds.to },
        });

        if (!cancelled) {
          setData(res.data);
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err.response?.data?.message || err.message || 'Ошибка');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadData();

    return () => {
      cancelled = true;
    };
  }, [bounds.from, bounds.to]);

  const totalKcal = data.reduce((sum, day) => sum + sumKcal(day), 0);
  const totalBurned = data.reduce((sum, day) => sum + sumBurned(day), 0);
  const totalWorkouts = data.reduce((sum, day) => sum + day.workouts.length, 0);
  const daysWithEntries = data.filter((day) => day.entries.length > 0).length;
  const avgKcal = daysWithEntries > 0 ? Math.round(totalKcal / daysWithEntries) : 0;
  const weights = data.map((day) => day.weight).filter((value): value is number => value != null);
  const weightDelta = weights.length >= 2 ? weights[weights.length - 1] - weights[0] : null;
  const weightChangeValue = weightDelta == null ? '—' : round1(Math.abs(weightDelta)).toFixed(1);
  const weightChangeCaption =
    weightDelta == null
      ? 'кг'
      : weightDelta < 0
        ? 'кг сброшено'
        : weightDelta > 0
          ? 'кг набрано'
          : 'кг без изменений';
  const weightChangeArrow: 'up' | 'down' | null =
    weightDelta == null ? null : weightDelta < 0 ? 'down' : weightDelta > 0 ? 'up' : null;
  const isEmpty =
    data.length > 0 &&
    data.every((day) => day.entries.length === 0 && day.workouts.length === 0 && day.weight == null);

  if (loading) return <Loader />;

  return (
    <div
      style={{
        minHeight: '100vh',
        maxWidth: '520px',
        margin: '0 auto',
        // Нижний отступ — под плавающую нижнюю навигацию (как на остальных
        // страницах), иначе она перекрывает последний график
        padding: '14px 14px 110px',
        paddingTop: 'calc(14px + env(safe-area-inset-top, 0px))',
        background: `
          radial-gradient(circle at 50% 0%, rgba(83, 212, 107, 0.12), transparent 28%),
          radial-gradient(circle at 18% 18%, rgba(56, 104, 152, 0.18), transparent 24%),
          linear-gradient(180deg, #07131f 0%, ${theme.palette.bg} 18%, #081523 100%)
        `,
      }}
    >
      <PageHeader title={t('report.title')} style={{ marginBottom: '8px' }} />

      <div style={{ marginBottom: '8px' }}>
        <ReportsPeriodSwitcher
          period={period}
          onChange={(nextPeriod) => {
            setPeriod(nextPeriod);
            setOffset(0);
          }}
        />
      </div>

      <div style={{ marginBottom: '8px' }}>
        <ReportsPeriodNavigator
          label={periodLabel}
          onPrev={() => setOffset((current) => current - 1)}
          onNext={() => setOffset((current) => current + 1)}
          nextDisabled={offset >= 0}
        />
      </div>

      {error && (
        <div
          style={{
            marginBottom: '14px',
            padding: '12px 14px',
            borderRadius: '14px',
            background: 'rgba(229, 62, 62, 0.12)',
            border: '1px solid rgba(229, 62, 62, 0.22)',
            color: '#ffb5b5',
            fontSize: '14px',
          }}
        >
          {error}
        </div>
      )}

      {isEmpty ? (
        <EmptyState
          image={emptyReports}
          title="Нет данных за период"
          description="Добавьте записи, тренировки или вес, чтобы увидеть аналитику по периоду."
        />
      ) : (
        <>
          <div style={{ marginBottom: '8px' }}>
            <ReportsKpiGrid
              avgKcal={avgKcal}
              totalBurned={totalBurned}
              workouts={totalWorkouts}
              weightChangeValue={weightChangeValue}
              weightChangeCaption={weightChangeCaption}
              weightChangeArrow={weightChangeArrow}
            />
          </div>

          <div style={{ marginBottom: '8px' }}>
            <ReportsGoalDaysStrip days={data} goal={kcalGoal} />
          </div>

          <div style={{ marginBottom: '8px' }}>
            <ReportsWeightChart days={data} />
          </div>

          <div style={{ marginBottom: '8px' }}>
            <ReportsCaloriesChart days={data} goal={kcalGoal} />
          </div>

          <div style={{ marginBottom: '8px' }}>
            <ReportsMacrosChart days={data} />
          </div>

          <div style={{ marginBottom: '8px' }}>
            <ReportsWaterChart days={data} />
          </div>
        </>
      )}
    </div>
  );
}
