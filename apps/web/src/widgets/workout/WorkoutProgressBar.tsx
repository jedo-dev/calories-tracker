import { plural, t } from '../../i18n';
import { useTheme } from '../../theme/useTheme';
import { Text } from '../../ui/Text';

interface WorkoutProgressBarProps {
  currentIndex: number;
  totalExercises: number;
  doneSets: number;
  totalSets: number;
}

export function WorkoutProgressBar({ currentIndex, totalExercises, doneSets, totalSets }: WorkoutProgressBarProps) {
  const theme = useTheme();
  const progress = totalSets > 0 ? Math.min(1, doneSets / totalSets) : 0;

  return (
    <div style={{ marginBottom: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
        <Text variant="small" muted>
          {t('workout.exerciseOf')
            .replace('{i}', String(Math.min(currentIndex + 1, totalExercises)))
            .replace('{n}', String(totalExercises))}
        </Text>
        <Text variant="small" muted>
          {doneSets}/{totalSets} {plural(totalSets, 'set')}
        </Text>
      </div>
      <div
        style={{
          height: '6px',
          borderRadius: '3px',
          background: 'rgba(255,255,255,0.08)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${progress * 100}%`,
            borderRadius: '3px',
            background: `linear-gradient(90deg, ${theme.palette.primary}, #3caa52)`,
            transition: 'width 0.3s ease',
          }}
        />
      </div>
    </div>
  );
}
