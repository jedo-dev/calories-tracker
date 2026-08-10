import { useState } from 'react';
import { t } from '../../i18n';
import { useTheme } from '../../theme/useTheme';
import { Text } from '../../ui/Text';
import { Icon } from '../../ui/Icon';
import { workoutCardStyle } from '../../pages/workoutShared';
import type { ProgramListItem } from './types';

const LEVEL_COLORS: Record<string, { bg: string; color: string }> = {
  beginner: { bg: 'rgba(83, 212, 107, 0.16)', color: '#6fe08a' },
  intermediate: { bg: 'rgba(255, 196, 87, 0.16)', color: '#ffc457' },
  advanced: { bg: 'rgba(255, 122, 122, 0.16)', color: '#ff8a8a' },
};

export function ProgramCard({ program, onClick }: { program: ProgramListItem; onClick: () => void }) {
  const theme = useTheme();
  const [imgFailed, setImgFailed] = useState(false);
  const level = LEVEL_COLORS[program.level] || LEVEL_COLORS.beginner;
  const minutes = Math.max(1, Math.round(program.estimatedDurationSec / 60));

  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        ...workoutCardStyle,
        padding: 0,
        overflow: 'hidden',
        cursor: 'pointer',
        textAlign: 'left',
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        color: theme.palette.text,
        fontFamily: 'inherit',
      }}
    >
      <div style={{ position: 'relative', width: '100%', height: '96px', background: 'rgba(3, 18, 28, 0.6)' }}>
        {program.imageUrl && !imgFailed ? (
          <img
            src={program.imageUrl}
            alt={program.name}
            onError={() => setImgFailed(true)}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="workout" size={44} />
          </div>
        )}
        <span
          style={{
            position: 'absolute',
            top: '8px',
            left: '8px',
            padding: '4px 8px',
            borderRadius: '10px',
            fontSize: '10px',
            fontWeight: 800,
            background: level.bg,
            color: level.color,
            backdropFilter: 'blur(6px)',
          }}
        >
          {t(`workout.${program.level}`)}
        </span>
      </div>
      <div style={{ padding: '10px 12px 12px' }}>
        <Text bold style={{ display: 'block', fontSize: '14px', lineHeight: 1.25 }}>
          {program.name}
        </Text>
        <Text variant="small" muted style={{ display: 'block', marginTop: '4px', fontSize: '11px' }}>
          {program.exerciseCount} {t('workout.exerciseCount').toLowerCase()} · ~{minutes} {t('workout.min')} · ~{program.estimatedKcal} {t('workout.kcal')}
        </Text>
      </div>
    </button>
  );
}
