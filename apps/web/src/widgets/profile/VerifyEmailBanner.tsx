import { useState } from 'react';
import { apiClient } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { t } from '../../i18n';
import { useTheme } from '../../theme/useTheme';

// Мягкий баннер «подтвердите почту»: ничего не блокирует, только напоминает
// и даёт переотправить письмо.
export function VerifyEmailBanner() {
  const theme = useTheme();
  const { user } = useAuth();
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!user || user.emailVerified !== false) return null;

  const resend = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await apiClient.post('/auth/resend-verification');
      setMessage(t('verifyEmail.resent'));
    } catch {
      setMessage(t('verifyEmail.resendFailed'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      style={{
        background: 'rgba(255, 214, 102, 0.1)',
        border: '1px solid rgba(255, 214, 102, 0.35)',
        borderRadius: '16px',
        padding: '12px 14px',
        marginBottom: theme.spacing.md,
      }}
    >
      <div style={{ fontSize: '14px', fontWeight: 700, color: '#FFD666' }}>
        ✉️ {t('verifyEmail.bannerTitle')}
      </div>
      <div style={{ fontSize: '12px', color: theme.palette.textMuted, margin: '4px 0 8px' }}>
        {t('verifyEmail.bannerDesc', { email: user.email || '' })}
      </div>
      {message ? (
        <div style={{ fontSize: '13px', color: '#7BD98A' }}>{message}</div>
      ) : (
        <button
          type="button"
          onClick={resend}
          disabled={busy}
          style={{
            background: 'rgba(255, 214, 102, 0.14)',
            border: '1px solid rgba(255, 214, 102, 0.4)',
            color: '#FFD666',
            borderRadius: '10px',
            padding: '8px 12px',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            opacity: busy ? 0.5 : 1,
          }}
        >
          {t('verifyEmail.resend')}
        </button>
      )}
    </div>
  );
}
