import { formatDateHuman, locale, plural, t } from '../../i18n';
import { useTheme } from '../../theme/useTheme';
import { Text } from '../../ui/Text';
import { workoutCardStyle, formatDuration } from '../../pages/workoutShared';
import type { WorkoutSessionInfo } from './types';

// «31 августа, 14:05» — дата человекочитаемая, время из момента старта
// (или завершения) тренировки, в текущей локали
function formatSessionMoment(session: WorkoutSessionInfo): string | null {
  if (!session.date) return null;
  const stamp = session.startedAt || session.finishedAt;
  const time = stamp
    ? new Date(stamp).toLocaleTimeString(locale === 'ru' ? 'ru-RU' : 'en-US', {
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;
  return `${formatDateHuman(session.date)}${time ? `, ${time}` : ''}`;
}

interface WorkoutHistoryListProps {
  sessions: WorkoutSessionInfo[];
  emptyImage?: string;
  onSessionClick?: (session: WorkoutSessionInfo) => void;
}

export function WorkoutHistoryList({ sessions, emptyImage, onSessionClick }: WorkoutHistoryListProps) {
  const theme = useTheme();

  if (sessions.length === 0) {
    return (
      <div style={{ ...workoutCardStyle, textAlign: 'center', padding: '24px' }}>
        {emptyImage && (
          <img
            src={emptyImage}
            alt=""
            style={{ width: '120px', height: '120px', objectFit: 'contain', marginBottom: '12px', opacity: 0.8, borderRadius: '20px' }}
          />
        )}
        <Text muted style={{ display: 'block' }}>{t('workout.noHistory')}</Text>
      </div>
    );
  }

  return (
    <>
      {sessions.map((session) => (
        <div
          key={session._id}
          onClick={onSessionClick ? () => onSessionClick(session) : undefined}
          style={{
            ...workoutCardStyle,
            marginBottom: '10px',
            cursor: onSessionClick ? 'pointer' : 'default',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <div style={{ minWidth: 0 }}>
            <Text bold style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {session.name || t('workout.activeWorkout')}
            </Text>
            <Text variant="small" muted style={{ display: 'block', marginTop: '2px' }}>
              {formatSessionMoment(session) ? `${formatSessionMoment(session)} · ` : ''}
              {session.exerciseCount} {plural(session.exerciseCount, 'exercise')} · {formatDuration(session.totalDurationSec)}
            </Text>
          </div>
          <div style={{ textAlign: 'right', whiteSpace: 'nowrap', flexShrink: 0 }}>
            <span style={{ fontSize: '20px', fontWeight: 800, color: theme.palette.primary }}>
              {Math.round(session.totalCaloriesBurned)}
            </span>
            <span style={{ fontSize: '11px', color: theme.palette.textMuted }}> {t('workout.kcal')}</span>
          </div>
        </div>
      ))}
    </>
  );
}
