import { useEffect, useState } from 'react';
import { pageBackground } from '../theme/styles';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../api/client';
import emptyFriends from '../assets/03_empty_states/empty_friends.png';
import { useDebounce } from '../hooks/useDebounce';
import { t } from '../i18n';
import { useTheme } from '../theme/useTheme';
import { EmptyState } from '../ui/EmptyState';
import Loader, { InlineLoader } from '../ui/Loader';
import { Text } from '../ui/Text';
import { FriendsTabs } from '../widgets/friends/FriendsTabs';
import { FriendsSearchBar } from '../widgets/friends/FriendsSearchBar';
import { FriendUserCard } from '../widgets/friends/FriendUserCard';
import type { FriendUser, FriendsTab } from '../widgets/friends/types';

export function FriendsPage() {
  const theme = useTheme();
  const navigate = useNavigate();
  const [tab, setTab] = useState<FriendsTab>('following');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<FriendUser[]>([]);
  const [following, setFollowing] = useState<FriendUser[] | null>(null);
  const [followers, setFollowers] = useState<FriendUser[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [busyUserId, setBusyUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const debouncedSearch = useDebounce(searchQuery, 300);

  // counts for the header pills — loaded once, kept in sync with follow actions
  const loadLists = async () => {
    const [followingRes, followersRes] = await Promise.all([
      apiClient.get('/friends/following').catch(() => null),
      apiClient.get('/friends/followers').catch(() => null),
    ]);
    if (followingRes) setFollowing(followingRes.data);
    if (followersRes) setFollowers(followersRes.data);
  };

  useEffect(() => {
    loadLists();
  }, []);

  useEffect(() => {
    if (debouncedSearch.trim().length >= 2) {
      searchUsers();
    } else {
      setSearchResults([]);
    }
  }, [debouncedSearch]);

  const searchUsers = async () => {
    setLoading(true);
    setError(null);
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
    setBusyUserId(userId);
    setError(null);
    try {
      await apiClient.post(`/friends/follow/${userId}`);
      setSearchResults((prev) => prev.map((u) => (u.id === userId ? { ...u, isFollowing: true } : u)));
      await loadLists();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || t('common.error'));
    } finally {
      setBusyUserId(null);
    }
  };

  const handleUnfollow = async (userId: string) => {
    setBusyUserId(userId);
    setError(null);
    try {
      await apiClient.delete(`/friends/follow/${userId}`);
      setSearchResults((prev) => prev.map((u) => (u.id === userId ? { ...u, isFollowing: false } : u)));
      await loadLists();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || t('common.error'));
    } finally {
      setBusyUserId(null);
    }
  };

  const renderCard = (user: FriendUser, action: 'toggle' | 'unfollow') => (
    <FriendUserCard
      key={user.id}
      user={user}
      action={action}
      busy={busyUserId === user.id}
      onOpen={() => navigate(`/users/${user.id}`)}
      onFollow={() => handleFollow(user.id)}
      onUnfollow={() => handleUnfollow(user.id)}
    />
  );

  const renderList = (
    users: FriendUser[] | null,
    action: 'toggle' | 'unfollow',
    emptyTitle: string,
    emptyDesc?: string,
  ) => {
    if (users === null) return <Loader />;
    if (users.length === 0) {
      return <EmptyState image={emptyFriends} title={emptyTitle} description={emptyDesc} />;
    }
    return users.map((u) => renderCard(u, action));
  };

  const renderSearch = () => {
    if (loading) return <InlineLoader />;
    if (searchQuery.trim().length === 1) return <EmptyState title={t('friends.searchMinChars')} />;
    if (searchResults.length === 0 && debouncedSearch.trim().length >= 2) {
      return <EmptyState title={t('friends.noResults')} description={t('friends.noResultsDesc')} />;
    }
    return searchResults.map((u) => renderCard(u, 'toggle'));
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        maxWidth: '520px',
        margin: '0 auto',
        padding: '12px',
        paddingBottom: '100px',
        background: pageBackground(theme.palette.bg),
      }}
    >
      <Text variant="h2" bold style={{ display: 'block', fontSize: '20px', marginBottom: '12px' }}>
        {t('friends.title')}
      </Text>

      <FriendsTabs
        tab={tab}
        onChange={setTab}
        followingCount={following?.length ?? null}
        followersCount={followers?.length ?? null}
      />

      {error && (
        <Text variant="small" style={{ display: 'block', color: '#ff8a8a', marginBottom: '10px' }}>
          {error}
        </Text>
      )}

      {tab === 'following' && (
        <>
          <FriendsSearchBar value={searchQuery} onChange={setSearchQuery} />
          {searchQuery.trim().length >= 1
            ? renderSearch()
            : renderList(following, 'unfollow', t('friends.noFollowing'), t('friends.noFollowingDesc'))}
        </>
      )}

      {tab === 'followers' &&
        renderList(followers, 'toggle', t('friends.noFollowers'), t('friends.noFollowersDesc'))}
    </div>
  );
}
