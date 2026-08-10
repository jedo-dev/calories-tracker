import { t } from '../../i18n';
import { useTheme } from '../../theme/useTheme';
import { Text } from '../../ui/Text';
import { workoutCardStyle, formatDuration } from '../../pages/workoutShared';
import { Thumb } from './Thumb';
import type { SessionLog, SetDetail, WorkoutSessionInfo } from './types';

interface SessionDetailViewProps {
  session: WorkoutSessionInfo;
  logs: SessionLog[];
}

// Read-only просмотр завершённой тренировки из истории.

function formatSet(set: SetDetail): string {
  if (set.durationSec) return formatDuration(set.durationSec);
  const weight = set.weightKg != null && set.weightKg > 0 ? `${set.weightKg} кг` : null;
  const reps = set.reps != null && set.reps > 0 ? `${set.reps} повт.` : null;
  if (weight && reps) return `${weight} × ${set.reps}`;
  return reps ?? weight ?? '—';
}

function logVolumeKg(log: SessionLog): number {
  return (log.setsDetail || [])
    .filter((s) => s.done)
    .reduce((sum, s) => sum + (s.weightKg || 0) * (s.reps || 0), 0);
}

export function SessionDetailView({ session, logs }: SessionDetailViewProps) {
  const theme = useTheme();

  const totalVolumeKg = Math.round(logs.reduce((sum, l) => sum + logVolumeKg(l), 0) * 10) / 10;

  const stat = (value: string | number, label: string, accent = false) => (
    <div style={{ ...workoutCardStyle, padding: '12px 8px', textAlign: 'center' }}>
      <Text
        bold
        style={{ display: 'block', fontSize: '18px', color: accent ? theme.palette.primary : theme.palette.text }}
      >
        {value}
      </Text>
      <Text variant="small" muted style={{ fontSize: '11px' }}>
        {label}
      </Text>
    </div>
  );

  return (
    <>
      {/* Сводка */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '8px', marginBottom: '12px' }}>
        {stat(formatDuration(session.totalDurationSec), t('workout.totalDuration'))}
        {stat(Math.round(session.totalCaloriesBurned), t('workout.totalCalories'), true)}
        {stat(totalVolumeKg > 0 ? `${totalVolumeKg} ${t('workout.kg')}` : '—', t('workout.volume'))}
        {stat(logs.length, t('workout.exerciseCount'))}
      </div>

      {/* Упражнения с подходами */}
      {logs.map((log) => {
        const setsDone = (log.setsDetail || []).filter((s) => s.done).length;
        const volume = logVolumeKg(log);
        return (
          <div key={log._id} style={{ ...workoutCardStyle, marginBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: (log.setsDetail || []).length > 0 ? '10px' : 0 }}>
              <Thumb src={log.gifUrl} alt="" size={44} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <Text bold style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {log.exerciseName}
                </Text>
                <Text variant="small" muted style={{ display: 'block', marginTop: '2px' }}>
                  {setsDone}/{(log.setsDetail || []).length} {t('workout.setsShort')}
                  {volume > 0 ? ` · ${Math.round(volume * 10) / 10} ${t('workout.kg')}` : ''}
                  {log.caloriesBurned > 0 ? ` · ${Math.round(log.caloriesBurned)} ${t('workout.kcal')}` : ''}
                </Text>
              </div>
            </div>

            {(log.setsDetail || []).map((set) => (
              <div
                key={set.setNumber}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '6px 0',
                  borderTop: '1px solid rgba(255,255,255,0.07)',
                  opacity: set.done ? 1 : 0.45,
                }}
              >
                <Text variant="small" muted style={{ width: '22px', flexShrink: 0 }}>
                  {set.setNumber}
                </Text>
                <Text variant="small" style={{ flex: 1 }}>
                  {formatSet(set)}
                </Text>
                <Text variant="small" style={{ color: set.done ? theme.palette.primary : theme.palette.textMuted, flexShrink: 0 }}>
                  {set.done ? '✓' : '—'}
                </Text>
              </div>
            ))}
          </div>
        );
      })}
    </>
  );
}
