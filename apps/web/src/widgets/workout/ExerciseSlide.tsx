import { useState } from 'react';
import { t } from '../../i18n';
import { useTheme } from '../../theme/useTheme';
import { Text } from '../../ui/Text';
import { workoutCardStyle } from '../../pages/workoutShared';
import { PrevPerformanceHint } from './PrevPerformanceHint';
import { SetRow } from './SetRow';
import type { LastPerformance, SessionLog, SetDetail } from './types';

interface ExerciseSlideProps {
  log: SessionLog;
  last?: LastPerformance;
  description?: string;
  onSetChange: (setIndex: number, set: SetDetail) => void;
  onToggleDone: (setIndex: number) => void;
  onAddSet: () => void;
}

export function ExerciseSlide({ log, last, description, onSetChange, onToggleDone, onAddSet }: ExerciseSlideProps) {
  const theme = useTheme();
  const [imgFailed, setImgFailed] = useState(false);
  const [showDescription, setShowDescription] = useState(false);
  // duration-based sets (plank, cardio) have no reps in the plan
  const isDurationBased = log.setsDetail.some((s) => s.durationSec != null) && !log.setsDetail.some((s) => s.reps != null);

  return (
    <div style={{ ...workoutCardStyle, padding: '14px', marginBottom: '12px' }}>
      {log.gifUrl && !imgFailed ? (
        <img
          src={log.gifUrl}
          alt={log.exerciseName}
          onError={() => setImgFailed(true)}
          style={{
            width: '100%',
            height: '190px',
            objectFit: 'contain',
            borderRadius: '16px',
            display: 'block',
            background: 'rgba(3, 18, 28, 0.5)',
            marginBottom: '10px',
          }}
        />
      ) : (
        <div
          style={{
            width: '100%',
            height: '120px',
            borderRadius: '16px',
            background: 'rgba(3, 18, 28, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '46px',
            marginBottom: '10px',
          }}
        >
          💪
        </div>
      )}

      <Text variant="h2" bold style={{ display: 'block', fontSize: '19px', marginBottom: '6px' }}>
        {log.exerciseName}
      </Text>

      <PrevPerformanceHint last={last} />

      {description && (
        <div style={{ marginBottom: '10px' }}>
          <button
            type="button"
            onClick={() => setShowDescription((v) => !v)}
            aria-expanded={showDescription}
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              color: '#7cb8ff',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            {showDescription ? t('workout.hideTechnique') : t('workout.showTechnique')}
          </button>
          {showDescription && (
            <Text variant="small" muted style={{ display: 'block', marginTop: '6px', lineHeight: 1.5 }}>
              {description}
            </Text>
          )}
        </div>
      )}

      {log.setsDetail.map((set, i) => (
        <SetRow
          key={set.setNumber}
          set={set}
          isDurationBased={isDurationBased}
          onChange={(next) => onSetChange(i, next)}
          onToggleDone={() => onToggleDone(i)}
        />
      ))}

      <button
        type="button"
        onClick={onAddSet}
        style={{
          width: '100%',
          height: '38px',
          borderRadius: '13px',
          border: '1px dashed rgba(160, 200, 220, 0.35)',
          background: 'rgba(255,255,255,0.03)',
          color: theme.palette.textMuted,
          fontSize: '13px',
          fontWeight: 700,
          cursor: 'pointer',
          marginTop: '4px',
          fontFamily: 'inherit',
        }}
      >
        + {t('workout.addSet')}
      </button>
    </div>
  );
}
