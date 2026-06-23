import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../api/client';
import mascotFoxMain from '../assets/08_mascot/mascot_fox_main.jpg';
import { t } from '../i18n';
import { useTheme } from '../theme/useTheme';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { EmptyState } from '../ui/EmptyState';
import Loader from '../ui/Loader';
import { Text } from '../ui/Text';

interface FeedItem {
  id: string;
  type: 'log_day' | 'streak_milestone' | 'xp_gain' | 'follow' | 'workout_completed' | 'water_goal' | 'achievement_earned' | 'recipe_published';
  date: string;
  user: {
    id: string;
    displayName: string;
    avatarEmoji: string;
  };
  payload: Record<string, any>;
  reactions: Record<string, string[]>;
  createdAt: string;
}

function getEventEmoji(type: string): string {
  switch (type) {
    case 'log_day': return '📝';
    case 'xp_gain': return '⭐';
    case 'streak_milestone': return '🔥';
    case 'follow': return '👥';
    case 'workout_completed': return '💪';
    case 'water_goal': return '💧';
    case 'achievement_earned': return '🏆';
    case 'recipe_published': return '🍽️';
    default: return '📌';
  }
}

function getAchievementName(key: string): string {
  return t(`achievements.${key}_name`) || key;
}

function getEventText(item: FeedItem): string {
  const name = item.user.displayName;
  switch (item.type) {
    case 'log_day':
      return `${name} ${t('feed.logDay')} (+${item.payload.xp || 10} XP)`;
    case 'xp_gain':
      return `${name} ${t('feed.xpGain')} (+${item.payload.xp || 2} XP)`;
    case 'streak_milestone':
      return `${name} ${t('feed.streakMilestone')} ${item.payload.streak || 0} ${t('feed.days')} 🔥`;
    case 'follow':
      return `${name} ${t('feed.followEvent')}`;
    case 'workout_completed':
      return `${name} ${t('feed.workoutCompleted')} — ${item.payload.workoutName || ''}`;
    case 'water_goal':
      return `${name} ${t('feed.waterGoal')}`;
    case 'achievement_earned':
      return `${name} ${t('feed.achievementEarned')} — ${getAchievementName(item.payload.achievementKey)}`;
    case 'recipe_published':
      return `${name} ${t('feed.recipePublished')} «${item.payload.recipeName || ''}»`;
    default:
      return `${name} performed an action`;
  }
}

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = Math.floor((now - then) / 1000);
  if (diff < 60) return t('feed.justNow');
  if (diff < 3600) return t('feed.minutesAgo', { n: Math.floor(diff / 60) });
  if (diff < 86400) return t('feed.hoursAgo', { n: Math.floor(diff / 3600) });
  return t('feed.daysAgo', { n: Math.floor(diff / 86400) });
}

const REACTION_EMOJIS = ['🔥', '💪', '👏'];

