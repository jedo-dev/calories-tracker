import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../api/client';
import emptyFriends from '../assets/03_empty_states/empty_friends.png';
import { useDebounce } from '../hooks/useDebounce';
import { t } from '../i18n';
import { useTheme } from '../theme/useTheme';
import { EmptyState } from '../ui/EmptyState';
import Loader from '../ui/Loader';
import { Text } from '../ui/Text';
import { FriendsTabs } from '../widgets/friends/FriendsTabs';
import { FriendsSearchBar } from '../widgets/friends/FriendsSearchBar';
import { FriendUserCard } from '../widgets/friends/FriendUserCard';
import type { FriendUser, FriendsTab } from '../widgets/friends/types';

export function FriendsPage() {
  const theme = useTheme();
  const navigate = useNavigate();
  const [tab, setTab] = useState<FriendsTab>('search');
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
    showCta?: boolean,
  ) => {
    if (users === null) return <Loader />;
    if (users.length === 0) {
      return (
        <EmptyState
          image={emptyFriends}
          title={emptyTitle}
          description={emptyDesc}
          action={
            showCta ? (
              <button
                type="button"
                onClick={() => setTab('search')}
                style={{
                  height: '46px',
                  padding: '0 20px',
                  borderRadius: '16px',
                  border: 'none',
                  background: 'linear-gradient(180deg, rgba(83, 212, 107, 1), rgba(60, 170, 82, 1))',
                  color: '#07210f',
                  fontSize: '14px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 14px 26px rgba(83, 212, 107, 0.22)',
                  fontFamily: 'inherit',
                }}
              >
                {t('friends.findUsers')}
              </button>
            ) : undefined
          }
        />
      );
    }
    return users.map((u) => renderCard(u, action));
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        maxWidth: '520px',
        margin: '0 auto',
        padding: '12px',
        paddingBottom: '100px',
        background: `
          radial-gradient(circle at top, rgba(83, 212, 107, 0.18), transparent 34%),
          radial-gradient(circle at 20% 25%, rgba(60, 140, 255, 0.12), transparent 24%),
          linear-gradient(180deg, #07111d 0%, ${theme.palette.bg} 28%, #081523 100%)
        `,
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

      {tab === 'search' && (
        <>
          <FriendsSearchBar value={searchQuery} onChange={setSearchQuery} />
          {loading ? (
            <Loader />
          ) : searchQuery.trim().length === 0 ? (
            <EmptyState image={emptyFriends} title={t('friends.searchHint')} description={t('friends.searchHintDesc')} />
          ) : searchQuery.trim().length === 1 ? (
            <EmptyState title={t('friends.searchMinChars')} />
          ) : searchResults.length === 0 && debouncedSearch.trim().length >= 2 ? (
            <EmptyState title={t('friends.noResults')} description={t('friends.noResultsDesc')} />
          ) : (
            searchResults.map((u) => renderCard(u, 'toggle'))
          )}
        </>
      )}

      {tab === 'following' &&
        renderList(following, 'unfollow', t('friends.noFollowing'), t('friends.noFollowingDesc'), true)}
      {tab === 'followers' &&
        renderList(followers, 'toggle', t('friends.noFollowers'), t('friends.noFollowersDesc'))}
    </div>
  );
}
