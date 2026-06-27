import mascotFoxCelebrate from '../../assets/08_mascot/mascot_fox_celebrate.jpg';
import mascotFoxTrophy from '../../assets/08_mascot/mascot_fox_trophy.jpg';
import badgeCalorieMaster from '../../assets/07_achievements/badge_calorie_master.jpg';
import badgeFirstWorkout from '../../assets/07_achievements/badge_first_workout.jpg';
import badgeSevenDayStreak from '../../assets/07_achievements/badge_7day_streak.jpg';
import badgeSocialButterfly from '../../assets/07_achievements/badge_social_butterfly.jpg';

export const ACHIEVEMENT_ITEMS = [
  { key: '7day_streak', image: badgeSevenDayStreak },
  { key: 'first_workout', image: badgeFirstWorkout },
  { key: 'calorie_master', image: badgeCalorieMaster },
  { key: 'hydration_hero', image: mascotFoxCelebrate },
  { key: 'social_butterfly', image: badgeSocialButterfly },
  { key: 'marathoner', image: mascotFoxTrophy },
] as const;
