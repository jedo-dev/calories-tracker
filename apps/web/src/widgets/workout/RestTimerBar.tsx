import { useEffect, useRef, useState } from 'react';
import { t } from '../../i18n';
import { useTheme } from '../../theme/useTheme';
import { hapticNotification } from '../../utils/hapticFeedback';

interface RestTimerBarProps {
  // Changing this key restarts the timer (e.g. `${logId}-${setNumber}`)
  timerKey: string;
  restSec: number;
  onFinish: () => void;
}

export function RestTimerBar({ timerKey, restSec, onFinish }: RestTimerBarProps) {
  const theme = useTheme();
  const [endsAt, setEndsAt] = useState(() => Date.now() + restSec * 1000);
  const [remainingMs, setRemainingMs] = useState(restSec * 1000);
  const finishedRef = useRef(false);

  useEffect(() => {
    finishedRef.current = false;
    setEndsAt(Date.now() + restSec * 1000);
    setRemainingMs(restSec * 1000);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timerKey]);

  useEffect(() => {
    const interval = setInterval(() => {
      const left = endsAt - Date.now();
      setRemainingMs(Math.max(0, left));
      if (left <= 0 && !finishedRef.current) {
        finishedRef.current = true;
        hapticNotification('success');
        onFinish();
      }
    }, 250);
    return () => clearInterval(interval);
  }, [endsAt, onFinish]);

  const totalSec = Math.ceil(remainingMs / 1000);
  const mm = Math.floor(totalSec / 60);
  const ss = totalSec % 60;

  const adjustBtn: React.CSSProperties = {
    padding: '8px 12px',
    borderRadius: '12px',
    border: '1px solid rgba(160, 200, 220, 0.24)',
    background: 'rgba(255,255,255,0.07)',
    color: theme.palette.text,
    fontSize: '12px',
    fontWeight: 800,
    cursor: 'pointer',
    fontFamily: 'inherit',
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '12px 14px',
        borderRadius: '18px',
        background: 'linear-gradient(180deg, rgba(17, 49, 69, 0.98), rgba(10, 32, 46, 0.98))',
        border: `1px solid ${theme.palette.primary}55`,
        boxShadow: '0 18px 34px rgba(0, 0, 0, 0.4)',
      }}
    >
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '11px', fontWeight: 700, color: theme.palette.textMuted, marginBottom: '2px' }}>
          {t('workout.rest')}
        </div>
        <div style={{ fontSize: '26px', fontWeight: 800, color: theme.palette.primary, fontVariantNumeric: 'tabular-nums' }}>
          {mm}:{String(ss).padStart(2, '0')}
        </div>
      </div>
      <button type="button" onClick={() => setEndsAt((v) => v - 15000)} style={adjustBtn}>
        −15{t('workout.sec')}
      </button>
      <button type="button" onClick={() => setEndsAt((v) => v + 15000)} style={adjustBtn}>
        +15{t('workout.sec')}
      </button>
      <button
        type="button"
        onClick={() => {
          if (!finishedRef.current) {
            finishedRef.current = true;
            onFinish();
          }
        }}
        style={{ ...adjustBtn, background: `${theme.palette.primary}22`, color: theme.palette.primary, border: `1px solid ${theme.palette.primary}66` }}
      >
        {t('workout.skipRest')}
      </button>
    </div>
  );
}
