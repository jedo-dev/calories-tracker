import { t } from '../../i18n';
import { useTheme } from '../../theme/useTheme';
import { Text } from '../../ui/Text';
import { workoutCardStyle, formatDuration } from '../../pages/workoutShared';
import type { FinishSummary } from './types';
import finishSummaryImage from '../../assets/08_mascot/mascot_fox_celebrate.png';

export function FinishSummaryCard({ summary }: { summary: FinishSummary }) {
  const theme = useTheme();

  const stat = (value: string, label: string, accent = false) => (
    <div style={{ textAlign: 'center' }}>
      <span
        style={{
          fontSize: '22px',
          fontWeight: 800,
          color: accent ? theme.palette.primary : theme.palette.text,
          display: 'block',
        }}
      >
        {value}
      </span>
      <Text variant="small" muted style={{ fontSize: '11px' }}>{label}</Text>
    </div>
  );

  return (
    <div style={{ ...workoutCardStyle, marginBottom: '12px', padding: '18px 14px' }}>
      <div style={{ textAlign: 'center', marginBottom: '14px' }}>
            <img
            src={finishSummaryImage}
            alt=""
            style={{ width: '240px', height: '240px', objectFit: 'contain', marginBottom: '12px', opacity: 0.8, borderRadius: '20px' }}
          />
        <Text variant="h2" bold style={{ fontSize: '20px' }}>{t('workout.finishTitle')}</Text>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: summary.prs.length ? '16px' : 0 }}>
        {stat(formatDuration(summary.durationSec), t('workout.totalDuration'))}
        {stat(`${Math.round(summary.kcal)}`, t('workout.totalCalories'), true)}
        {stat(
          summary.totalVolumeKg > 0 ? `${summary.totalVolumeKg} ${t('workout.kg')}` : '—',
          t('workout.volume'),
        )}
        {stat(`${summary.exercisesDone}`, t('workout.exerciseCount'))}
      </div>

      {summary.prs.length > 0 && (
        <div>
          <Text bold style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>
            🏆 {t('workout.prs')}
          </Text>
          {summary.prs.map((pr) => (
            <div
              key={pr.exerciseName}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '8px 10px',
                borderRadius: '12px',
                background: 'rgba(255, 196, 87, 0.1)',
                border: '1px solid rgba(255, 196, 87, 0.3)',
                marginBottom: '6px',
              }}
            >
              <Text variant="small" bold>{pr.exerciseName}</Text>
              <span style={{ fontSize: '13px', fontWeight: 800, color: '#ffc457', whiteSpace: 'nowrap' }}>
                {pr.weightKg} {t('workout.kg')}{pr.reps ? ` × ${pr.reps}` : ''}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
