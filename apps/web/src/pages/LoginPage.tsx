import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { t } from '../i18n';
import { useTheme } from '../theme/useTheme';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Text } from '../ui/Text';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.includes('@') || !email.includes('.')) {
      setError('Введите email в формате name@example.com');
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
      navigate('/today');
    } catch (err: any) {
      setError(err.response?.data?.message || t('auth.loginFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100dvh',
        backgroundColor: theme.palette.bg,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
        padding: theme.spacing.xl,
        paddingBottom: `calc(${theme.spacing.xl} + env(safe-area-inset-bottom, 0px))`,
      }}
    >
      <div style={{ maxWidth: '400px', margin: '0 auto', width: '100%' }}>
        <Text variant="h1" style={{ textAlign: 'center', marginBottom: theme.spacing.xl }}>
          {t('auth.loginTitle')}
        </Text>

        {error && (
          <div
            style={{
              backgroundColor: theme.palette.danger,
              color: theme.palette.dangerText,
              padding: theme.spacing.md,
              borderRadius: theme.radius.md,
              marginBottom: theme.spacing.md,
              textAlign: 'center',
            }}
          >
            <Text style={{ color: theme.palette.dangerText }}>{error}</Text>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: theme.spacing.md }}>
            <Input
              label={t('auth.email')}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('auth.emailPlaceholder')}
              required
            />
          </div>
          <div style={{ marginBottom: theme.spacing.lg }}>
            <Input
              label={t('auth.password')}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t('auth.passwordPlaceholder')}
              required
            />
          </div>
          <Button type="submit" disabled={loading} size="lg">
            {loading ? t('auth.loginLoading') : t('auth.login')}
          </Button>
        </form>

        <div style={{ textAlign: 'center', marginTop: theme.spacing.sm }}>
          <Link
            to="/forgot-password"
            style={{ color: theme.palette.textMuted, textDecoration: 'none', fontSize: '13px' }}
          >
            {t('resetPassword.forgotLink')}
          </Link>
        </div>

        <div style={{ textAlign: 'center', marginTop: theme.spacing.lg }}>
          <Text muted>
            {t('auth.noAccount')}{' '}
            <Link
              to="/register"
              style={{
                color: theme.palette.primary,
                textDecoration: 'none',
                fontWeight: '600',
              }}
            >
              {t('auth.register')}
            </Link>
          </Text>
        </div>
      </div>
    </div>
  );
}
