import { useEffect, useRef, useState } from 'react';
import { t } from '../../i18n';
import { useTheme } from '../../theme/useTheme';
import { playTimerFinishSound, unlockTimerSound } from '../../utils/timerSound';
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
  const [timerRunning, setTimerRunning] = useState(false);
  const [remainingSec, setRemainingSec] = useState<number | null>(null);
  const endsAtRef = useRef(0);
  const doneRef = useRef(onToggleDone);
  doneRef.current = onToggleDone;

  const durationSec = set.durationSec ?? 0;

  useEffect(() => {
    if (!timerRunning) return;
    endsAtRef.current = Date.now() + durationSec * 1000;
    setRemainingSec(durationSec);

    const interval = setInterval(() => {
      const left = Math.max(0, endsAtRef.current - Date.now());
      setRemainingSec(Math.ceil(left / 1000));
      if (left <= 0) {
        clearInterval(interval);
        setTimerRunning(false);
        setRemainingSec(null);
        playTimerFinishSound();
        // finished — mark the set done as if ✓ was pressed
        doneRef.current();
      }
    }, 200);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timerRunning]);

  // external done toggle (or undo) cancels a running timer
  useEffect(() => {
    if (set.done && timerRunning) {
      setTimerRunning(false);
      setRemainingSec(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [set.done]);

  const showTimerButton = isDurationBased;
  const timerDisabled = set.done || durationSec <= 0;
  const progress = timerRunning && remainingSec != null && durationSec > 0
    ? 1 - remainingSec / durationSec
    : 0;

  return (
    <div
      style={{
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 10px',
        borderRadius: '14px',
        background: set.done ? 'rgba(83, 212, 107, 0.1)' : 'rgba(255,255,255,0.04)',
        border: `1px solid ${
          set.done
            ? 'rgba(83, 212, 107, 0.35)'
            : timerRunning
              ? 'rgba(83, 212, 107, 0.45)'
              : 'rgba(255,255,255,0.08)'
        }`,
        marginBottom: '6px',
        transition: 'background 0.2s, border 0.2s',
      }}
    >
      {/* timer progress fill */}
      {timerRunning && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            width: `${progress * 100}%`,
            background: 'linear-gradient(90deg, rgba(83, 212, 107, 0.16), rgba(83, 212, 107, 0.28))',
            transition: 'width 0.25s linear',
            pointerEvents: 'none',
          }}
        />
      )}

      <span
        style={{
          width: '18px',
          fontSize: '12px',
          fontWeight: 800,
          color: theme.palette.textMuted,
          flexShrink: 0,
          textAlign: 'center',
          position: 'relative',
        }}
      >
        {set.setNumber}
      </span>

      <div style={{ flex: 1, display: 'flex', justifyContent: 'space-around', alignItems: 'center', gap: '6px', flexWrap: 'wrap', position: 'relative' }}>
        {isDurationBased ? (
          timerRunning ? (
            <span
              style={{
                fontSize: '17px',
                fontWeight: 800,
                color: theme.palette.primary,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {remainingSec}
              <span style={{ fontSize: '11px', fontWeight: 600, color: theme.palette.textMuted }}> {t('workout.sec')}</span>
            </span>
          ) : (
            <Stepper
              value={set.durationSec}
              unit={t('workout.sec')}
              step={15}
              onChange={(v) => onChange({ ...set, durationSec: v })}
              disabled={set.done}
            />
          )
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

      {showTimerButton && (
        <button
          type="button"
          disabled={timerDisabled}
          onClick={() => {
            if (timerRunning) {
              setTimerRunning(false);
              setRemainingSec(null);
            } else {
              // клик — единственный момент, когда браузер разрешит звук
              unlockTimerSound();
              setTimerRunning(true);
            }
          }}
          aria-label={timerRunning ? t('workout.timerStop') : t('workout.timerStart')}
          style={{
            width: '34px',
            height: '34px',
            borderRadius: '11px',
            border: timerRunning ? 'none' : `1px solid ${theme.palette.primary}66`,
            background: timerRunning
              ? 'linear-gradient(180deg, rgba(255, 168, 87, 1), rgba(230, 126, 45, 1))'
              : `${theme.palette.primary}1f`,
            color: timerRunning ? '#2a1503' : theme.palette.primary,
            fontSize: '13px',
            fontWeight: 800,
            cursor: timerDisabled ? 'default' : 'pointer',
            opacity: timerDisabled ? 0.35 : 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 0,
            flexShrink: 0,
            fontFamily: 'inherit',
            position: 'relative',
          }}
        >
          {timerRunning ? '■' : '▶'}
        </button>
      )}

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
          position: 'relative',
        }}
      >
        ✓
      </button>
    </div>
  );
}
