import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { apiClient } from '../api/client';
import { formatDate, t } from '../i18n';
import { useTheme } from '../theme/useTheme';
import Loader from '../ui/Loader';
import { Text } from '../ui/Text';
import { IconButton } from '../ui/IconButton';
import { BackIcon } from '../ui/icons';
import { workoutPageBackground } from './workoutShared';
import { SessionDetailView } from '../widgets/workout/SessionDetailView';
import type { SessionLog, WorkoutSessionInfo } from '../widgets/workout/types';

// Read-only просмотр завершённой тренировки (переход из истории).
export function WorkoutHistoryDetailPage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();

  const [session, setSession] = useState<WorkoutSessionInfo | null>(null);
  const [logs, setLogs] = useState<SessionLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiClient
      .get(`/workouts/sessions/${sessionId}/detail`)
      .then((res) => {
        setSession(res.data.session);
        setLogs(res.data.logs);
      })
      .catch((err) => setError(err.response?.data?.message || t('common.error')))
      .finally(() => setLoading(false));
  }, [sessionId]);

  if (loading) return <Loader />;

  return (
    <div
      style={{
        padding: '12px',
        maxWidth: '520px',
        margin: '0 auto',
        minHeight: '100vh',
        paddingBottom: '100px',
        background: workoutPageBackground(theme.palette.bg),
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
        <IconButton label={t('common.back')} onClick={() => navigate(-1)} size={34}>
          <BackIcon size={18} />
        </IconButton>
        <div style={{ minWidth: 0 }}>
          <Text variant="h2" bold style={{ display: 'block', fontSize: '18px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {session?.name || session?.programName || t('workout.activeWorkout')}
          </Text>
          {session?.date && (
            <Text variant="small" muted style={{ fontSize: '12px' }}>
              {formatDate(session.date)}
            </Text>
          )}
        </div>
      </div>

      {error && (
        <Text variant="small" style={{ display: 'block', color: '#ff8a8a', marginBottom: '10px' }}>
          {error}
        </Text>
      )}

      {session && <SessionDetailView session={session} logs={logs} />}
    </div>
  );
}
