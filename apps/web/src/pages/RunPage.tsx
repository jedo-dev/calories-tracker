import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../api/client';
import { t, todayISO } from '../i18n';
import { useTheme } from '../theme/useTheme';
import { glassCardStyle, pageBackground } from '../theme/styles';
import { track } from '../utils/analytics';
import {
  StepCounter,
  isMotionSupported,
  requestMotionPermission,
} from '../utils/stepCounter';

type Phase = 'idle' | 'running' | 'paused' | 'saving';

// Длина шага при беге ≈ 0.65 × рост; запасное значение — на пустой профиль
function strideMeters(heightCm: number | null): number {
  return heightCm ? (heightCm / 100) * 0.65 : 1.1;
}

// MET бега примерно равен скорости в км/ч (8 км/ч ≈ 8.3 MET, 11 ≈ 11.0).
// Ниже 6 км/ч это уже ходьба — фиксируем нижнюю планку.
function estimateKcal(distanceM: number, seconds: number, weightKg: number | null): number {
  if (seconds < 30) return 0;
  const speedKmh = (distanceM / 1000) / (seconds / 3600);
  const met = Math.max(4.5, Math.min(16, speedKmh));
  return Math.round(met * (weightKg ?? 70) * (seconds / 3600));
}

function fmtTime(totalSec: number): string {
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const mm = String(m).padStart(2, '0');
  const ss = String(s).padStart(2, '0');
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

export function RunPage() {
  const theme = useTheme();
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>('idle');
  const [seconds, setSeconds] = useState(0);
  const [steps, setSteps] = useState(0);
  const [notice, setNotice] = useState<string | null>(null);
  const [body, setBody] = useState<{ weightKg: number | null; heightCm: number | null }>({
    weightKg: null,
    heightCm: null,
  });

  const counterRef = useRef<StepCounter | null>(null);
  const timerRef = useRef<number | null>(null);
  const wakeLockRef = useRef<any>(null);

  // Вес и рост нужны для калорий и длины шага
  useEffect(() => {
    apiClient
      .get('/profile')
      .then((res) =>
        setBody({
          weightKg: res.data?.profile?.weightKg ?? null,
          heightCm: res.data?.profile?.heightCm ?? null,
        }),
      )
      .catch(() => {});
  }, []);

  const acquireWakeLock = async () => {
    try {
      wakeLockRef.current = await (navigator as any).wakeLock?.request('screen');
    } catch {
      // Wake Lock не поддержан или запрещён — просто просим не блокировать экран
    }
  };

  // При возврате на вкладку Wake Lock надо брать заново — система его отпускает
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible' && phase === 'running') {
        void acquireWakeLock();
      }
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [phase]);

  // Полная уборка при уходе со страницы
  useEffect(() => {
    return () => {
      counterRef.current?.stop();
      if (timerRef.current != null) window.clearInterval(timerRef.current);
      wakeLockRef.current?.release?.().catch?.(() => {});
    };
  }, []);

  const startTicking = () => {
    timerRef.current = window.setInterval(() => setSeconds((s) => s + 1), 1000);
  };

  const start = async () => {
    setNotice(null);
    if (!isMotionSupported()) {
      setNotice(t('run.noMotion'));
    } else {
      const permission = await requestMotionPermission();
      if (permission === 'denied') {
        setNotice(t('run.motionDenied'));
      } else {
        if (!counterRef.current) counterRef.current = new StepCounter();
        counterRef.current.start((n) => setSteps(n));
      }
    }
    await acquireWakeLock();
    startTicking();
    setPhase('running');
    track('run_started');
  };

  const pause = () => {
    counterRef.current?.stop();
    if (timerRef.current != null) window.clearInterval(timerRef.current);
    timerRef.current = null;
    setPhase('paused');
  };

  const resume = () => {
    counterRef.current?.start((n) => setSteps(n));
    startTicking();
    setPhase('running');
  };

  const discard = () => {
    counterRef.current?.reset();
    setSteps(0);
    setSeconds(0);
    setPhase('idle');
    setNotice(null);
  };

  const distanceM = Math.round(steps * strideMeters(body.heightCm));
  const kcal = estimateKcal(distanceM, seconds, body.weightKg);
  const cadence = seconds > 0 ? Math.round((steps / seconds) * 60) : 0;

  const finish = async () => {
    if (seconds < 30) {
      setNotice(t('run.tooShort'));
      return;
    }
    pause();
    setPhase('saving');
    try {
      await apiClient.post('/workouts/runs', {
        date: todayISO(),
        durationSec: seconds,
        steps,
        distanceM,
        caloriesBurned: kcal,
      });
      track('run_completed', { durationSec: seconds, steps });
      navigate('/workouts');
    } catch {
      setNotice(t('run.saveFailed'));
      setPhase('paused');
    }
  };

  const stat = (label: string, value: string) => (
    <div style={{ ...glassCardStyle, padding: '12px', textAlign: 'center', flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: '20px', fontWeight: 800, color: theme.palette.text }}>{value}</div>
      <div style={{ fontSize: '11px', color: theme.palette.textMuted, marginTop: '2px' }}>{label}</div>
    </div>
  );

  const bigButton = (label: string, onClick: () => void, accent = '83, 212, 107') => (
    <button
      type="button"
      onClick={onClick}
      disabled={phase === 'saving'}
      style={{
        flex: 1,
        background: `rgba(${accent}, 0.18)`,
        border: `1px solid rgba(${accent}, 0.5)`,
        color: `rgb(${accent})`,
        borderRadius: '16px',
        padding: '16px',
        fontSize: '16px',
        fontWeight: 800,
        cursor: 'pointer',
        outline: 'none',
        WebkitTapHighlightColor: 'transparent',
        opacity: phase === 'saving' ? 0.5 : 1,
      }}
    >
      {label}
    </button>
  );

  return (
    <div
      style={{
        minHeight: '100vh',
        maxWidth: '520px',
        margin: '0 auto',
        padding: '12px',
        paddingTop: 'calc(12px + env(safe-area-inset-top, 0px))',
        paddingBottom: '110px',
        background: pageBackground(theme.palette.bg),
      }}
    >
      <h1 style={{ fontSize: '22px', fontWeight: 800, color: theme.palette.text, margin: '8px 0 2px' }}>
        🏃 {t('run.title')}
      </h1>
      <div style={{ fontSize: '13px', color: theme.palette.textMuted, marginBottom: '16px' }}>
        {t('run.subtitle')}
      </div>

      <div style={{ ...glassCardStyle, textAlign: 'center', padding: '26px 14px', marginBottom: '10px' }}>
        <div
          style={{
            fontSize: '56px',
            fontWeight: 800,
            letterSpacing: '2px',
            color: theme.palette.text,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {fmtTime(seconds)}
        </div>
        <div style={{ fontSize: '12px', color: theme.palette.textMuted }}>{t('run.time')}</div>
        {phase === 'running' && (
          <div style={{ fontSize: '12px', color: '#8FD8FF', marginTop: '8px' }}>
            {t('run.keepScreenOn')}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
        {stat(t('run.steps'), String(steps))}
        {stat(t('run.distance'), distanceM >= 1000 ? `${(distanceM / 1000).toFixed(2)} км` : `${distanceM} м`)}
      </div>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
        {stat(t('run.cadence'), `${cadence}/мин`)}
        {stat(t('run.kcal'), String(kcal))}
      </div>

      {notice && (
        <div style={{ fontSize: '13px', color: '#ffcf8a', marginBottom: '12px' }}>{notice}</div>
      )}

      {phase === 'idle' && (
        <div style={{ display: 'flex', gap: '10px' }}>{bigButton(t('run.start'), start)}</div>
      )}
      {phase === 'running' && (
        <div style={{ display: 'flex', gap: '10px' }}>
          {bigButton(t('run.pause'), pause, '255, 214, 102')}
          {bigButton(t('run.finish'), finish)}
        </div>
      )}
      {(phase === 'paused' || phase === 'saving') && (
        <div style={{ display: 'flex', gap: '10px' }}>
          {bigButton(t('run.resume'), resume, '143, 216, 255')}
          {bigButton(t('run.finish'), finish)}
          {bigButton(t('run.discard'), discard, '255, 138, 138')}
        </div>
      )}

      {phase === 'idle' && (
        <div style={{ fontSize: '12px', color: theme.palette.textMuted, marginTop: '12px' }}>
          {t('run.stepsHint')}
        </div>
      )}
    </div>
  );
}
