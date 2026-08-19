import { type FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../api/client';
import { t } from '../i18n';
import { useTheme } from '../theme/useTheme';
import { glassCardStyle, pageBackground } from '../theme/styles';

// Запрос ссылки сброса пароля. Ответ всегда одинаковый — по нему нельзя
// понять, зарегистрирован ли email.
export function ForgotPasswordPage() {
  const theme = useTheme();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    try {
      await apiClient.post('/auth/forgot-password', { email });
    } catch {
      // Даже при ошибке показываем «отправлено» — не раскрываем базу email-ов
    } finally {
      setSent(true);
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        padding: '16px',
        paddingTop: 'calc(16px + env(safe-area-inset-top, 0px))',
        background: pageBackground(theme.palette.bg),
      }}
    >
      <div style={{ ...glassCardStyle, maxWidth: '380px', width: '100%', padding: '24px 20px' }}>
        <div style={{ fontSize: '20px', fontWeight: 800, color: theme.palette.text, marginBottom: '6px' }}>
          🔑 {t('resetPassword.title')}
        </div>

        {sent ? (
          <div style={{ fontSize: '14px', color: '#7BD98A', lineHeight: 1.55 }}>
            {t('resetPassword.sent')}
          </div>
        ) : (
          <>
            <div style={{ fontSize: '13px', color: theme.palette.textMuted, marginBottom: '14px' }}>
              {t('resetPassword.desc')}
            </div>
            <form onSubmit={submit}>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('resetPassword.emailPlaceholder')}
                required
                autoComplete="email"
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  background: 'rgba(160, 200, 220, 0.1)',
                  border: '1px solid rgba(160, 200, 220, 0.3)',
                  borderRadius: '12px',
                  color: theme.palette.text,
                  padding: '12px 14px',
                  fontSize: '15px',
                  outline: 'none',
                  marginBottom: '12px',
                }}
              />
              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  background: 'rgba(83, 212, 107, 0.85)',
                  border: 'none',
                  color: '#06210C',
                  borderRadius: '14px',
                  padding: '13px',
                  fontSize: '15px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  opacity: loading ? 0.6 : 1,
                }}
              >
                {t('resetPassword.send')}
              </button>
            </form>
          </>
        )}

        <div style={{ textAlign: 'center', marginTop: '16px' }}>
          <Link to="/login" style={{ color: theme.palette.textMuted, fontSize: '13px', textDecoration: 'none' }}>
            ← {t('resetPassword.toLogin')}
          </Link>
        </div>
      </div>
    </div>
  );
}
