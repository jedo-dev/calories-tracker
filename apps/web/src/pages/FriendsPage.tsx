import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../api/client';
import emptyFriends from '../assets/03_empty_states/empty_friends.jpg';
import rankBronze from '../assets/07_achievements/rank_bronze.jpg';
import rankSilver from '../assets/07_achievements/rank_silver.jpg';
import rankGold from '../assets/07_achievements/rank_gold.jpg';
import rankDiamond from '../assets/07_achievements/rank_diamond.jpg';
import { useDebounce } from '../hooks/useDebounce';
import { t } from '../i18n';
import { useTheme } from '../theme/useTheme';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { EmptyState } from '../ui/EmptyState';
import { Input } from '../ui/Input';
import Loader from '../ui/Loader';
import { Text } from '../ui/Text';

const LEAGUE_IMAGES: Record<string, string> = {
  Bronze: rankBronze,
  Silver: rankSilver,
  Gold: rankGold,
  Diamond: rankDiamond,
};

interface User {
  id: string;
  username?: string;
  displayName: string;
  avatarEmoji: string;
  isFollowing?: boolean;
  xpWeek?: number;
  currentStreak?: number;
  league?: { name: string; color: string };
}

export function FriendsPage() {
  const theme = useTheme();
  const navigate = useNavigate();
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

  const renderUserCard = (user: User) => {
    const leagueImg = user.league ? LEAGUE_IMAGES[user.league.name] || rankBronze : null;
    return (
      <Card key={user.id} style={{ marginBottom: theme.spacing.sm, cursor: 'pointer' }} onClick={() => navigate(`/users/${user.id}`)}>
        <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.md }}>
          <div style={{ fontSize: '28px', flexShrink: 0 }}>{user.avatarEmoji}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.xs }}>
              <Text bold style={{ color: theme.palette.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.displayName}</Text>
              {leagueImg && (
                <img src={leagueImg} alt={user.league!.name} style={{ width: '16px', height: '16px', objectFit: 'contain', flexShrink: 0 }} loading="lazy" />
              )}
            </div>
            {user.username && (
              <Text variant="small" muted style={{ fontSize: '12px' }}>@{user.username}</Text>
            )}
            <div style={{ display: 'flex', gap: theme.spacing.sm, marginTop: '2px' }}>
              {user.xpWeek !== undefined && (
                <Text variant="small" muted>{t('friends.xpWeek', { xp: user.xpWeek })}</Text>
              )}
              {user.currentStreak !== undefined && user.currentStreak > 0 && (
                <Text variant="small" muted>{t('friends.streak', { count: user.currentStreak })} 🔥</Text>
              )}
            </div>
          </div>
          {tab === 'search' && (
            <Button
              variant={user.isFollowing ? 'secondary' : 'primary'}
              size="sm"
              onClick={(e) => { e.stopPropagation(); user.isFollowing ? handleUnfollow(user.id) : handleFollow(user.id); }}
              style={{ flexShrink: 0 }}
            >
              {user.isFollowing ? t('friends.unfollow') : t('friends.follow')}
            </Button>
          )}
          {(tab === 'following' || tab === 'followers') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => { e.stopPropagation(); handleUnfollow(user.id); }}
              style={{ flexShrink: 0 }}
            >
              {t('friends.unfollow')}
            </Button>
          )}
        </div>
      </Card>
    );
  };

  const renderUserList = (users: User[], emptyTitle: string, emptyDesc?: string, showCta?: boolean) => {
    if (users.length === 0) {
      return (
        <EmptyState
          image={emptyFriends}
          title={emptyTitle}
          description={emptyDesc}
          action={showCta ? (
            <Button onClick={() => { setTab('search'); setSearchQuery(''); }}>{t('friends.findUsers')}</Button>
          ) : undefined}
        />
      );
    }

    return users.map(renderUserCard);
  };

  return (
    <div style={{ padding: theme.spacing.lg, maxWidth: '600px', margin: '0 auto', minHeight: 'calc(100vh - 64px)', backgroundColor: theme.palette.bg, paddingBottom: '100px' }}>
      <Text variant="h1" style={{ marginBottom: theme.spacing.lg }}>{t('friends.title')}</Text>

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

      {loading && <Loader />}

      {error && (
        <Card style={{ marginBottom: theme.spacing.md, backgroundColor: theme.palette.danger + '20' }}>
          <Text style={{ color: theme.palette.danger }}>{error}</Text>
        </Card>
      )}

      {!loading && (
        <>
          {tab === 'search' && (
            searchQuery.length === 0 ? (
              <EmptyState
                image={emptyFriends}
                title={t('friends.searchHint')}
                description={t('friends.searchHintDesc')}
              />
            ) : searchQuery.length === 1 ? (
              <EmptyState
                title={t('friends.searchMinChars')}
              />
            ) : searchResults.length === 0 && debouncedSearch.trim().length >= 2 ? (
              <EmptyState
                title={t('friends.noResults')}
                description={t('friends.noResultsDesc')}
              />
            ) : (
              searchResults.map(renderUserCard)
            )
          )}
          {tab === 'following' && renderUserList(following, t('friends.noFollowing'), t('friends.noFollowingDesc'), true)}
          {tab === 'followers' && renderUserList(followers, t('friends.noFollowers'), t('friends.noFollowersDesc'))}
        </>
      )}
    </div>
  );
}
