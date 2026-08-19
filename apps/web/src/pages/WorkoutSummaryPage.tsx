import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { apiClient } from '../api/client';
import { t } from '../i18n';
import { useTheme } from '../theme/useTheme';
import Loader from '../ui/Loader';
import { Text } from '../ui/Text';
import { workoutPageBackground } from './workoutShared';
import { FinishSummaryCard } from '../widgets/workout/FinishSummaryCard';
import type { FinishSummary, SessionLog, WorkoutSessionInfo } from '../widgets/workout/types';

export function WorkoutSummaryPage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();

  const stateSummary = (location.state as { summary?: FinishSummary } | null)?.summary;
  const [summary, setSummary] = useState<FinishSummary | null>(stateSummary ?? null);
  const [loading, setLoading] = useState(!stateSummary);

  useEffect(() => {
    if (stateSummary) return;
    // Fallback (page refresh / deep link): rebuild the summary from the session
    Promise.all([
      apiClient.get(`/workouts/sessions/${sessionId}`),
      apiClient.get(`/workouts/sessions/${sessionId}/logs`),
    ])
      .then(([sessionRes, logsRes]) => {
        const session: WorkoutSessionInfo = sessionRes.data;
        const logs: SessionLog[] = logsRes.data;
        const doneSets = logs.flatMap((l) => (l.setsDetail || []).filter((s) => s.done));
        const totalVolumeKg = doneSets.reduce((sum, s) => sum + (s.weightKg || 0) * (s.reps || 0), 0);
        const durationSec =
          session.startedAt && session.finishedAt
            ? Math.max(
                0,
                Math.round((new Date(session.finishedAt).getTime() - new Date(session.startedAt).getTime()) / 1000),
              )
            : session.totalDurationSec;
        setSummary({
          durationSec,
          totalVolumeKg: Math.round(totalVolumeKg * 10) / 10,
          kcal: session.totalCaloriesBurned,
          exercisesDone: logs.filter((l) => (l.setsDetail || []).some((s) => s.done)).length || logs.length,
          prs: [],
        });
      })
      .catch((err) => console.error('Failed to load summary', err))
      .finally(() => setLoading(false));
  }, [sessionId, stateSummary]);

  if (loading) return <Loader />;
  if (!summary) return <Text>{t('common.error')}</Text>;

  return (
    <div
      style={{
        padding: '12px',
        paddingTop: 'calc(12px + env(safe-area-inset-top, 0px))',
        maxWidth: '520px',
        margin: '0 auto',
        minHeight: '100vh',
        paddingBottom: '100px',
        background: workoutPageBackground(theme.palette.bg),
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
      }}
    >
      <FinishSummaryCard summary={summary} />
      <button
        type="button"
        onClick={() => navigate('/workouts')}
        style={{
          width: '100%',
          height: '52px',
          borderRadius: '18px',
          border: 'none',
          background: 'linear-gradient(180deg, rgba(83, 212, 107, 1), rgba(60, 170, 82, 1))',
          color: '#07210f',
          fontSize: '15px',
          fontWeight: 700,
          cursor: 'pointer',
          boxShadow: '0 18px 30px rgba(83, 212, 107, 0.24)',
          fontFamily: 'inherit',
        }}
      >
        {t('workout.summaryDone')}
      </button>
    </div>
  );
}
