import { type FormEvent, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { apiClient } from '../api/client';
import { t } from '../i18n';
import { useTheme } from '../theme/useTheme';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Text } from '../ui/Text';
import { AuthLayout } from '../widgets/auth/AuthLayout';

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
    <AuthLayout
      title={t('resetPassword.newTitle')}
      // После успеха «придумайте пароль» противоречило бы «пароль изменён»
      subtitle={done ? undefined : t('resetPassword.newDesc')}
      footer={
        <div style={{ textAlign: 'center', marginTop: theme.spacing.lg }}>
          <Link
            to="/login"
            style={{ color: theme.palette.textMuted, textDecoration: 'none', fontSize: '13px' }}
          >
            ← {t('resetPassword.toLogin')}
          </Link>
        </div>
      }
    >
      {done ? (
        <Text style={{ display: 'block', color: '#7BD98A', lineHeight: 1.55, textAlign: 'center' }}>
          {t('resetPassword.success')}
        </Text>
      ) : (
        <>
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

          <form onSubmit={submit}>
            <div style={{ marginBottom: theme.spacing.lg }}>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('resetPassword.passwordPlaceholder')}
                required
                minLength={6}
                autoComplete="new-password"
              />
            </div>
            <Button type="submit" disabled={loading || password.length < 6} size="lg">
              {t('resetPassword.save')}
            </Button>
          </form>
        </>
      )}
    </AuthLayout>
  );
}
