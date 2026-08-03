import { t } from '../../i18n';
import { useTheme } from '../../theme/useTheme';
import type { LastPerformance } from './types';

export function PrevPerformanceHint({ last }: { last?: LastPerformance }) {
  const theme = useTheme();
  if (!last) return null;

  const best = last.bestSet;
  const parts: string[] = [];
  if (best?.weightKg) {
    parts.push(`${best.weightKg} ${t('workout.kg')}${best.reps ? ` × ${best.reps}` : ''}`);
  } else if (last.reps) {
    parts.push(`${last.sets} × ${last.reps}`);
  }
  if (!parts.length) return null;

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '6px 10px',
        borderRadius: '12px',
        background: 'rgba(96, 165, 250, 0.12)',
        border: '1px solid rgba(96, 165, 250, 0.24)',
        marginBottom: '10px',
      }}
    >
      <span style={{ fontSize: '12px' }}>🕘</span>
      <span style={{ fontSize: '12px', fontWeight: 700, color: '#7cb8ff' }}>
        {t('workout.prevTime')}: {parts.join(' ')}
      </span>
      {last.date && (
        <span style={{ fontSize: '11px', color: theme.palette.textMuted }}>({last.date})</span>
      )}
    </div>
  );
}
