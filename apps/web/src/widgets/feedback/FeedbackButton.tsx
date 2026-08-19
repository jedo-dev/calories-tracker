import { useState } from 'react';
import { apiClient } from '../../api/client';
import { t } from '../../i18n';
import { useTheme } from '../../theme/useTheme';
import { track } from '../../utils/analytics';
import { getErrorLog } from '../../utils/errorLog';

// Плавающая фидбек-кнопка: мелкая полупрозрачная, по нажатию — модалка
// с textarea. Вместе с текстом на почту уходит буфер последних ошибок
// (utils/errorLog) — диагностика без Sentry.
export function FeedbackButton() {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState(false);

  const close = () => {
    setOpen(false);
    setDone(false);
    setError(false);
  };

  const send = async () => {
    if (text.trim().length < 5 || sending) return;
    setSending(true);
    setError(false);
    try {
      await apiClient.post('/feedback', {
        message: text.trim(),
        meta: {
          url: window.location.pathname,
          userAgent: navigator.userAgent,
          errors: getErrorLog(),
        },
      });
      track('feedback_sent');
      setText('');
      setDone(true);
      window.setTimeout(close, 2000);
    } catch {
      setError(true);
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <button
        type="button"
        aria-label={t('feedback.title')}
        onClick={() => {
          setOpen(true);
          track('feedback_opened');
        }}
        style={{
          position: 'fixed',
          right: '10px',
          // Над нижней навигацией, с учётом safe area на iPhone
          bottom: 'calc(96px + env(safe-area-inset-bottom, 0px))',
          zIndex: 900,
          width: '34px',
          height: '34px',
          borderRadius: '50%',
          border: '1px solid rgba(160, 200, 220, 0.25)',
          background: 'rgba(17, 49, 69, 0.45)',
          opacity: 0.55,
          fontSize: '15px',
          display: 'grid',
          placeItems: 'center',
          cursor: 'pointer',
          padding: 0,
        }}
      >
        💬
      </button>

      {open && (
        <div
          onClick={close}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1001,
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
              padding: '18px',
              marginBottom: 'calc(16px + env(safe-area-inset-bottom, 0px))',
            }}
          >
            <div style={{ fontSize: '16px', fontWeight: 800, color: theme.palette.text, marginBottom: '4px' }}>
              {t('feedback.title')}
            </div>
            <div style={{ fontSize: '12px', color: theme.palette.textMuted, marginBottom: '10px' }}>
              {t('feedback.subtitle')}
            </div>

            {done ? (
              <div style={{ fontSize: '15px', color: '#7BD98A', fontWeight: 700, padding: '12px 0' }}>
                {t('feedback.done')}
              </div>
            ) : (
              <>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder={t('feedback.placeholder')}
                  rows={4}
                  maxLength={2000}
                  autoFocus
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    resize: 'none',
                    borderRadius: '14px',
                    border: '1px solid rgba(160, 200, 220, 0.25)',
                    background: 'rgba(3, 14, 22, 0.5)',
                    color: theme.palette.text,
                    padding: '12px',
                    fontSize: '14px',
                    lineHeight: 1.45,
                    outline: 'none',
                    fontFamily: 'inherit',
                  }}
                />
                {error && (
                  <div style={{ fontSize: '13px', color: '#FF8A80', marginTop: '8px' }}>
                    {t('feedback.error')}
                  </div>
                )}
                <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
                  <button
                    type="button"
                    onClick={close}
                    style={{
                      flex: 1,
                      background: 'transparent',
                      border: '1px solid rgba(160, 200, 220, 0.25)',
                      color: theme.palette.textMuted,
                      borderRadius: '14px',
                      padding: '12px',
                      fontSize: '14px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    {t('feedback.cancel')}
                  </button>
                  <button
                    type="button"
                    onClick={send}
                    disabled={sending || text.trim().length < 5}
                    style={{
                      flex: 1,
                      background: 'rgba(83, 212, 107, 0.85)',
                      border: 'none',
                      color: '#06210C',
                      borderRadius: '14px',
                      padding: '12px',
                      fontSize: '14px',
                      fontWeight: 800,
                      cursor: 'pointer',
                      opacity: sending || text.trim().length < 5 ? 0.55 : 1,
                    }}
                  >
                    {sending ? t('feedback.sending') : t('feedback.send')}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
