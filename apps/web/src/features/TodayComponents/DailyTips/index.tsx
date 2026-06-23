import { useMemo } from 'react';
import { t } from '../../../i18n';
import { useTheme } from '../../../theme/useTheme';
import { Card } from '../../../ui/Card';
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

    const result: Array<{ emoji: string; text: string; color: string }> = [];
    const { consumed, targets, progress } = dashboard;

    const remainingKcal = targets.kcalTarget - consumed.kcal;
    const remainingProtein = targets.proteinTargetG - consumed.protein;

    // Water tip
    if (waterMl >= waterGoal) {
      result.push({
        emoji: '💧',
        text: t('dailyTips.waterDone'),
        color: '#4A9EFF',
      });
    } else if (waterMl >= waterGoal * 0.7) {
      result.push({
        emoji: '💧',
        text: t('dailyTips.waterAlmost', { ml: waterGoal - waterMl }),
        color: '#4A9EFF',
      });
    }

    // Protein tip
    if (progress.proteinPct < 0.5 && remainingProtein > 30) {
      result.push({
        emoji: '🥩',
        text: t('dailyTips.lowProtein', { g: Math.round(remainingProtein) }),
        color: theme.palette.success,
      });
    }

      // Fat tip
      if (progress.fatPct > 0.9) {
        result.push({
          emoji: '🥑',
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
        emoji: '🍽️',
        text: t('dailyTips.caloriesLeft', { kcal: Math.round(remainingKcal), suggestions }),
        color: theme.palette.primary,
      });
    }

    // Almost done tip
    if (progress.kcalPct > 0.85 && progress.kcalPct < 1.1) {
      result.push({
        emoji: '✅',
        text: t('dailyTips.almostDone'),
        color: theme.palette.success,
      });
    }

    // Over limit tip
    if (progress.kcalPct > 1.1) {
      result.push({
        emoji: '⚠️',
        text: t('dailyTips.overLimit', { kcal: Math.round(consumed.kcal - targets.kcalTarget) }),
        color: theme.palette.danger,
      });
    }

    // Default tip if no specific tips
    if (result.length === 0) {
      result.push({
        emoji: '💪',
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
        💡 {t('dailyTips.title')}
      </Text>
      <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.xs }}>
        {tips.map((tip, i) => (
          <div key={i} style={{ display: 'flex', gap: theme.spacing.sm, alignItems: 'flex-start' }}>
            <span style={{ fontSize: '16px', flexShrink: 0 }}>{tip.emoji}</span>
            <Text variant="small" style={{ color: tip.color, lineHeight: '1.4' }}>
              {tip.text}
            </Text>
          </div>
        ))}
      </div>
    </Card>
  );
}
