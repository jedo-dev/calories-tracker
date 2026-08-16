import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { apiClient } from '../api/client';
import { t } from '../i18n';
import { useTheme } from '../theme/useTheme';
import { glassCardStyle, pageBackground } from '../theme/styles';

type Status = 'verifying' | 'success' | 'failed';

// Страница из письма активации: /verify-email?token=...
export function VerifyEmailPage() {
  const theme = useTheme();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<Status>('verifying');
  const requested = useRef(false);

  useEffect(() => {
    // StrictMode монтирует эффект дважды — токен одноразовый, второй запрос
    // ушёл бы с уже погашенным токеном и показал ложную ошибку
    if (requested.current) return;
    requested.current = true;
    const token = searchParams.get('token') || '';
    apiClient
      .post('/auth/verify-email', { token })
      .then(() => setStatus('success'))
      .catch(() => setStatus('failed'));
  }, [searchParams]);

  const content: Record<Status, { icon: string; title: string; desc: string }> = {
    verifying: { icon: '⏳', title: t('verifyEmail.pageVerifying'), desc: '' },
    success: { icon: '✅', title: t('verifyEmail.pageSuccess'), desc: t('verifyEmail.pageSuccessDesc') },
    failed: { icon: '😕', title: t('verifyEmail.pageFailed'), desc: t('verifyEmail.pageFailedDesc') },
  };
  const view = content[status];

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        padding: '16px',
        background: pageBackground(theme.palette.bg),
      }}
    >
      <div style={{ ...glassCardStyle, maxWidth: '380px', width: '100%', textAlign: 'center', padding: '28px 20px' }}>
        <div style={{ fontSize: '44px', marginBottom: '10px' }}>{view.icon}</div>
        <div style={{ fontSize: '19px', fontWeight: 800, color: theme.palette.text }}>{view.title}</div>
        {view.desc && (
          <div style={{ fontSize: '14px', color: theme.palette.textMuted, marginTop: '8px' }}>{view.desc}</div>
        )}
        {status !== 'verifying' && (
          <button
            type="button"
            onClick={() => navigate('/today')}
            style={{
              marginTop: '18px',
              background: 'rgba(83, 212, 107, 0.18)',
              border: '1px solid rgba(83, 212, 107, 0.5)',
              color: '#7BD98A',
              borderRadius: '14px',
              padding: '12px 22px',
              fontSize: '15px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            {t('verifyEmail.toApp')}
          </button>
        )}
      </div>
    </div>
  );
}
