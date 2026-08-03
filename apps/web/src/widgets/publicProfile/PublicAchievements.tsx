import { t } from '../../i18n';
import { useTheme } from '../../theme/useTheme';
import { Text } from '../../ui/Text';
import badge7DayStreak from '../../assets/07_achievements/badge_7day_streak.jpg';
import badgeFirstWorkout from '../../assets/07_achievements/badge_first_workout.jpg';
import badgeCalorieMaster from '../../assets/07_achievements/badge_calorie_master.jpg';
import badgeHydrationHero from '../../assets/07_achievements/badge_hydration_hero.jpg';
import badgeSocialButterfly from '../../assets/07_achievements/badge_social_butterfly.jpg';
import { publicCardStyle, PublicAchievement } from './types';

const BADGE_IMAGES: Record<string, string> = {
  badge_7day_streak: badge7DayStreak,
  badge_first_workout: badgeFirstWorkout,
  badge_calorie_master: badgeCalorieMaster,
  badge_hydration_hero: badgeHydrationHero,
  badge_social_butterfly: badgeSocialButterfly,
};

export function PublicAchievements({ achievements }: { achievements: PublicAchievement[] }) {
  const theme = useTheme();
  const unlocked = achievements.filter((a) => a.unlocked);
  if (unlocked.length === 0) return null;

  return (
    <div style={publicCardStyle}>
      <Text variant="h2" bold style={{ display: 'block', fontSize: '16px', marginBottom: '10px' }}>
        {t('publicProfile.achievements')}
      </Text>
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        {unlocked.map((a) => (
          <div key={a.key} style={{ textAlign: 'center', width: '64px', minWidth: 0 }}>
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                margin: '0 auto',
                border: `2px solid ${theme.palette.primary}`,
                background: 'rgba(255,255,255,0.04)',
                display: 'grid',
                placeItems: 'center',
                padding: '5px',
              }}
            >
              <img
                src={BADGE_IMAGES[a.imageKey] || badge7DayStreak}
                alt={t(`achievements.${a.key}_name`) || a.key}
                loading="lazy"
                style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '50%' }}
              />
            </div>
            <Text variant="small" muted style={{ display: 'block', marginTop: '4px', fontSize: '10px', lineHeight: 1.15 }}>
              {t(`achievements.${a.key}_name`) || a.key}
            </Text>
          </div>
        ))}
      </div>
    </div>
  );
}
