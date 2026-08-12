import { useEffect, useState } from 'react';
import { pageBackground } from '../theme/styles';
import { useNavigate, useParams } from 'react-router-dom';
import { apiClient } from '../api/client';
import { t } from '../i18n';
import { useTheme } from '../theme/useTheme';
import { EmptyState } from '../ui/EmptyState';
import Loader from '../ui/Loader';
import { Text } from '../ui/Text';
import { PageHeader } from '../ui/PageHeader';
import { PublicProfileHeader } from '../widgets/publicProfile/PublicProfileHeader';
import { PublicProfileStats } from '../widgets/publicProfile/PublicProfileStats';
import { VersusCard } from '../widgets/publicProfile/VersusCard';
import { PublicAchievements } from '../widgets/publicProfile/PublicAchievements';
import { PublicRecipesCard } from '../widgets/publicProfile/PublicRecipesCard';
import { PublicActivityCard } from '../widgets/publicProfile/PublicActivityCard';
import type { MyStats, PublicAchievement, PublicProfile } from '../widgets/publicProfile/types';

export function PublicProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const theme = useTheme();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [achievements, setAchievements] = useState<PublicAchievement[]>([]);
  const [userRecipes, setUserRecipes] = useState<any[]>([]);
  const [myStats, setMyStats] = useState<MyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [followBusy, setFollowBusy] = useState(false);
  const [followError, setFollowError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    Promise.all([
      apiClient.get(`/users/${userId}/public`),
      apiClient.get(`/achievements/${userId}/public`).catch(() => ({ data: [] })),
      apiClient.get(`/users/${userId}/recipes`, { params: { limit: 10 } }).catch(() => ({ data: [] })),
      apiClient.get('/social/me').catch(() => null),
    ])
      .then(([profileRes, achievementsRes, recipesRes, meRes]) => {
        setProfile(profileRes.data);
        setAchievements(achievementsRes.data);
        setUserRecipes(recipesRes.data);
        if (meRes?.data?.stats) setMyStats(meRes.data.stats);
      })
      .catch((err: any) => {
        setError(err.response?.data?.message || err.message || t('common.error'));
      })
      .finally(() => setLoading(false));
  }, [userId]);

  const handleFollow = async () => {
    if (!profile) return;
    setFollowBusy(true);
    setFollowError(null);
    try {
      await apiClient.post(`/friends/follow/${profile.id}`);
      setProfile({ ...profile, isFollowing: true });
    } catch (err: any) {
      setFollowError(err.response?.data?.message || t('common.error'));
    } finally {
      setFollowBusy(false);
    }
  };

  const handleUnfollow = async () => {
    if (!profile) return;
    setFollowBusy(true);
    setFollowError(null);
    try {
      await apiClient.delete(`/friends/follow/${profile.id}`);
      setProfile({ ...profile, isFollowing: false });
    } catch (err: any) {
      setFollowError(err.response?.data?.message || t('common.error'));
    } finally {
      setFollowBusy(false);
    }
  };

  if (loading) return <Loader />;

  if (error || !profile) {
    return (
      <div style={{ padding: '12px', maxWidth: '520px', margin: '0 auto' }}>
        <EmptyState title={t('publicProfile.notFound')} description={t('publicProfile.notFoundDesc')} />
      </div>
    );
  }

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
      <PageHeader title={t('publicProfile.title')} onBack={() => navigate(-1)} />

      <PublicProfileHeader
        profile={profile}
        followBusy={followBusy}
        onFollow={handleFollow}
        onUnfollow={handleUnfollow}
        onOpenMyProfile={() => navigate('/profile')}
      />

      {followError && (
        <Text variant="small" style={{ display: 'block', color: '#ff8a8a', marginBottom: '10px' }}>
          {followError}
        </Text>
      )}

      <PublicProfileStats profile={profile} />

      {!profile.isSelf && myStats && <VersusCard profile={profile} myStats={myStats} />}

      <PublicAchievements achievements={achievements} />

      <PublicRecipesCard recipes={userRecipes} onOpen={(id) => navigate(`/recipes/${id}`)} />

      <PublicActivityCard events={profile.recentEvents} />
    </div>
  );
}
