import { useEffect, useState } from 'react';
import { t } from '../../i18n';
import { useTheme } from '../../theme/useTheme';
import { track } from '../../utils/analytics';
import { isTourActive } from '../../tour/tour';
import { setInstallGuideBusy } from '../../utils/overlays';
import {
  hasNativeInstall,
  isAndroid,
  isIOS,
  isIOSInAppBrowser,
  isIOSSafari,
  isStandalone,
  promptNativeInstall,
} from '../../utils/installPrompt';

// Через сколько показывать снова после «Позже»
const SNOOZE_DAYS = 14;
const NEVER_KEY = 'pwaGuideNever';
const SNOOZE_KEY = 'pwaGuideSnoozedAt';

function isEligible(): boolean {
  if (isStandalone()) return false;
  if (!isIOS() && !isAndroid()) return false;
  if (localStorage.getItem(NEVER_KEY)) return false;
  const snoozedAt = Number(localStorage.getItem(SNOOZE_KEY) || 0);
  if (snoozedAt && Date.now() - snoozedAt < SNOOZE_DAYS * 86400_000) return false;
  return true;
}

// Модалка-гайд «установите приложение»: Android — нативная установка одной
// кнопкой (beforeinstallprompt), iOS — пошаговая инструкция со стрелкой на
// кнопку «Поделиться». Появляется с задержкой и не чаще раза в 2 недели.
export function InstallGuide() {
  const theme = useTheme();
  const [visible, setVisible] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!isEligible()) return;
    // С этого момента экран «занят»: автотуры ждут, пока пользователь ответит
    setInstallGuideBusy(true);
    let timer = 0;
    const show = () => {
      // Если тур уже запущен вручную — не лезем поверх, ждём его конца
      if (isTourActive()) {
        timer = window.setTimeout(show, 2000);
        return;
      }
      setVisible(true);
      track('pwa_guide_shown', {
        platform: isIOS() ? 'ios' : 'android',
        inApp: isIOSInAppBrowser(),
      });
    };
    // Не встречать пользователя попапом: даём осмотреться
    timer = window.setTimeout(show, 6000);
    return () => {
      window.clearTimeout(timer);
      setInstallGuideBusy(false);
    };
  }, []);

  if (!visible) return null;

  const dismiss = () => {
    setVisible(false);
    setInstallGuideBusy(false);
  };

  const snooze = () => {
    localStorage.setItem(SNOOZE_KEY, String(Date.now()));
    dismiss();
  };

  const never = () => {
    localStorage.setItem(NEVER_KEY, '1');
    track('pwa_guide_never');
    dismiss();
  };

  const install = async () => {
    track('pwa_install_clicked');
    const accepted = await promptNativeInstall();
    if (accepted) {
      track('pwa_installed');
      setDone(true);
      window.setTimeout(dismiss, 2000);
    }
  };

  const ios = isIOS();
  // Внутри webview Telegram/Instagram и т.п. Safari-меню недоступно вовсе —
  // ведём пользователя через «Открыть в Safari» в меню самого приложения
  const iosInApp = ios && isIOSInAppBrowser();
  const iosWrongBrowser = ios && !iosInApp && !isIOSSafari();

  const step = (n: string, text: string, icon?: string) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '7px 0' }}>
      <span
        style={{
          flex: '0 0 26px',
          height: '26px',
          borderRadius: '50%',
          background: 'rgba(83, 212, 107, 0.18)',
          border: '1px solid rgba(83, 212, 107, 0.45)',
          color: '#7BD98A',
          fontSize: '13px',
          fontWeight: 800,
          display: 'grid',
          placeItems: 'center',
        }}
      >
        {n}
      </span>
      <span style={{ fontSize: '14px', color: theme.palette.text, lineHeight: 1.45 }}>
        {text} {icon}
      </span>
    </div>
  );

  return (
    <div
      onClick={snooze}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        background: 'rgba(3, 10, 18, 0.72)',
        backdropFilter: 'blur(2px)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        alignItems: 'center',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 'calc(100% - 24px)',
          maxWidth: '440px',
          borderRadius: '22px',
          background: 'linear-gradient(180deg, rgba(17, 49, 69, 0.99), rgba(10, 32, 46, 0.99))',
          border: '1px solid rgba(160, 200, 220, 0.22)',
          padding: '18px 18px 14px',
          // На iOS оставляем место стрелке, указывающей на «Поделиться» внизу
          marginBottom: ios && !iosWrongBrowser && !iosInApp ? '54px' : '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
          <img src="/icon-192.png" alt="" width={44} height={44} style={{ borderRadius: '12px' }} />
          <div>
            <div style={{ fontSize: '16px', fontWeight: 800, color: theme.palette.text }}>
              {t('install.title')}
            </div>
            <div style={{ fontSize: '12px', color: theme.palette.textMuted }}>
              {t('install.subtitle')}
            </div>
          </div>
        </div>

        {done ? (
          <div style={{ fontSize: '15px', color: '#7BD98A', fontWeight: 700, padding: '12px 0' }}>
            {t('install.installed')}
          </div>
        ) : iosInApp ? (
          <div style={{ padding: '4px 0' }}>
            {step('1', t('install.iosInAppStep1'))}
            {step('2', t('install.iosInAppStep2'), '🧭')}
            {step('3', t('install.iosInAppStep3'), '⬆️')}
          </div>
        ) : iosWrongBrowser ? (
          <div style={{ fontSize: '14px', color: theme.palette.text, padding: '8px 0', lineHeight: 1.5 }}>
            🧭 {t('install.iosNotSafari')}
          </div>
        ) : ios ? (
          <div style={{ padding: '4px 0' }}>
            {step('1', t('install.iosStep1'), '⬆️')}
            {step('2', t('install.iosStep2'), '➕')}
            {step('3', t('install.iosStep3'))}
          </div>
        ) : (
          <div style={{ padding: '8px 0' }}>
            {hasNativeInstall() ? (
              <button
                type="button"
                onClick={install}
                style={{
                  width: '100%',
                  background: 'rgba(83, 212, 107, 0.85)',
                  border: 'none',
                  color: '#06210C',
                  borderRadius: '14px',
                  padding: '14px',
                  fontSize: '15px',
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                {t('install.androidButton')}
              </button>
            ) : (
              <div style={{ fontSize: '14px', color: theme.palette.text, lineHeight: 1.5 }}>
                {t('install.androidMenuHint')}
              </div>
            )}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
          <button
            type="button"
            onClick={snooze}
            style={{
              background: 'transparent',
              border: 'none',
              color: theme.palette.textMuted,
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              padding: '8px',
            }}
          >
            {t('install.later')}
          </button>
          <button
            type="button"
            onClick={never}
            style={{
              background: 'transparent',
              border: 'none',
              color: theme.palette.textMuted,
              fontSize: '13px',
              cursor: 'pointer',
              padding: '8px',
            }}
          >
            {t('install.never')}
          </button>
        </div>
      </div>

      {/* Стрелка на кнопку «Поделиться» в нижней панели Safari */}
      {ios && !iosWrongBrowser && !iosInApp && !done && (
        <div
          style={{
            position: 'absolute',
            bottom: '6px',
            left: '50%',
            transform: 'translateX(-50%)',
            fontSize: '30px',
            animation: 'installArrowBounce 1s ease-in-out infinite',
          }}
        >
          ⬇️
          <style>
            {`@keyframes installArrowBounce {
              0%, 100% { transform: translateY(0); }
              50% { transform: translateY(7px); }
            }`}
          </style>
        </div>
      )}
    </div>
  );
}
