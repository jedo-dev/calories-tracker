import { useState } from 'react';
import { t } from '../../i18n';
import { useTheme } from '../../theme/useTheme';
import { Text } from '../../ui/Text';
import { Icon } from '../../ui/Icon';
import { workoutCardStyle } from '../../pages/workoutShared';
import type { ProgramDetail } from './types';

export function ProgramHero({ program }: { program: ProgramDetail }) {
  const theme = useTheme();
  const [imgFailed, setImgFailed] = useState(false);
  const minutes = Math.max(1, Math.round(program.estimatedDurationSec / 60));

  return (
    <div style={{ ...workoutCardStyle, padding: 0, overflow: 'hidden', marginBottom: '12px' }}>
      <div style={{ position: 'relative', width: '100%', height: '160px', background: 'rgba(3, 18, 28, 0.6)' }}>
        {program.imageUrl && !imgFailed ? (
          <img
            src={program.imageUrl}
            alt={program.name}
            onError={() => setImgFailed(true)}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="workout" size={64} />
          </div>
        )}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(180deg, transparent 30%, rgba(7, 17, 29, 0.9) 100%)',
          }}
        />
        <Text
          variant="h2"
          bold
          style={{ position: 'absolute', bottom: '10px', left: '14px', right: '14px', fontSize: '20px' }}
        >
          {program.name}
        </Text>
      </div>
      <div style={{ padding: '12px 14px 14px' }}>
        {program.description && (
          <Text variant="small" muted style={{ display: 'block', lineHeight: 1.5, marginBottom: '10px' }}>
            {program.description}
          </Text>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
          <div>
            <span style={{ fontSize: '20px', fontWeight: 800, color: theme.palette.text, display: 'block' }}>
              {program.exerciseCount}
            </span>
            <Text variant="small" muted style={{ fontSize: '11px' }}>{t('workout.exerciseCount')}</Text>
          </div>
          <div>
            <span style={{ fontSize: '20px', fontWeight: 800, color: theme.palette.text, display: 'block' }}>
              ~{minutes} {t('workout.min')}
            </span>
            <Text variant="small" muted style={{ fontSize: '11px' }}>{t('workout.totalDuration')}</Text>
          </div>
          <div>
            <span style={{ fontSize: '20px', fontWeight: 800, color: theme.palette.primary, display: 'block' }}>
              ~{program.estimatedKcal}
            </span>
            <Text variant="small" muted style={{ fontSize: '11px' }}>{t('workout.kcal')}</Text>
          </div>
        </div>
      </div>
    </div>
  );
}
