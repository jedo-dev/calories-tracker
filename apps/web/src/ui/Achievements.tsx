import { useEffect, useState } from 'react';
import { apiClient } from '../api/client';
import badge7DayStreak from '../assets/07_achievements/badge_7day_streak.jpg';
import badgeFirstWorkout from '../assets/07_achievements/badge_first_workout.jpg';
import badgeCalorieMaster from '../assets/07_achievements/badge_calorie_master.jpg';
import badgeHydrationHero from '../assets/07_achievements/badge_hydration_hero.jpg';
import badgeSocialButterfly from '../assets/07_achievements/badge_social_butterfly.jpg';
import { t } from '../i18n';
import { useTheme } from '../theme/useTheme';
import { Card } from './Card';
import { Text } from './Text';

const BADGE_IMAGES: Record<string, string> = {
  badge_7day_streak: badge7DayStreak,
  badge_first_workout: badgeFirstWorkout,
  badge_calorie_master: badgeCalorieMaster,
  badge_hydration_hero: badgeHydrationHero,
  badge_social_butterfly: badgeSocialButterfly,
};

interface Achievement {
  key: string;
  imageKey: string;
  unlocked: boolean;
  unlockedAt: string | null;
}

function getAchievementName(key: string): string {
  return t(`achievements.${key}_name`) || key;
}

function getAchievementDesc(key: string): string {
  return t(`achievements.${key}_desc`) || '';
}

export function Achievements() {
  const theme = useTheme();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await apiClient.get('/achievements');
        setAchievements(res.data);
      } catch (err) {
        console.error('Failed to load achievements', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading || achievements.length === 0) return null;

  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  return (
    <Card style={{ marginBottom: theme.spacing.md }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.sm }}>
        <Text variant="h2">{t('achievements.title')}</Text>
        <Text variant="small" muted>{unlockedCount}/{achievements.length}</Text>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: theme.spacing.sm }}>
        {achievements.map((a) => {
          const imgSrc = BADGE_IMAGES[a.imageKey];
          const name = getAchievementName(a.key);
          const desc = getAchievementDesc(a.key);
          return (
            <div
              key={a.key}
              style={{
                textAlign: 'center',
                opacity: a.unlocked ? 1 : 0.7,
                filter: a.unlocked ? 'none' : 'grayscale(80%)',
              }}
              title={a.unlocked ? `${name} — ${desc}` : `${name} — ${t('achievements.locked')}`}
            >
              <img
                src={imgSrc || badge7DayStreak}
                alt={name}
                style={{
                  width: '48px',
                  height: '48px',
                  objectFit: 'contain',
                  borderRadius: theme.radius.sm,
                }}
                loading="lazy"
              />
              <Text variant="small" muted style={{ fontSize: '10px', display: 'block', marginTop: '2px', lineHeight: '1.2' }}>
                {name}
              </Text>
              {a.unlocked && (
                <Text variant="small" style={{ fontSize: '9px', color: theme.palette.success }}>✓</Text>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}
