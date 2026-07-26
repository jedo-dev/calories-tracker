import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { apiClient } from '../api/client';
import rankBronze from '../assets/07_achievements/rank_bronze.jpg';
import rankSilver from '../assets/07_achievements/rank_silver.jpg';
import rankGold from '../assets/07_achievements/rank_gold.jpg';
import rankDiamond from '../assets/07_achievements/rank_diamond.jpg';
import badge7DayStreak from '../assets/07_achievements/badge_7day_streak.jpg';
import badgeFirstWorkout from '../assets/07_achievements/badge_first_workout.jpg';
import badgeCalorieMaster from '../assets/07_achievements/badge_calorie_master.jpg';
import badgeHydrationHero from '../assets/07_achievements/badge_hydration_hero.jpg';
import badgeSocialButterfly from '../assets/07_achievements/badge_social_butterfly.jpg';
import productsImage from '../assets/products.png';
import { t } from '../i18n';
import { useTheme } from '../theme/useTheme';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { EmptyState } from '../ui/EmptyState';
import Loader from '../ui/Loader';
import { SectionIcon } from '../ui/SectionIcon';
import { Text } from '../ui/Text';

const BADGE_IMAGES: Record<string, string> = {
  badge_7day_streak: badge7DayStreak,
  badge_first_workout: badgeFirstWorkout,
  badge_calorie_master: badgeCalorieMaster,
  badge_hydration_hero: badgeHydrationHero,
  badge_social_butterfly: badgeSocialButterfly,
};

const LEAGUE_IMAGES: Record<string, string> = {
  Bronze: rankBronze,
  Silver: rankSilver,
  Gold: rankGold,
  Diamond: rankDiamond,
};

interface PublicProfile {
  id: string;
  username?: string;
  displayName: string;
  avatarEmoji: string;
  isPublicProfile: boolean;
  league: { name: string; color: string };
  xpTotal: number;
  xpWeek: number;
  currentStreak: number;
  bestStreak: number;
  isFollowing: boolean;
  isSelf: boolean;
  recentEvents: Array<{
    id: string;
    type: string;
    date: string;
    payload: Record<string, any>;
    createdAt: string;
  }>;
}

interface Achievement {
  key: string;
  imageKey: string;
  unlocked: boolean;
  unlockedAt: string | null;
}

function getAchievementName(key: string): string {
  return t(`achievements.${key}_name`) || key;
}

