import { type FormEvent, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { apiClient } from '../api/client';
import { t } from '../i18n';
import { useTheme } from '../theme/useTheme';
import { glassCardStyle, pageBackground } from '../theme/styles';

// Страница из письма сброса: /reset-password?token=...
export function ResetPasswordPage() {
  const theme = useTheme();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError(null);
    try {
      await apiClient.post('/auth/reset-password', {
        token: searchParams.get('token') || '',
        password,
      });
      setDone(true);
      window.setTimeout(() => navigate('/login'), 2500);
    } catch (err: any) {
      setError(err.response?.data?.message || t('resetPassword.failed'));
    } finally {
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
        background: pageBackground(theme.palette.bg),
      }}
    >
      <div style={{ ...glassCardStyle, maxWidth: '380px', width: '100%', padding: '24px 20px' }}>
        <div style={{ fontSize: '20px', fontWeight: 800, color: theme.palette.text, marginBottom: '6px' }}>
          🔐 {t('resetPassword.newTitle')}
        </div>

        {done ? (
          <div style={{ fontSize: '14px', color: '#7BD98A', lineHeight: 1.55 }}>
            {t('resetPassword.success')}
          </div>
        ) : (
          <>
            <div style={{ fontSize: '13px', color: theme.palette.textMuted, marginBottom: '14px' }}>
              {t('resetPassword.newDesc')}
            </div>
            <form onSubmit={submit}>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('resetPassword.passwordPlaceholder')}
                required
                minLength={6}
                autoComplete="new-password"
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
              {error && (
                <div style={{ fontSize: '13px', color: '#ff8a8a', marginBottom: '10px' }}>{error}</div>
              )}
              <button
                type="submit"
                disabled={loading || password.length < 6}
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
                  opacity: loading || password.length < 6 ? 0.6 : 1,
                }}
              >
                {t('resetPassword.save')}
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
