import { Link } from 'react-router-dom';
import { useTelegramAuth } from '../hooks/useTelegramAuth';
import { t } from '../i18n';
import { useTheme } from '../theme/useTheme';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Text } from '../ui/Text';

export function HomePage() {
  const { user, loading, error } = useTelegramAuth();
  const theme = useTheme();

  if (loading) {
    return (
      <div style={{ padding: theme.spacing.lg, textAlign: 'center' }}>
        <Text>{t('common.loading')}</Text>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: theme.spacing.lg, textAlign: 'center' }}>
        <Text variant="h2" style={{ color: theme.palette.danger, marginBottom: theme.spacing.md }}>
          {t('common.error')}: {error}
        </Text>
      </div>
    );
  }

  if (user) {
    return (
      <div style={{ padding: theme.spacing.lg, maxWidth: '600px', margin: '0 auto' }}>
        <Card style={{ textAlign: 'center', marginBottom: theme.spacing.lg }}>
          <Text variant="h1" style={{ marginBottom: theme.spacing.md }}>
            {t('home.title')}
          </Text>
          <div style={{ marginBottom: theme.spacing.sm }}>
            <Text>{t('home.userId')}: {user.id}</Text>
          </div>
          <div style={{ marginBottom: theme.spacing.sm }}>
            <Text>{t('home.tgUserId')}: {user.tgUserId}</Text>
          </div>
          {user.username && (
            <div style={{ marginBottom: theme.spacing.md }}>
              <Text>{t('home.username')}: @{user.username}</Text>
            </div>
          )}
        </Card>
        <Link to="/today" style={{ textDecoration: 'none' }}>
          <Button>{t('home.goToToday')}</Button>
        </Link>
      </div>
    );
  }

  return (
    <div style={{ padding: theme.spacing.lg, textAlign: 'center' }}>
      
      <Text>{t('home.notLoggedIn')}</Text>
    </div>
  );
}

