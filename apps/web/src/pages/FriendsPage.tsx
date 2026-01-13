import { useEffect, useState } from 'react';
import { apiClient } from '../api/client';
import { useDebounce } from '../hooks/useDebounce';
import { useTelegramAuth } from '../hooks/useTelegramAuth';
import { t } from '../i18n';
import { useTheme } from '../theme/useTheme';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Text } from '../ui/Text';

interface User {
  id: string;
  username?: string;
  displayName: string;
  avatarEmoji: string;
  isFollowing?: boolean;
}

export function FriendsPage() {
  const { loading: loadingUser, error: errorUser } = useTelegramAuth();
  const theme = useTheme();
  const [tab, setTab] = useState<'search' | 'following' | 'followers'>('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [following, setFollowing] = useState<User[]>([]);
  const [followers, setFollowers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debouncedSearch = useDebounce(searchQuery, 300);

  const loadFollowing = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/friends/following');
      setFollowing(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const loadFollowers = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/friends/followers');
      setFollowers(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tab === 'following') {
      loadFollowing();
    } else if (tab === 'followers') {
      loadFollowers();
    }
  }, [tab]);

  useEffect(() => {
    if (debouncedSearch.trim() && debouncedSearch.length >= 2) {
      searchUsers();
    } else {
      setSearchResults([]);
    }
  }, [debouncedSearch]);

  const searchUsers = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/users/search', {
        params: { query: debouncedSearch, limit: 20 },
      });
      setSearchResults(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async (userId: string) => {
    try {
      await apiClient.post(`/friends/follow/${userId}`);
      if (tab === 'search') {
        searchUsers();
      } else if (tab === 'following') {
        loadFollowing();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || t('common.error'));
    }
  };

  const handleUnfollow = async (userId: string) => {
    try {
      await apiClient.delete(`/friends/follow/${userId}`);
      if (tab === 'search') {
        searchUsers();
      } else if (tab === 'following') {
        loadFollowing();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || t('common.error'));
    }
  };

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

  const renderUserList = (users: User[]) => {
    if (users.length === 0) {
      return (
        <Card style={{ textAlign: 'center', padding: theme.spacing.xl }}>
          <Text muted>Нет данных</Text>
        </Card>
      );
    }

    return users.map((user) => (
      <Card key={user.id} style={{ marginBottom: theme.spacing.sm }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.md }}>
          <Text variant="h2" style={{ fontSize: '24px' }}>
            {user.avatarEmoji}
          </Text>
          <div style={{ flex: 1 }}>
            <Text bold>{user.displayName}</Text>
            {user.username && (
              <Text variant="small" muted>@{user.username}</Text>
            )}
          </div>
          {tab === 'search' && (
            <Button
              variant={user.isFollowing ? 'secondary' : 'primary'}
              size="sm"
              onClick={() => user.isFollowing ? handleUnfollow(user.id) : handleFollow(user.id)}
            >
              {user.isFollowing ? 'Отписаться' : 'Подписаться'}
            </Button>
          )}
        </div>
      </Card>
    ));
  };

  return (
    <div style={{ padding: theme.spacing.lg, maxWidth: '600px', margin: '0 auto', minHeight: '100vh', backgroundColor: theme.palette.bg }}>


      <div style={{ display: 'flex', gap: theme.spacing.sm, marginBottom: theme.spacing.lg }}>
        <Button
          variant={tab === 'search' ? 'primary' : 'secondary'}
          onClick={() => setTab('search')}
          style={{ flex: 1 }}
        >
          Поиск
        </Button>
        <Button
          variant={tab === 'following' ? 'primary' : 'secondary'}
          onClick={() => setTab('following')}
          style={{ flex: 1 }}
        >
          Подписки
        </Button>
        <Button
          variant={tab === 'followers' ? 'primary' : 'secondary'}
          onClick={() => setTab('followers')}
          style={{ flex: 1 }}
        >
          Подписчики
        </Button>
      </div>

      {tab === 'search' && (
        <div style={{ marginBottom: theme.spacing.lg }}>
          <Input
            type="text"
            label="Поиск пользователей"
            placeholder="Введите имя или username"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      )}

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
          {tab === 'search' && renderUserList(searchResults)}
          {tab === 'following' && renderUserList(following)}
          {tab === 'followers' && renderUserList(followers)}
        </>
      )}
    </div>
  );
}
