import { useEffect, useState } from 'react';
import { apiClient } from '../../api/client';
import { t } from '../../i18n';
import { useTheme } from '../../theme/useTheme';
import { glassCardStyle } from '../../theme/styles';
import { track } from '../../utils/analytics';

interface StreakState {
  currentStreak: number;
  bestStreak: number;
  xpTotal: number;
  streakFreezes: number;
  lostStreak: number;
  lostStreakDate?: string;
}

interface StreakShop {
  freezeCost: number;
  freezeMax: number;
  restoreCost: number;
}

// Карточка стрика в профиле: запас фризов, покупка за XP и баннер
// восстановления сгоревшей серии. Механика защищает от главной точки
// оттока — потери длинного стрика из-за одного пропущенного дня.
export function StreakCard() {
  const theme = useTheme();
  const [stats, setStats] = useState<StreakState | null>(null);
  const [shop, setShop] = useState<StreakShop | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    apiClient
      .get('/social/me')
      .then((res) => {
        setStats(res.data.stats);
        setShop(res.data.streakShop);
      })
      .catch(() => setStats(null));
  }, []);

  if (!stats || !shop) return null;

  // Окно восстановления — 2 дня от даты потери (сервер проверит точнее)
  const lostActive =
    stats.lostStreak > 0 &&
    !!stats.lostStreakDate &&
    Date.now() - new Date(stats.lostStreakDate + 'T00:00:00Z').getTime() <= 3 * 86400000;

  const buyFreeze = async () => {
    if (busy) return;
    setBusy(true);
    setMessage(null);
    try {
      const res = await apiClient.post('/social/streak-freeze/buy');
      setStats({ ...stats, streakFreezes: res.data.streakFreezes, xpTotal: res.data.xpTotal });
      setMessage(t('streak.freezeBought'));
      track('streak_freeze_bought');
    } catch (err: any) {
      setMessage(err.response?.data?.message || t('streak.actionFailed'));
    } finally {
      setBusy(false);
    }
  };

  const restore = async () => {
    if (busy) return;
    setBusy(true);
    setMessage(null);
    try {
      const res = await apiClient.post('/social/streak/restore');
      setStats({
        ...stats,
        currentStreak: res.data.currentStreak,
        xpTotal: res.data.xpTotal,
        lostStreak: 0,
        lostStreakDate: undefined,
      });
      setMessage(t('streak.restored'));
      track('streak_restored');
    } catch (err: any) {
      setMessage(err.response?.data?.message || t('streak.actionFailed'));
    } finally {
      setBusy(false);
    }
  };

  const canBuy = stats.streakFreezes < shop.freezeMax && stats.xpTotal >= shop.freezeCost;
  const buyHint =
    stats.streakFreezes >= shop.freezeMax
      ? t('streak.freezesFull')
      : stats.xpTotal < shop.freezeCost
        ? t('streak.notEnoughXp')
        : null;

  const pillButton = (label: string, onClick: () => void, disabled: boolean, accent: string) => (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        background: `rgba(${accent}, 0.16)`,
        border: `1px solid rgba(${accent}, 0.45)`,
        color: `rgb(${accent})`,
        borderRadius: '12px',
        padding: '8px 12px',
        fontSize: '13px',
        fontWeight: 700,
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        whiteSpace: 'nowrap',
        outline: 'none',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      {label}
    </button>
  );

  return (
    <div style={{ ...glassCardStyle, marginBottom: theme.spacing.md }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: '11px',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: theme.palette.textMuted,
              fontWeight: 700,
            }}
          >
            {t('streak.title')}
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '4px' }}>
            <span style={{ fontSize: '28px', fontWeight: 800, color: theme.palette.text }}>
              🔥 {t('streak.days', { n: stats.currentStreak })}
            </span>
            <span style={{ fontSize: '12px', color: theme.palette.textMuted }}>
              {t('streak.best', { n: stats.bestStreak })}
            </span>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '20px', fontWeight: 800, color: '#8FD8FF' }}>
            ❄️ {stats.streakFreezes}/{shop.freezeMax}
          </div>
          <div style={{ fontSize: '11px', color: theme.palette.textMuted }}>{t('streak.freezes')}</div>
        </div>
      </div>

      <div style={{ fontSize: '12px', color: theme.palette.textMuted, margin: '8px 0 10px' }}>
        {t('streak.freezesDesc')}
      </div>

      {lostActive && (
        <div
          style={{
            background: 'rgba(255, 138, 138, 0.1)',
            border: '1px solid rgba(255, 138, 138, 0.35)',
            borderRadius: '14px',
            padding: '10px 12px',
            marginBottom: '10px',
          }}
        >
          <div style={{ fontSize: '14px', fontWeight: 700, color: '#ff8a8a' }}>
            {t('streak.lostBanner', { n: stats.lostStreak })}
          </div>
          <div style={{ fontSize: '12px', color: theme.palette.textMuted, margin: '3px 0 8px' }}>
            {t('streak.lostDesc')}
          </div>
          {pillButton(
            t('streak.restore', { cost: shop.restoreCost }),
            restore,
            busy || stats.xpTotal < shop.restoreCost,
            '255, 138, 138',
          )}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
        {pillButton(t('streak.buyFreeze', { cost: shop.freezeCost }), buyFreeze, busy || !canBuy, '143, 216, 255')}
        {buyHint && (
          <span style={{ fontSize: '12px', color: theme.palette.textMuted }}>{buyHint}</span>
        )}
        {message && <span style={{ fontSize: '12px', color: '#7BD98A' }}>{message}</span>}
      </div>
    </div>
  );
}
