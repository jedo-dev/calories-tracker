import { useState } from 'react';
import { t } from '../../i18n';
import { useTheme } from '../../theme/useTheme';
import { Text } from '../../ui/Text';
import { workoutCardStyle } from '../../pages/workoutShared';
import { Thumb } from './Thumb';
import type { ProgramItem } from './types';

export function ProgramExerciseRow({ item, index }: { item: ProgramItem; index: number }) {
  const theme = useTheme();
  const [expanded, setExpanded] = useState(false);
  const ex = item.exercise;

  const volumeLabel = item.durationSec
    ? `${item.sets} × ${item.durationSec}${t('workout.sec')}`
    : `${item.sets} × ${item.reps ?? '—'}`;

  return (
    <div style={{ ...workoutCardStyle, marginBottom: '10px', padding: '12px' }}>
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          width: '100%',
          background: 'none',
          border: 'none',
          padding: 0,
          cursor: 'pointer',
          color: theme.palette.text,
          textAlign: 'left',
          fontFamily: 'inherit',
        }}
      >
        <span
          style={{
            width: '20px',
            fontSize: '12px',
            fontWeight: 800,
            color: theme.palette.textMuted,
            flexShrink: 0,
            textAlign: 'center',
          }}
        >
          {index + 1}
        </span>
        <Thumb src={ex.gifUrl} alt={ex.name} size={52} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <Text bold style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {ex.name}
          </Text>
          <Text variant="small" muted style={{ display: 'block', marginTop: '2px' }}>
            {volumeLabel} · {t('workout.rest').toLowerCase()} {item.restSec}{t('workout.sec')}
          </Text>
        </div>
        <span
          style={{
            color: theme.palette.textMuted,
            fontSize: '12px',
            transform: expanded ? 'rotate(90deg)' : 'none',
            transition: 'transform 0.2s',
          }}
        >
          ▸
        </span>
      </button>

      {expanded && (
        <div style={{ marginTop: '12px' }}>
          {ex.gifUrl && (
            <img
              src={ex.gifUrl}
              alt={ex.name}
              style={{
                width: '100%',
                maxHeight: '200px',
                objectFit: 'contain',
                borderRadius: '16px',
                display: 'block',
                background: 'rgba(3, 18, 28, 0.5)',
              }}
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          )}
          <Text variant="small" muted style={{ display: 'block', marginTop: '10px', lineHeight: 1.5 }}>
            {ex.description || t('workout.noTechnique')}
          </Text>
          {(ex.muscleGroups?.length || ex.equipment) && (
            <div style={{ display: 'flex', gap: '6px', marginTop: '8px', flexWrap: 'wrap' }}>
              {(ex.muscleGroups || []).map((m) => (
                <span
                  key={m}
                  style={{
                    fontSize: '10px',
                    padding: '3px 8px',
                    borderRadius: '10px',
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: theme.palette.textMuted,
                    fontWeight: 600,
                  }}
                >
                  {m}
                </span>
              ))}
              {ex.equipment && (
                <span
                  style={{
                    fontSize: '10px',
                    padding: '3px 8px',
                    borderRadius: '10px',
                    background: 'rgba(96,165,250,0.16)',
                    color: '#7cb8ff',
                    fontWeight: 700,
                  }}
                >
                  {ex.equipment}
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
