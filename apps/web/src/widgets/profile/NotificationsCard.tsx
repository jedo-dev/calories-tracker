import { useEffect, useState } from 'react';
import { apiClient } from '../../api/client';
import { t } from '../../i18n';
import { useTheme } from '../../theme/useTheme';
import { glassCardStyle } from '../../theme/styles';
import { isPushSupported, subscribeToPush, unsubscribeFromPush } from '../../utils/push';
import { track } from '../../utils/analytics';

interface NotificationSettings {
  enabled: boolean;
  mealReminders: boolean;
  waterReminder: boolean;
  streakReminder: boolean;
  weeklyReport: boolean;
  quietFrom: string;
  quietTo: string;
  pushConfigured: boolean;
}

// Карточка пуш-уведомлений в профиле. Разрешение браузера запрашивается только
// по явному включению главного тумблера — никаких попапов при загрузке.
export function NotificationsCard() {
  const theme = useTheme();
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  // Кнопка «Тестовый пуш» видна только сразу после включения тумблера:
  // в этот момент она нужна для проверки доставки, дальше — просто шум.
  const [justEnabled, setJustEnabled] = useState(false);

  useEffect(() => {
    apiClient
      .get('/notifications/settings')
      .then((res) => setSettings(res.data))
      .catch(() => setSettings(null));
  }, []);

  // Запрос настроек упал (нет роута/авторизации) — карточку не показываем
  if (!settings) return null;

  // Пуши недоступны: показываем карточку с причиной, а не прячем её —
  // иначе непонятно, куда делись настройки.
  const unavailableReason = !settings.pushConfigured
    ? t('notifications.notConfigured')
    : !isPushSupported()
      ? t('notifications.unsupported')
      : null;

  const patch = async (update: Partial<NotificationSettings>) => {
    const prev = settings;
    setSettings({ ...settings, ...update });
    try {
      const res = await apiClient.put('/notifications/settings', {
        ...update,
        tzOffsetMinutes: new Date().getTimezoneOffset(),
      });
      setSettings(res.data);
    } catch {
      setSettings(prev);
    }
  };

  const toggleMaster = async () => {
    if (busy) return;
    setBusy(true);
    setMessage(null);
    try {
      if (!settings.enabled) {
        const result = await subscribeToPush();
        if (result === 'ok') {
          setSettings({ ...settings, enabled: true });
          setJustEnabled(true);
          track('push_enabled');
        } else {
          setMessage(t(`notifications.${result === 'denied' ? 'denied' : result === 'unsupported' ? 'unsupported' : 'error'}`));
        }
      } else {
        await unsubscribeFromPush();
        await patch({ enabled: false });
        setJustEnabled(false);
      }
    } finally {
      setBusy(false);
    }
  };

  const sendTest = async () => {
    if (busy) return;
    setBusy(true);
    setMessage(null);
    try {
      const res = await apiClient.post('/notifications/test');
      setMessage(t(res.data?.delivered > 0 ? 'notifications.testSent' : 'notifications.testFailed'));
    } catch {
      setMessage(t('notifications.testFailed'));
    } finally {
      setBusy(false);
    }
  };

  const rowStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '10px',
    padding: '9px 0',
  };

  const toggle = (checked: boolean, onChange: () => void, disabled = false) => (
    <button
      type="button"
      onClick={onChange}
      disabled={disabled}
      aria-pressed={checked}
      style={{
        width: '46px',
        height: '26px',
        borderRadius: '999px',
        border: 'none',
        cursor: disabled ? 'default' : 'pointer',
        background: checked ? 'rgba(83, 212, 107, 0.85)' : 'rgba(160, 200, 220, 0.25)',
        position: 'relative',
        transition: 'background .15s',
        flex: '0 0 46px',
        opacity: disabled ? 0.5 : 1,
        outline: 'none',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      <span
        style={{
          position: 'absolute',
          top: '3px',
          left: checked ? '23px' : '3px',
          width: '20px',
          height: '20px',
          borderRadius: '50%',
          background: '#fff',
          transition: 'left .15s',
        }}
      />
    </button>
  );

  const label = (title: string, desc?: string) => (
    <div style={{ minWidth: 0 }}>
      <div style={{ fontSize: '14px', fontWeight: 600, color: theme.palette.text }}>{title}</div>
      {desc && (
        <div style={{ fontSize: '12px', color: theme.palette.textMuted, marginTop: '2px' }}>{desc}</div>
      )}
    </div>
  );

  const timeInputStyle: React.CSSProperties = {
    background: 'rgba(160, 200, 220, 0.12)',
    border: '1px solid rgba(160, 200, 220, 0.25)',
    borderRadius: '10px',
    color: theme.palette.text,
    padding: '6px 8px',
    fontSize: '13px',
    outline: 'none',
  };

  return (
    <div style={{ ...glassCardStyle, marginBottom: theme.spacing.md }}>
      <div style={rowStyle}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: '15px', fontWeight: 700, color: theme.palette.text }}>
            🔔 {t('notifications.title')}
          </div>
          <div style={{ fontSize: '12px', color: theme.palette.textMuted, marginTop: '2px' }}>
            {t('notifications.subtitle')}
          </div>
        </div>
        {!unavailableReason && toggle(settings.enabled, toggleMaster, busy)}
      </div>

      {unavailableReason && (
        <div style={{ fontSize: '13px', color: theme.palette.textMuted, padding: '4px 0 6px' }}>
          {unavailableReason}
        </div>
      )}

      {message && (
        <div style={{ fontSize: '13px', color: '#ffcf8a', padding: '4px 0 8px' }}>{message}</div>
      )}

      {!unavailableReason && settings.enabled && (
        <>
          <div style={rowStyle}>
            {label(t('notifications.mealReminders'), t('notifications.mealRemindersDesc'))}
            {toggle(settings.mealReminders, () => patch({ mealReminders: !settings.mealReminders }))}
          </div>
          <div style={rowStyle}>
            {label(t('notifications.waterReminder'), t('notifications.waterReminderDesc'))}
            {toggle(settings.waterReminder, () => patch({ waterReminder: !settings.waterReminder }))}
          </div>
          <div style={rowStyle}>
            {label(t('notifications.streakReminder'), t('notifications.streakReminderDesc'))}
            {toggle(settings.streakReminder, () => patch({ streakReminder: !settings.streakReminder }))}
          </div>
          <div style={rowStyle}>
            {label(t('notifications.weeklyReport'), t('notifications.weeklyReportDesc'))}
            {toggle(settings.weeklyReport, () => patch({ weeklyReport: !settings.weeklyReport }))}
          </div>

          <div style={rowStyle}>
            {label(t('notifications.quietHours'), t('notifications.quietHoursDesc'))}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: '0 0 auto' }}>
              <input
                type="time"
                value={settings.quietFrom}
                onChange={(e) => e.target.value && patch({ quietFrom: e.target.value })}
                style={timeInputStyle}
              />
              <span style={{ fontSize: '12px', color: theme.palette.textMuted }}>
                {t('notifications.to')}
              </span>
              <input
                type="time"
                value={settings.quietTo}
                onChange={(e) => e.target.value && patch({ quietTo: e.target.value })}
                style={timeInputStyle}
              />
            </div>
          </div>

          {justEnabled && (
          <button
            type="button"
            onClick={sendTest}
            disabled={busy}
            style={{
              marginTop: '6px',
              background: 'rgba(83, 212, 107, 0.14)',
              border: '1px solid rgba(83, 212, 107, 0.4)',
              color: '#7BD98A',
              borderRadius: '12px',
              padding: '9px 13px',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              outline: 'none',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            {t('notifications.test')}
          </button>
          )}
        </>
      )}
    </div>
  );
}
