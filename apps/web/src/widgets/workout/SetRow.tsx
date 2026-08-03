import { t } from '../../i18n';
import { useTheme } from '../../theme/useTheme';
import type { SetDetail } from './types';

interface SetRowProps {
  set: SetDetail;
  isDurationBased: boolean;
  onChange: (set: SetDetail) => void;
  onToggleDone: () => void;
}

function Stepper({
  value,
  unit,
  step,
  min = 0,
  onChange,
  disabled,
}: {
  value: number | null;
  unit: string;
  step: number;
  min?: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}) {
  const theme = useTheme();
  const current = value ?? 0;

  const btnStyle: React.CSSProperties = {
    width: '28px',
    height: '28px',
    borderRadius: '9px',
    border: '1px solid rgba(160, 200, 220, 0.24)',
    background: 'rgba(255,255,255,0.06)',
    color: theme.palette.text,
    fontSize: '15px',
    fontWeight: 800,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
    flexShrink: 0,
    opacity: disabled ? 0.4 : 1,
    fontFamily: 'inherit',
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
      <button
        type="button"
        aria-label="−"
        disabled={disabled}
        onClick={() => onChange(Math.max(min, Math.round((current - step) * 10) / 10))}
        style={btnStyle}
      >
        −
      </button>
      <span
        style={{
          minWidth: '52px',
          textAlign: 'center',
          fontSize: '13px',
          fontWeight: 800,
          color: theme.palette.text,
          opacity: disabled ? 0.5 : 1,
        }}
      >
        {value != null ? Math.round(value * 10) / 10 : '—'}
        <span style={{ fontSize: '10px', fontWeight: 600, color: theme.palette.textMuted }}> {unit}</span>
      </span>
      <button
        type="button"
        aria-label="+"
        disabled={disabled}
        onClick={() => onChange(Math.round((current + step) * 10) / 10)}
        style={btnStyle}
      >
        +
      </button>
    </div>
  );
}

export function SetRow({ set, isDurationBased, onChange, onToggleDone }: SetRowProps) {
  const theme = useTheme();

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 10px',
        borderRadius: '14px',
        background: set.done ? 'rgba(83, 212, 107, 0.1)' : 'rgba(255,255,255,0.04)',
        border: `1px solid ${set.done ? 'rgba(83, 212, 107, 0.35)' : 'rgba(255,255,255,0.08)'}`,
        marginBottom: '6px',
        transition: 'background 0.2s, border 0.2s',
      }}
    >
      <span
        style={{
          width: '18px',
          fontSize: '12px',
          fontWeight: 800,
          color: theme.palette.textMuted,
          flexShrink: 0,
          textAlign: 'center',
        }}
      >
        {set.setNumber}
      </span>

      <div style={{ flex: 1, display: 'flex', justifyContent: 'space-around', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
        {isDurationBased ? (
          <Stepper
            value={set.durationSec}
            unit={t('workout.sec')}
            step={15}
            onChange={(v) => onChange({ ...set, durationSec: v })}
            disabled={set.done}
          />
        ) : (
          <>
            <Stepper
              value={set.weightKg}
              unit={t('workout.kg')}
              step={2.5}
              onChange={(v) => onChange({ ...set, weightKg: v })}
              disabled={set.done}
            />
            <Stepper
              value={set.reps}
              unit={t('workout.repsShort')}
              step={1}
              min={1}
              onChange={(v) => onChange({ ...set, reps: v })}
              disabled={set.done}
            />
          </>
        )}
      </div>

      <button
        type="button"
        onClick={onToggleDone}
        aria-label={set.done ? t('workout.setUndone') : t('workout.setDone')}
        aria-pressed={set.done}
        style={{
          width: '34px',
          height: '34px',
          borderRadius: '11px',
          border: set.done ? 'none' : '1px solid rgba(160, 200, 220, 0.3)',
          background: set.done
            ? 'linear-gradient(180deg, rgba(83, 212, 107, 1), rgba(60, 170, 82, 1))'
            : 'rgba(255,255,255,0.05)',
          color: set.done ? '#07210f' : theme.palette.textMuted,
          fontSize: '16px',
          fontWeight: 800,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 0,
          flexShrink: 0,
          fontFamily: 'inherit',
        }}
      >
        ✓
      </button>
    </div>
  );
}
