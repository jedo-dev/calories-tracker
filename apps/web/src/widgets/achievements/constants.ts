import mascotFoxCelebrate from '../../assets/08_mascot/mascot_fox_celebrate.jpg';
import mascotFoxTrophy from '../../assets/08_mascot/mascot_fox_trophy.jpg';
import badgeCalorieMaster from '../../assets/07_achievements/badge_calorie_master.jpg';
import badgeFirstWorkout from '../../assets/07_achievements/badge_first_workout.jpg';
import badgeSevenDayStreak from '../../assets/07_achievements/badge_7day_streak.jpg';
import badgeSocialButterfly from '../../assets/07_achievements/badge_social_butterfly.jpg';
import badgeFirstLog from '../../assets/09_onboarding/onboarding_2_tracking.jpg';
import badgeThreeDayStreak from '../../assets/07_achievements/rank_bronze.jpg';

export const ACHIEVEMENT_ITEMS = [
  { key: 'first_log', image: badgeFirstLog },
  { key: '3day_streak', image: badgeThreeDayStreak },
  { key: '7day_streak', image: badgeSevenDayStreak },
  { key: 'first_workout', image: badgeFirstWorkout },
  { key: 'calorie_master', image: badgeCalorieMaster },
  { key: 'hydration_hero', image: mascotFoxCelebrate },
  { key: 'social_butterfly', image: badgeSocialButterfly },
  { key: 'marathoner', image: mascotFoxTrophy },
] as const;
