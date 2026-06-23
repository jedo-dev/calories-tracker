import { useEffect, useState } from 'react';
import { apiClient } from '../api/client';
import emptyFriends from '../assets/03_empty_states/empty_friends.jpg';
import { useDebounce } from '../hooks/useDebounce';
import { t } from '../i18n';
import { useTheme } from '../theme/useTheme';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import Loader from '../ui/Loader';
import { Text } from '../ui/Text';

interface User {
  id: string;
  username?: string;
  displayName: string;
  avatarEmoji: string;
  isFollowing?: boolean;
}

export function FriendsPage() {
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

  if (loading) {
    return (
      <Loader />
    );
  }

  const renderUserList = (users: User[]) => {
    if (users.length === 0) {
      return (
        <Card style={{ textAlign: 'center', padding: theme.spacing.xl }}>
          <img src={emptyFriends} alt="" style={{ width: '120px', height: '120px', objectFit: 'contain', marginBottom: theme.spacing.md, opacity: 0.8 }} />
          <Text muted>{t('friends.noData')}</Text>
        </Card>
      );
    }

    return users.map((user) => (
      <Card key={user.id} style={{ marginBottom: theme.spacing.sm }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.md }}>
          <Text variant="h2" style={{ fontSize: '24px' }}>
            {user.avatarEmoji}
          </Text>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <Text bold style={{ color: theme.palette.text }}>{user.displayName}</Text>
            {user.username && (
              <Text variant="small" muted style={{ fontSize: '12px' }}>@{user.username}</Text>
            )}
          </div>
          {tab === 'search' && (
            <Button
              variant={user.isFollowing ? 'secondary' : 'primary'}
              size="sm"
              onClick={() => user.isFollowing ? handleUnfollow(user.id) : handleFollow(user.id)}
            >
              {user.isFollowing ? t('friends.unfollow') : t('friends.follow')}
            </Button>
          )}
        </div>
      </Card>
    ));
  };

  return (
    <div style={{ padding: theme.spacing.lg, maxWidth: '600px', margin: '0 auto', minHeight: 'calc(100vh - 64px)', backgroundColor: theme.palette.bg }}>


      <div style={{ display: 'flex', gap: theme.spacing.xs, marginBottom: theme.spacing.lg, overflowX: 'auto' }}>
        {[
          { key: 'search', label: t('friends.search') },
          { key: 'following', label: t('friends.following') },
          { key: 'followers', label: t('friends.followers') },
        ].map(item => (
          <Button
            key={item.key}
            variant={tab === item.key ? 'primary' : 'secondary'}
            onClick={() => setTab(item.key as any)}
            style={{ flex: '1 0 0', whiteSpace: 'nowrap', fontSize: '13px', padding: `${theme.spacing.sm} ${theme.spacing.xs}` }}
          >
            {item.label}
          </Button>
        ))}
      </div>

      {tab === 'search' && (
        <div style={{ marginBottom: theme.spacing.lg }}>
          <Input
            type="text"
            label={t('friends.searchUsers')}
            placeholder={t('friends.searchPlaceholder')}
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
