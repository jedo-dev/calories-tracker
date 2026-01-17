import { useEffect, useState } from 'react';
import { apiClient } from '../api/client';
import { useTelegramAuth } from '../hooks/useTelegramAuth';
import { t } from '../i18n';
import { useTheme } from '../theme/useTheme';
import { Card } from '../ui/Card';
import { Text } from '../ui/Text';

interface FeedItem {
  id: string;
  type: 'log_day' | 'streak_milestone' | 'xp_gain' | 'follow';
  date: string;
  user: {
    id: string;
    displayName: string;
    avatarEmoji: string;
  };
  payload: Record<string, any>;
  createdAt: string;
}

function formatFeedText(item: FeedItem): string {
  const { user, type, payload } = item;
  const name = user.displayName;

  switch (type) {
    case 'log_day':
      return `${user.avatarEmoji} ${name} залогировал день (+${payload.xp || 10} XP)`;
    case 'xp_gain':
      return `${user.avatarEmoji} ${name} набрал ${payload.xp || 2} XP`;
    case 'streak_milestone':
      return `${user.avatarEmoji} ${name} набрал серию ${payload.streak || 0} дней 🔥`;
    case 'follow':
      return `${user.avatarEmoji} ${name} подписался на пользователя`;
    default:
      return `${user.avatarEmoji} ${name} выполнил действие`;
  }
}

export function FeedPage() {
  const { loading: loadingUser, error: errorUser } = useTelegramAuth();
  const theme = useTheme();
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadFeed = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get('/feed', { params: { limit: 50 } });
      setFeed(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFeed();
  }, []);

  if (loadingUser) {
    return (
      <div style={{ padding: theme.spacing.lg, textAlign: 'center' }}>
        <Text>{t('common.loading')}</Text>
      </div>
    );
  }

  if (errorUser) {
    return (
      <div style={{ padding: theme.spacing.lg, textAlign: 'center' }}>
        <Text>{t('common.error')}: {errorUser}</Text>
      </div>
    );
  }

  return (
    <div style={{ padding: theme.spacing.lg, maxWidth: '600px', margin: '0 auto', minHeight: 'calc(100vh - 64px)', backgroundColor: theme.palette.bg }}>

      {loading && (
        <div style={{ textAlign: 'center', padding: theme.spacing.xl }}>
          <Text>{t('common.loading')}</Text>
        </div>
      )}

      {error && (
        <Card style={{ marginBottom: theme.spacing.md, backgroundColor: theme.palette.danger + '20' }}>
          <Text style={{ color: theme.palette.danger }}>{error}</Text>
        </Card>
      )}

      {!loading && (
        <>
          {feed.length === 0 ? (
            <Card style={{ textAlign: 'center', padding: theme.spacing.xl }}>
              <Text muted>Нет событий</Text>
            </Card>
          ) : (
            feed.map((item) => (
              <Card key={item.id} style={{ marginBottom: theme.spacing.sm }}>
                <Text>{formatFeedText(item)}</Text>
                <Text variant="small" muted style={{ marginTop: theme.spacing.xs }}>
                  {item.date}
                </Text>
              </Card>
            ))
          )}
        </>
      )}
    </div>
  );
}
