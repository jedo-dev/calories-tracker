import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { t } from '../i18n';
import { useTheme } from '../theme/useTheme';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Text } from '../ui/Text';
import { AuthLayout } from '../widgets/auth/AuthLayout';

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(email, password, username || undefined);
      navigate('/today');
    } catch (err: any) {
      setError(err.response?.data?.message || t('auth.registerFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title={t('auth.registerTitle')}
      subtitle={t('auth.registerSubtitle')}
      footer={
        <div style={{ textAlign: 'center', marginTop: theme.spacing.lg }}>
          <Text muted>
            {t('auth.hasAccount')}{' '}
            <Link
              to="/login"
              style={{
                color: theme.palette.primary,
                textDecoration: 'none',
                fontWeight: '600',
              }}
            >
              {t('auth.login')}
            </Link>
          </Text>
        </div>
      }
    >
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
            label={t('auth.username')}
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder={t('auth.usernamePlaceholder')}
          />
        </div>
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
            placeholder={t('auth.passwordMinLength')}
            minLength={6}
            required
          />
        </div>
        <Button type="submit" disabled={loading} size="lg">
          {loading ? t('auth.registerLoading') : t('auth.register')}
        </Button>
      </form>

      <div style={{ textAlign: 'center', marginTop: theme.spacing.sm }}>
        <Text muted style={{ fontSize: '12px' }}>
          {t('legal.registerConsent')}{' '}
          <Link to="/privacy" style={{ color: theme.palette.primary, textDecoration: 'none' }}>
            {t('legal.privacyLink')}
          </Link>
        </Text>
      </div>
    </AuthLayout>
  );
}