function formatEventText(type: string, payload: Record<string, any>): string {
  switch (type) {
    case 'log_day':
      return `${t('feed.logDay')} (+${payload.xp || 10} XP)`;
    case 'xp_gain':
      return `${t('feed.xpGain')} (+${payload.xp || 2} XP)`;
    case 'streak_milestone':
      return `${t('feed.streakMilestone')} ${payload.streak || 0} ${t('feed.days')}`;
    case 'follow':
      return t('feed.followEvent');
    case 'workout_completed':
      return `${t('feed.workoutCompleted')} — ${payload.workoutName || ''}`;
    case 'water_goal':
      return t('feed.waterGoal');
    case 'achievement_earned':
      return `${t('feed.achievementEarned')} — ${getAchievementName(payload.achievementKey)}`;
    default:
      return '';
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

export function PublicProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const theme = useTheme();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [userRecipes, setUserRecipes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [followLoading, setFollowLoading] = useState(false);

  const loadData = async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const [profileRes, achievementsRes, recipesRes] = await Promise.all([
        apiClient.get(`/users/${userId}/public`),
        apiClient.get(`/achievements/${userId}/public`).catch(() => ({ data: [] })),
        apiClient.get(`/users/${userId}/recipes`, { params: { limit: 10 } }).catch(() => ({ data: [] })),
      ]);
      setProfile(profileRes.data);
      setAchievements(achievementsRes.data);
      setUserRecipes(recipesRes.data);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [userId]);

  const handleFollow = async () => {
    if (!profile) return;
    setFollowLoading(true);
    try {
      await apiClient.post(`/friends/follow/${profile.id}`);
      setProfile({ ...profile, isFollowing: true });
    } catch (err: any) {
      alert(err.response?.data?.message || t('common.error'));
    } finally {
      setFollowLoading(false);
    }
  };

  const handleUnfollow = async () => {
    if (!profile) return;
    setFollowLoading(true);
    try {
      await apiClient.delete(`/friends/follow/${profile.id}`);
      setProfile({ ...profile, isFollowing: false });
    } catch (err: any) {
      alert(err.response?.data?.message || t('common.error'));
    } finally {
      setFollowLoading(false);
    }
  };

  if (loading) return <Loader />;

  if (error || !profile) {
    return (
      <div style={{ padding: theme.spacing.lg, maxWidth: '600px', margin: '0 auto' }}>
        <EmptyState
          title={t('publicProfile.notFound')}
          description={t('publicProfile.notFoundDesc')}
        />
      </div>
    );
  }

  const rankImage = LEAGUE_IMAGES[profile.league.name] || rankBronze;
  const unlockedAchievements = achievements.filter((a) => a.unlocked);

  return (
    <div style={{ padding: theme.spacing.lg, maxWidth: '600px', margin: '0 auto', minHeight: '100vh', backgroundColor: theme.palette.bg, paddingBottom: '100px' }}>
      {profile.isSelf && (
        <div style={{ marginBottom: theme.spacing.md }}>
          <Button variant="ghost" onClick={() => navigate('/profile')} style={{ width: 'auto' }}>
            {t('publicProfile.openMyProfile')}
          </Button>
        </div>
      )}

      <Card style={{ marginBottom: theme.spacing.md, backgroundColor: theme.palette.primary + '10' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.md, marginBottom: theme.spacing.md }}>
          <div style={{ fontSize: '48px' }}>{profile.avatarEmoji}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <Text variant="h1" bold style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>{profile.displayName}</Text>
            {profile.username && (
              <Text variant="small" muted style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>@{profile.username}</Text>
            )}
          </div>
          <div style={{
            flexShrink: 0,
            padding: '4px 12px',
            borderRadius: '12px',
            backgroundColor: profile.league.color + '30',
            border: `2px solid ${profile.league.color}`,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}>
            <img src={rankImage} alt={profile.league.name} style={{ width: '20px', height: '20px', objectFit: 'contain' }} />
            <Text variant="small" bold style={{ color: profile.league.color }}>{profile.league.name}</Text>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: theme.spacing.sm, textAlign: 'center' }}>
          <div>
            <Text variant="small" muted>{t('publicProfile.xpWeek')}</Text>
            <Text variant="h2" bold> {profile.xpWeek}</Text>
          </div>
          <div>
            <Text variant="small" muted>{t('publicProfile.xpTotal')}</Text>
            <Text variant="h2" bold> {profile.xpTotal}</Text>
          </div>
          <div>
            <Text variant="small" muted>{t('publicProfile.streak')}</Text>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: theme.spacing.sm }}>
              <SectionIcon src={badge7DayStreak} alt="" size={20} />
              <Text variant="h2" bold>{profile.currentStreak}</Text>
            </div>
          </div>
        </div>

        {!profile.isSelf && (
          <div style={{ marginTop: theme.spacing.md }}>
            <Button
              variant={profile.isFollowing ? 'secondary' : 'primary'}
              onClick={profile.isFollowing ? handleUnfollow : handleFollow}
              disabled={followLoading}
              style={{ width: '100%' }}
            >
              {profile.isFollowing ? t('publicProfile.unfollow') : t('publicProfile.follow')}
            </Button>
          </div>
        )}
      </Card>

      {unlockedAchievements.length > 0 && (
        <Card style={{ marginBottom: theme.spacing.md }}>
          <Text variant="h2" style={{ marginBottom: theme.spacing.sm }}>{t('publicProfile.achievements')}</Text>
          <div style={{ display: 'flex', gap: theme.spacing.sm, flexWrap: 'wrap' }}>
            {unlockedAchievements.map((a) => (
              <div key={a.key} style={{ textAlign: 'center', width: '64px' }}>
                <img
                  src={BADGE_IMAGES[a.imageKey] || badge7DayStreak}
                  alt={getAchievementName(a.key)}
                  style={{ width: '48px', height: '48px', objectFit: 'contain', borderRadius: theme.radius.sm }}
                  loading="lazy"
                />
                <Text variant="small" muted style={{ fontSize: '10px', display: 'block', marginTop: '2px' }}>{getAchievementName(a.key)}</Text>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* User Recipes */}
      <Card style={{ marginBottom: theme.spacing.md }}>
        <Text variant="h2" style={{ marginBottom: theme.spacing.sm }}>{t('recipes.userRecipes')}</Text>
        {userRecipes.length === 0 ? (
          <Text variant="small" muted>{t('recipes.noUserRecipes')}</Text>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.sm }}>
            {userRecipes.map((recipe: any) => (
              <div
                key={recipe._id}
                onClick={() => navigate(`/recipes/${recipe._id}`)}
                style={{
                  display: 'flex',
                  gap: theme.spacing.md,
                  alignItems: 'center',
                  padding: theme.spacing.sm,
                  borderRadius: theme.radius.md,
                  cursor: 'pointer',
                  backgroundColor: theme.palette.bg,
                }}
              >
                {recipe.photoUrl ? (
                  <img
                    src={recipe.photoUrl}
                    alt={recipe.name}
                    style={{ width: '48px', height: '48px', borderRadius: theme.radius.sm, objectFit: 'cover', flexShrink: 0 }}
                  />
                ) : (
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: theme.radius.sm,
                    backgroundColor: theme.palette.surface,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <SectionIcon src={productsImage} alt="" size={24} />
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Text bold style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
                    {recipe.name}
                  </Text>
                  <Text variant="small" muted>
                    {recipe.kcalPer100g?.toFixed(0)} ккал · Б{recipe.proteinPer100g?.toFixed(1)} Ж{recipe.fatPer100g?.toFixed(1)} У{recipe.carbPer100g?.toFixed(1)}
                  </Text>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card>
        <Text variant="h2" style={{ marginBottom: theme.spacing.sm }}>{t('publicProfile.recentActivity')}</Text>
        {profile.recentEvents.length === 0 ? (
          <EmptyState title={t('publicProfile.noActivity')} />
        ) : (
          profile.recentEvents.map((event) => (
            <div key={event.id} style={{ padding: `${theme.spacing.sm} 0`, borderBottom: `1px solid ${theme.palette.border}` }}>
              <Text style={{ display: 'block' }}>{formatEventText(event.type, event.payload)}</Text>
              <Text variant="small" muted>{timeAgo(event.createdAt)}</Text>
            </div>
          ))
        )}
      </Card>
    </div>
  );
}
