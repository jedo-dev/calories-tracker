import { useEffect, useState } from 'react';
import { apiClient } from '../api/client';
import { t } from '../i18n';
import { useTheme } from '../theme/useTheme';
import { glassCardStyle, pageBackground } from '../theme/styles';
import Loader from '../ui/Loader';
import { track } from '../utils/analytics';

interface ActiveFast {
  id: string;
  startedAt: string;
  targetHours: number;
}

interface HistoryItem {
  id: string;
  startedAt: string;
  endedAt: string;
  targetHours: number;
  elapsedHours: number;
  completed: boolean;
}

// Протоколы: часы голодания / окно питания
const PROTOCOLS = [
  { fast: 12, eat: 12 },
  { fast: 16, eat: 8 },
  { fast: 18, eat: 6 },
  { fast: 20, eat: 4 },
];

function formatDuration(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function FastingPage() {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<ActiveFast | null>(null);
  const [xpReward, setXpReward] = useState(5);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [selectedFast, setSelectedFast] = useState(16);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  // Тик раз в секунду для перерисовки таймера
  const [, setTick] = useState(0);

  const load = async () => {
    try {
      const [currentRes, historyRes] = await Promise.all([
        apiClient.get('/fasting/current'),
        apiClient.get('/fasting/history'),
      ]);
      setActive(currentRes.data.active);
      setXpReward(currentRes.data.xpReward ?? 5);
      setHistory(historyRes.data);
    } catch {
      setMessage(t('fasting.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!active) return;
    const timer = window.setInterval(() => setTick((n) => n + 1), 1000);
    return () => window.clearInterval(timer);
  }, [active]);

  const start = async () => {
    if (busy) return;
    setBusy(true);
    setMessage(null);
    try {
      const res = await apiClient.post('/fasting/start', { targetHours: selectedFast });
      setActive(res.data.active);
      track('fasting_started', { targetHours: selectedFast });
    } catch (err: any) {
      setMessage(err.response?.data?.message || t('fasting.actionFailed'));
    } finally {
      setBusy(false);
    }
  };

  const stop = async () => {
    if (busy) return;
    setBusy(true);
    setMessage(null);
    try {
      const res = await apiClient.post('/fasting/stop');
      setActive(null);
      setMessage(
        res.data.completed
          ? t('fasting.completedResult', { hours: res.data.elapsedHours, xp: res.data.xpGranted })
          : t('fasting.stoppedResult', { hours: res.data.elapsedHours, target: res.data.targetHours }),
      );
      track('fasting_stopped', { completed: res.data.completed });
      const historyRes = await apiClient.get('/fasting/history').catch(() => null);
      if (historyRes) setHistory(historyRes.data);
    } catch (err: any) {
      setMessage(err.response?.data?.message || t('fasting.actionFailed'));
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <Loader />;

  const elapsedMs = active ? Date.now() - new Date(active.startedAt).getTime() : 0;
  const targetMs = active ? active.targetHours * 3600_000 : 0;
  const goalReached = active != null && elapsedMs >= targetMs;
  const progress = active ? Math.min(100, (100 * elapsedMs) / targetMs) : 0;

  const primaryButton = (label: string, onClick: () => void, accent = '83, 212, 107') => (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      style={{
        width: '100%',
        background: `rgba(${accent}, 0.16)`,
        border: `1px solid rgba(${accent}, 0.5)`,
        color: `rgb(${accent})`,
        borderRadius: '14px',
        padding: '13px',
        fontSize: '15px',
        fontWeight: 800,
        cursor: 'pointer',
        opacity: busy ? 0.6 : 1,
        outline: 'none',
        WebkitTapHighlightColor: 'transparent',
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
        paddingBottom: '100px',
        background: pageBackground(theme.palette.bg),
      }}
    >
      <h1 style={{ fontSize: '20px', fontWeight: 800, color: theme.palette.text, margin: '6px 0 14px' }}>
        ⏳ {t('fasting.pageTitle')}
      </h1>

      {message && (
        <div style={{ ...glassCardStyle, marginBottom: theme.spacing.md, color: '#7BD98A', fontSize: '14px', fontWeight: 600 }}>
          {message}
        </div>
      )}

      <div style={{ ...glassCardStyle, marginBottom: theme.spacing.md }}>
        {active ? (
          <>
            <div style={{ fontSize: '13px', color: theme.palette.textMuted, fontWeight: 600 }}>
              {goalReached ? t('fasting.goalReached') : t('fasting.inProgress')}
            </div>
            <div
              style={{
                fontSize: '44px',
                fontWeight: 800,
                letterSpacing: '-1px',
                color: goalReached ? '#7BD98A' : theme.palette.text,
                margin: '8px 0 4px',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {formatDuration(elapsedMs)}
            </div>
            <div style={{ fontSize: '13px', color: theme.palette.textMuted, marginBottom: '12px' }}>
              {t('fasting.target', { n: active.targetHours })}
              {!goalReached && ` · ${t('fasting.remaining')} ${formatDuration(targetMs - elapsedMs)}`}
              {' · '}
              {t('fasting.startedAt', {
                time: new Date(active.startedAt).toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' }),
              })}
            </div>
            <div
              style={{
                height: '10px',
                borderRadius: '5px',
                background: 'rgba(160, 200, 220, 0.15)',
                overflow: 'hidden',
                marginBottom: '14px',
              }}
            >
              <div
                style={{
                  width: `${progress}%`,
                  height: '100%',
                  borderRadius: '5px',
                  background: goalReached
                    ? 'rgba(83, 212, 107, 0.9)'
                    : 'linear-gradient(90deg, rgba(255, 196, 87, 0.9), rgba(83, 212, 107, 0.9))',
                  transition: 'width 1s linear',
                }}
              />
            </div>
            {primaryButton(
              goalReached ? t('fasting.stop') : t('fasting.stopEarly'),
              stop,
              goalReached ? '83, 212, 107' : '255, 196, 87',
            )}
          </>
        ) : (
          <>
            <div style={{ fontSize: '14px', fontWeight: 700, color: theme.palette.text }}>
              {t('fasting.chooseProtocol')}
            </div>
            <div style={{ fontSize: '12px', color: theme.palette.textMuted, margin: '3px 0 12px' }}>
              {t('fasting.protocolHint')}
            </div>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
              {PROTOCOLS.map((p) => {
                const isSelected = selectedFast === p.fast;
                return (
                  <button
                    key={p.fast}
                    type="button"
                    onClick={() => setSelectedFast(p.fast)}
                    style={{
                      flex: 1,
                      background: isSelected ? 'rgba(83, 212, 107, 0.18)' : 'rgba(160, 200, 220, 0.08)',
                      border: `1px solid ${isSelected ? 'rgba(83, 212, 107, 0.55)' : 'rgba(160, 200, 220, 0.22)'}`,
                      color: isSelected ? '#7BD98A' : theme.palette.text,
                      borderRadius: '12px',
                      padding: '11px 4px',
                      fontSize: '15px',
                      fontWeight: 800,
                      cursor: 'pointer',
                      outline: 'none',
                      WebkitTapHighlightColor: 'transparent',
                    }}
                  >
                    {p.fast}:{p.eat}
                  </button>
                );
              })}
            </div>
            {primaryButton(t('fasting.start'), start)}
            <div style={{ fontSize: '12px', color: theme.palette.textMuted, marginTop: '10px', textAlign: 'center' }}>
              {t('fasting.xpHint', { xp: xpReward })}
            </div>
          </>
        )}
      </div>

      <div style={glassCardStyle}>
        <div style={{ fontSize: '14px', fontWeight: 700, color: theme.palette.text, marginBottom: '8px' }}>
          {t('fasting.history')}
        </div>
        {history.length === 0 && (
          <div style={{ fontSize: '13px', color: theme.palette.textMuted }}>{t('fasting.historyEmpty')}</div>
        )}
        {history.map((h) => (
          <div
            key={h.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '10px',
              padding: '8px 0',
              borderBottom: '1px solid rgba(160, 200, 220, 0.1)',
            }}
          >
            <div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: theme.palette.text }}>
                {new Date(h.startedAt).toLocaleDateString('ru', { day: 'numeric', month: 'short' })}
                {' · '}
                {h.elapsedHours} {t('fasting.hoursShort')} / {h.targetHours} {t('fasting.hoursShort')}
              </div>
              <div style={{ fontSize: '11px', color: h.completed ? '#7BD98A' : theme.palette.textMuted }}>
                {t(h.completed ? 'fasting.historyCompleted' : 'fasting.historyStopped')}
              </div>
            </div>
            <span style={{ fontSize: '16px' }}>{h.completed ? '✅' : '⏹'}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
