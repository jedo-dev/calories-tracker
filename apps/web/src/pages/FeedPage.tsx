import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../api/client';
import mascotFoxMain from '../assets/08_mascot/mascot_fox_main.png';
import { t } from '../i18n';
import { useTheme } from '../theme/useTheme';
import { EmptyState } from '../ui/EmptyState';
import Loader from '../ui/Loader';
import { Text } from '../ui/Text';
import { FeedEventCard, FeedItem } from '../widgets/feed/FeedEventCard';

export function FeedPage() {
  const theme = useTheme();
  const navigate = useNavigate();
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [myUserId, setMyUserId] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      apiClient.get('/feed', { params: { limit: 50 } }),
      apiClient.get('/social/me').catch(() => null),
    ])
      .then(([feedRes, meRes]) => {
        setFeed(feedRes.data);
        if (meRes?.data?.user?.id) setMyUserId(meRes.data.user.id);
      })
      .catch((err: any) => {
        setError(err.response?.data?.message || err.message || t('common.error'));
      })
      .finally(() => setLoading(false));
  }, []);

  const handleReact = async (eventId: string, emoji: string) => {
    try {
      const res = await apiClient.post(`/feed/${eventId}/react`, { emoji });
      setFeed((prev) =>
        prev.map((item) => (item.id === eventId ? { ...item, reactions: res.data.reactions } : item)),
      );
    } catch (err: any) {
      console.error('Failed to react', err);
      setError(err.response?.data?.message || t('common.error'));
      setTimeout(() => setError(null), 3000);
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
        background: `
          radial-gradient(circle at top, rgba(83, 212, 107, 0.18), transparent 34%),
          radial-gradient(circle at 20% 25%, rgba(60, 140, 255, 0.12), transparent 24%),
          linear-gradient(180deg, #07111d 0%, ${theme.palette.bg} 28%, #081523 100%)
        `,
      }}
    >
      <Text variant="h2" bold style={{ display: 'block', fontSize: '20px', marginBottom: '12px' }}>
        {t('feed.title')}
      </Text>

      {error && (
        <Text variant="small" style={{ display: 'block', color: '#ff8a8a', marginBottom: '10px' }}>
          {error}
        </Text>
      )}

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
        feed.map((item) => (
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
        ))
      )}
    </div>
  );
}
