import { type FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../api/client';
import { t } from '../i18n';
import { useTheme } from '../theme/useTheme';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Text } from '../ui/Text';
import { AuthLayout } from '../widgets/auth/AuthLayout';

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
    <AuthLayout
      title={t('resetPassword.title')}
      // После отправки инструкция «укажите email» противоречила бы «письмо уже в пути»
      subtitle={sent ? undefined : t('resetPassword.desc')}
      footer={
        <div style={{ textAlign: 'center', marginTop: theme.spacing.lg }}>
          <Link
            to="/login"
            style={{ color: theme.palette.textMuted, fontSize: '13px', textDecoration: 'none' }}
          >
            ← {t('resetPassword.toLogin')}
          </Link>
        </div>
      }
    >
      {sent ? (
        <Text
          style={{
            display: 'block',
            fontSize: '14px',
            color: '#7BD98A',
            lineHeight: 1.55,
            textAlign: 'center',
          }}
        >
          {t('resetPassword.sent')}
        </Text>
      ) : (
        <form onSubmit={submit}>
          <div style={{ marginBottom: theme.spacing.lg }}>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('resetPassword.emailPlaceholder')}
              required
              autoComplete="email"
            />
          </div>
          <Button type="submit" disabled={loading} size="lg">
            {t('resetPassword.send')}
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}
