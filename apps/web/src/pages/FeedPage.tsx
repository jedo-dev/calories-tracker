import { useEffect, useState } from 'react';
import { pageBackground } from '../theme/styles';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../api/client';
import mascotFoxMain from '../assets/08_mascot/mascot_fox_main.png';
import { usePaginatedList } from '../hooks/usePaginatedList';
import { t } from '../i18n';
import { useTheme } from '../theme/useTheme';
import { EmptyState } from '../ui/EmptyState';
import Loader, { InlineLoader } from '../ui/Loader';
import { showToast } from '../ui/Toast';
import { ClubHeader } from '../widgets/club/ClubHeader';
import { FeedEventCard, FeedItem } from '../widgets/feed/FeedEventCard';

export function FeedPage() {
  const theme = useTheme();
  const navigate = useNavigate();
  const [myUserId, setMyUserId] = useState<string | null>(null);

  // Бесконечная лента: раньше — жёсткие 50 событий, дальше лента обрывалась.
  const { items: feed, loading, loadingMore, hasMore, sentinelRef, mutate } = usePaginatedList<FeedItem>(
    (offset, limit) =>
      apiClient.get('/feed', { params: { offset, limit } }).then((res) => res.data),
    [],
    20,
  );

  useEffect(() => {
    apiClient
      .get('/social/me')
      .then((res) => {
        if (res?.data?.user?.id) setMyUserId(res.data.user.id);
      })
      .catch(() => null);
  }, []);

  const handleReact = async (eventId: string, emoji: string) => {
    try {
      const res = await apiClient.post(`/feed/${eventId}/react`, { emoji });
      mutate((prev) =>
        prev.map((item) => (item.id === eventId ? { ...item, reactions: res.data.reactions } : item)),
      );
    } catch (err: any) {
      console.error('Failed to react', err);
      showToast(err.response?.data?.message || t('common.error'));
    }
  };

  if (loading) return <Loader />;

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
      <ClubHeader />

      {feed.length === 0 ? (
        <EmptyState
          image={mascotFoxMain}
          title={t('feed.noEvents')}
          description={t('feed.noEventsDesc')}
          action={
            <button
              type="button"
              onClick={() => navigate('/friends')}
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
              {t('feed.findFriends')}
            </button>
          }
        />
      ) : (
        <>
          {feed.map((item) => (
            <FeedEventCard
              key={item.id}
              item={item}
              myUserId={myUserId}
              onOpenUser={() => navigate(`/users/${item.user.id}`)}
              onReact={(emoji) => handleReact(item.id, emoji)}
              onOpenRecipe={(recipeId) => navigate(`/recipes/${recipeId}`)}
              onAddRecipeToDiary={(payload) =>
                navigate(
                  `/entry/new?recipeId=${payload.recipeId}&recipeName=${encodeURIComponent(payload.recipeName || '')}&kcal=${payload.kcalPer100g || 0}`,
                )
              }
            />
          ))}
          {loadingMore && <InlineLoader />}
          {hasMore && <div ref={sentinelRef} style={{ height: 1 }} />}
        </>
      )}
    </div>
  );
}
