import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../../api/client';
import { t } from '../../i18n';
import { useTheme } from '../../theme/useTheme';
import { track } from '../../utils/analytics';
import { getErrorLog } from '../../utils/errorLog';
import { TOUR_SCENARIOS, getCompletedScenarios, startTour } from '../../tour/tour';
import mascotTour from '../../assets/08_mascot/mascot_tour_sm.png';

// Плавающая кнопка помощи: по нажатию — меню с чеклистом обучающих туров
// и пунктом «Сообщить о проблеме» (textarea; вместе с текстом на почту
// уходит буфер последних ошибок из utils/errorLog — диагностика без Sentry).
export function FeedbackButton() {
  const theme = useTheme();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<'menu' | 'form'>('menu');
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState(false);

  const close = () => {
    setOpen(false);
    setView('menu');
    setDone(false);
    setError(false);
  };

  const handleStartTour = (id: string) => {
    close();
    // Уводим на стартовую страницу сценария до включения подсветки
    const scenario = TOUR_SCENARIOS.find((s) => s.id === id);
    navigate(scenario?.startPath || '/today');
    startTour(id);
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
        data-tour="help-button"
        aria-label={t('feedback.menuTitle')}
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
            {view === 'menu' ? (() => {
              const completed = getCompletedScenarios();
              return (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '16px', fontWeight: 800, color: theme.palette.text, marginBottom: '4px' }}>
                        {t('tour.listTitle')}
                      </div>
                      <div style={{ fontSize: '12px', color: theme.palette.textMuted }}>
                        {t('tour.listSubtitle')}
                      </div>
                    </div>
                    <img
                      src={mascotTour}
                      alt=""
                      style={{
                        width: '100px',
                        height: '100px',
                        flexShrink: 0,
                        objectFit: 'contain',
                        // лис чуть выступает за верх карточки — живее, чем строго в сетке
                        marginTop: '-24px',
                        marginBottom: '-8px',
                      }}
                    />
                  </div>

                  {TOUR_SCENARIOS.map((scenario) => {
                    const isDone = completed.includes(scenario.id);
                    return (
                      <button
                        key={scenario.id}
                        type="button"
                        onClick={() => handleStartTour(scenario.id)}
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '12px 14px',
                          marginBottom: '8px',
                          borderRadius: '14px',
                          border: '1px solid rgba(160, 200, 220, 0.22)',
                          background: 'rgba(3, 14, 22, 0.5)',
                          color: theme.palette.text,
                          fontSize: '14px',
                          fontWeight: 600,
                          textAlign: 'left',
                          cursor: 'pointer',
                        }}
                      >
                        <span style={{ fontSize: '16px', flexShrink: 0 }}>{isDone ? '✅' : '⬜'}</span>
                        <span style={{ flex: 1 }}>{t(scenario.titleKey)}</span>
                        <span style={{ color: theme.palette.textMuted, fontSize: '16px' }}>›</span>
                      </button>
                    );
                  })}

                  <button
                    type="button"
                    onClick={() => setView('form')}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '12px 14px',
                      marginTop: '4px',
                      borderRadius: '14px',
                      border: '1px solid rgba(160, 200, 220, 0.22)',
                      background: 'transparent',
                      color: theme.palette.textMuted,
                      fontSize: '14px',
                      fontWeight: 600,
                      textAlign: 'left',
                      cursor: 'pointer',
                    }}
                  >
                    <span style={{ fontSize: '15px', flexShrink: 0 }}>💬</span>
                    <span style={{ flex: 1 }}>{t('feedback.title')}</span>
                    <span style={{ fontSize: '16px' }}>›</span>
                  </button>
                </>
              );
            })() : (
            <>
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
            </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
