import { useMemo } from 'react';
import badgeCalorieMaster from '../../../assets/07_achievements/badge_calorie_master.jpg';
import badgeHydrationHero from '../../../assets/07_achievements/badge_hydration_hero.jpg';
import badgeFirstWorkout from '../../../assets/07_achievements/badge_first_workout.jpg';
import nutCalories from '../../../assets/06_nutrition/nut_calories.jpg';
import nutFats from '../../../assets/06_nutrition/nut_fats.jpg';
import nutProtein from '../../../assets/06_nutrition/nut_protein.jpg';
import nutWater from '../../../assets/06_nutrition/nut_water.jpg';
import { t } from '../../../i18n';
import { useTheme } from '../../../theme/useTheme';
import { Card } from '../../../ui/Card';
import { SectionIcon } from '../../../ui/SectionIcon';
import { Text } from '../../../ui/Text';

interface DashboardData {
  consumed: { kcal: number; protein: number; fat: number; carb: number };
  targets: { kcalTarget: number; proteinTargetG: number; fatTargetG: number; carbTargetG: number } | null;
  progress: { kcalPct: number; proteinPct: number; fatPct: number; carbPct: number } | null;
}

interface Props {
  dashboard: DashboardData | null;
  waterMl: number;
  waterGoal: number;
}

export function DailyTips({ dashboard, waterMl, waterGoal }: Props) {
  const theme = useTheme();

  const tips = useMemo(() => {
    if (!dashboard?.targets || !dashboard.progress) return [];

    const result: Array<{ iconSrc: string; text: string; color: string }> = [];
    const { consumed, targets, progress } = dashboard;

    const remainingKcal = targets.kcalTarget - consumed.kcal;
    const remainingProtein = targets.proteinTargetG - consumed.protein;

    // Water tip
    if (waterMl >= waterGoal) {
      result.push({
        iconSrc: badgeHydrationHero,
        text: t('dailyTips.waterDone'),
        color: '#4A9EFF',
      });
    } else if (waterMl >= waterGoal * 0.7) {
      result.push({
        iconSrc: nutWater,
        text: t('dailyTips.waterAlmost', { ml: waterGoal - waterMl }),
        color: '#4A9EFF',
      });
    }

    // Protein tip
    if (progress.proteinPct < 0.5 && remainingProtein > 30) {
      result.push({
        iconSrc: nutProtein,
        text: t('dailyTips.lowProtein', { g: Math.round(remainingProtein) }),
        color: theme.palette.success,
      });
    }

      // Fat tip
      if (progress.fatPct > 0.9) {
        result.push({
          iconSrc: nutFats,
          text: t('dailyTips.highFat'),
          color: '#FFA500',
        });
      }

    // Calories remaining tip
    if (remainingKcal > 200 && remainingKcal < 600) {
      const suggestions = remainingProtein > 20
        ? t('dailyTips.suggestionsProtein')
        : t('dailyTips.suggestionsBalanced');
      result.push({
        iconSrc: nutCalories,
        text: t('dailyTips.caloriesLeft', { kcal: Math.round(remainingKcal), suggestions }),
        color: theme.palette.primary,
      });
    }

    // Almost done tip
    if (progress.kcalPct > 0.85 && progress.kcalPct < 1.1) {
      result.push({
        iconSrc: badgeCalorieMaster,
        text: t('dailyTips.almostDone'),
        color: theme.palette.success,
      });
    }

    // Over limit tip
    if (progress.kcalPct > 1.1) {
      result.push({
        iconSrc: badgeCalorieMaster,
        text: t('dailyTips.overLimit', { kcal: Math.round(consumed.kcal - targets.kcalTarget) }),
        color: theme.palette.danger,
      });
    }

    // Default tip if no specific tips
    if (result.length === 0) {
      result.push({
        iconSrc: badgeFirstWorkout,
        text: t('dailyTips.keepGoing'),
        color: theme.palette.primary,
      });
    }

    return result.slice(0, 3);
  }, [dashboard, waterMl, waterGoal, theme]);

  if (tips.length === 0) return null;

  return (
    <Card style={{ marginBottom: theme.spacing.md, borderLeft: `3px solid ${theme.palette.primary}` }}>
      <Text variant="h2" style={{ marginBottom: theme.spacing.sm }}>
        {t('dailyTips.title')}
      </Text>
      <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.xs }}>
        {tips.map((tip, i) => (
          <div key={i} style={{ display: 'flex', gap: theme.spacing.sm, alignItems: 'flex-start' }}>
            <SectionIcon src={tip.iconSrc} alt="" size={20} />
            <Text variant="small" style={{ color: tip.color, lineHeight: '1.4' }}>
              {tip.text}
            </Text>
          </div>
        ))}
      </div>
    </Card>
  );
}