export function FeedPage() {
  const theme = useTheme();
  const navigate = useNavigate();
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [myUserId, setMyUserId] = useState<string | null>(null);

  const loadFeed = async () => {
    setLoading(true);
    setError(null);
    try {
      const [feedRes, meRes] = await Promise.all([
        apiClient.get('/feed', { params: { limit: 50 } }),
        apiClient.get('/social/me').catch(() => null),
      ]);
      setFeed(feedRes.data);
      if (meRes?.data?.user?.id) {
        setMyUserId(meRes.data.user.id);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFeed();
  }, []);

  const handleReact = async (eventId: string, emoji: string) => {
    try {
      const res = await apiClient.post(`/feed/${eventId}/react`, { emoji });
      setFeed((prev) =>
        prev.map((item) =>
          item.id === eventId ? { ...item, reactions: res.data.reactions } : item
        )
      );
    } catch (err: any) {
      console.error('Failed to react', err);
      setError(err.response?.data?.message || 'Failed to react');
      setTimeout(() => setError(null), 3000);
    }
  };

  const getReactionCount = (reactions: Record<string, string[]>, emoji: string): number => {
    return (reactions[emoji] || []).length;
  };

  const hasMyReaction = (reactions: Record<string, string[]>, emoji: string): boolean => {
    if (!myUserId) return false;
    return (reactions[emoji] || []).includes(myUserId);
  };

  if (loading) return <Loader />;

  return (
    <div style={{ padding: theme.spacing.lg, maxWidth: '600px', margin: '0 auto', minHeight: 'calc(100vh - 64px)', backgroundColor: theme.palette.bg, paddingBottom: '100px' }}>
      <Text variant="h1" style={{ marginBottom: theme.spacing.lg }}>{t('feed.title')}</Text>

      {error && (
        <Card style={{ marginBottom: theme.spacing.md, backgroundColor: theme.palette.danger + '20' }}>
          <Text style={{ color: theme.palette.danger }}>{error}</Text>
        </Card>
      )}

      {feed.length === 0 ? (
        <EmptyState
          image={mascotFoxMain}
          title={t('feed.noEvents')}
          description={t('feed.noEventsDesc')}
        />
      ) : (
        feed.map((item) => (
          <Card key={item.id} style={{ marginBottom: theme.spacing.sm }}>
            <div style={{ display: 'flex', gap: theme.spacing.md }}>
              <div
                style={{ fontSize: '28px', cursor: 'pointer', flexShrink: 0 }}
                onClick={() => navigate(`/users/${item.user.id}`)}
              >
                {item.user.avatarEmoji}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: theme.spacing.sm }}>
                  <div>
                    <span
                      style={{ cursor: 'pointer' }}
                      onClick={() => navigate(`/users/${item.user.id}`)}
                    >
                      <Text bold>{item.user.displayName}</Text>
                    </span>
                    <Text style={{ display: 'block', marginTop: '2px' }}>
                      {getEventEmoji(item.type)} {getEventText(item)}
                    </Text>
                  </div>
                  <Text variant="small" muted style={{ flexShrink: 0, whiteSpace: 'nowrap' }}>
                    {timeAgo(item.createdAt)}
                  </Text>
                </div>

                <div style={{ display: 'flex', gap: theme.spacing.xs, marginTop: theme.spacing.sm }}>
                  {REACTION_EMOJIS.map((emoji) => {
                    const count = getReactionCount(item.reactions, emoji);
                    const isActive = hasMyReaction(item.reactions, emoji);
                    return (
                      <button
                        key={emoji}
                        onClick={() => handleReact(item.id, emoji)}
                        style={{
                          background: isActive ? theme.palette.primary + '20' : theme.palette.surface,
                          border: `1px solid ${isActive ? theme.palette.primary : theme.palette.border}`,
                          borderRadius: '16px',
                          padding: '2px 8px',
                          cursor: 'pointer',
                          fontSize: '13px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          color: theme.palette.text,
                        }}
                        aria-label={`${emoji} ${count > 0 ? count : ''}`}
                      >
                        <span>{emoji}</span>
                        {count > 0 && <Text variant="small" muted>{count}</Text>}
                      </button>
                    );
                  })}
                </div>

                {/* Recipe published event actions */}
                {item.type === 'recipe_published' && item.payload.recipeId && (
                  <div style={{ display: 'flex', gap: theme.spacing.xs, marginTop: theme.spacing.sm, flexWrap: 'wrap' }}>
                    {item.payload.photoUrl && (
                      <img
                        src={item.payload.photoUrl}
                        alt={item.payload.recipeName}
                        style={{ width: '48px', height: '48px', borderRadius: theme.radius.sm, objectFit: 'cover', marginBottom: theme.spacing.xs }}
                      />
                    )}
                    <div style={{ display: 'flex', gap: theme.spacing.xs, flex: 1 }}>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => navigate(`/recipes/${item.payload.recipeId}`)}
                        style={{ flex: 1 }}
                      >
                        📖 Открыть
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => navigate(`/entry/new?recipeId=${item.payload.recipeId}&recipeName=${encodeURIComponent(item.payload.recipeName || '')}&kcal=${item.payload.kcalPer100g || 0}`)}
                        style={{ flex: 1 }}
                      >
                        📥 В дневник
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>
        ))
      )}
    </div>
  );
}
