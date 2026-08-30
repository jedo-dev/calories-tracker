import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { apiClient } from '../api/client';
import { t } from '../i18n';
import { useTheme } from '../theme/useTheme';
import Loader from '../ui/Loader';
import { PageHeader } from '../ui/PageHeader';
import { Text } from '../ui/Text';
import mascotFoxDumbbell from '../assets/08_mascot/mascot_fox_dumbbell.png';
import { BodyGender, BodyMap } from '../widgets/muscles/BodyMap';
import { MuscleSlug, MUSCLES, normalizeMuscles } from '../widgets/muscles/muscleData';
import {
  workoutCardStyle,
  workoutPageBackground,
  estimateExerciseKcal,
  useUserWeight,
} from './workoutShared';

interface Exercise {
  _id: string;
  name: string;
  description?: string;
  gifUrl: string;
  type: string;
  metValue: number;
  muscleGroups: string[];
  difficulty: string;
  equipment?: string;
  defaultSets: number;
  defaultReps: number;
  defaultDurationSec?: number;
  categoryId?: string;
}

const difficultyColor: Record<string, string> = {
  beginner: '#53D46B',
  intermediate: '#FFCC66',
  advanced: '#FF8A8A',
};

// Мышцы этих слагов видны только сзади — для них показываем вид со спины
const BACK_ONLY: MuscleSlug[] = ['traps', 'upper_back', 'lower_back', 'glutes', 'hamstrings'];

function chip(bg: string, color: string): React.CSSProperties {
  return {
    fontSize: '11px',
    padding: '4px 10px',
    borderRadius: '10px',
    backgroundColor: bg,
    color,
    fontWeight: 700,
  };
}

// Карточка упражнения: анимация, описание, параметры и человечек
// с подсветкой задействованных групп мышц.
export function ExerciseDetailPage() {
  const { exerciseId } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const userWeight = useUserWeight();
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [gender, setGender] = useState<BodyGender>('male');
  const [loading, setLoading] = useState(true);
  const [gifFailed, setGifFailed] = useState(false);

  useEffect(() => {
    Promise.all([
      apiClient.get(`/workouts/exercises/${exerciseId}`),
      apiClient.get('/profile').catch(() => null),
    ])
      .then(([exRes, profileRes]) => {
        setExercise(exRes.data);
        if (profileRes?.data?.profile?.gender === 'female') setGender('female');
      })
      .catch(() => setExercise(null))
      .finally(() => setLoading(false));
  }, [exerciseId]);

  const slugs = useMemo(() => normalizeMuscles(exercise?.muscleGroups), [exercise]);
  const intensity = useMemo(() => {
    const result: Partial<Record<MuscleSlug, number>> = {};
    for (const slug of slugs) result[slug] = 3;
    return result;
  }, [slugs]);

  // Показываем один ракурс — тот, где видно больше задействованных мышц
  const view = useMemo(() => {
    const backCount = slugs.filter((s) => BACK_ONLY.includes(s)).length;
    return backCount > slugs.length / 2 ? ('back' as const) : ('front' as const);
  }, [slugs]);

  if (loading) return <Loader />;

  const getDifficultyLabel = (d: string) => {
    const map: Record<string, string> = {
      beginner: t('workout.beginner'),
      intermediate: t('workout.intermediate'),
      advanced: t('workout.advanced'),
    };
    return map[d] || d;
  };

  return (
    <div
      style={{
        padding: '12px',
        paddingTop: 'calc(12px + env(safe-area-inset-top, 0px))',
        maxWidth: '520px',
        margin: '0 auto',
        minHeight: '100vh',
        paddingBottom: '120px',
        background: workoutPageBackground(theme.palette.bg),
      }}
    >
      <PageHeader title={exercise?.name || t('workout.exercises')} onBack={() => navigate(-1)} />

      {!exercise ? (
        <Text muted>{t('common.loadError')}</Text>
      ) : (
        <>
          <div style={{ ...workoutCardStyle, padding: '14px', marginBottom: '10px' }}>
            {!gifFailed && exercise.gifUrl ? (
              <img
                src={exercise.gifUrl}
                alt={exercise.name}
                onError={() => setGifFailed(true)}
                style={{
                  width: '100%',
                  maxHeight: '220px',
                  objectFit: 'contain',
                  borderRadius: '16px',
                  display: 'block',
                  background: 'rgba(3, 18, 28, 0.5)',
                  marginBottom: '12px',
                }}
              />
            ) : (
              <img
                src={mascotFoxDumbbell}
                alt={exercise.name}
                style={{ width: '110px', height: '110px', objectFit: 'contain', display: 'block', margin: '0 auto 12px' }}
              />
            )}

            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              <span style={chip((difficultyColor[exercise.difficulty] || '#53D46B') + '26', difficultyColor[exercise.difficulty] || '#53D46B')}>
                {getDifficultyLabel(exercise.difficulty)}
              </span>
              <span style={chip('rgba(96,165,250,0.16)', '#7cb8ff')}>
                {exercise.type === 'cardio' ? t('workout.cardio') : t('workout.strength')}
              </span>
              {exercise.equipment && (
                <span style={chip('rgba(255,255,255,0.07)', theme.palette.textMuted)}>{exercise.equipment}</span>
              )}
              <span style={chip(theme.palette.primary + '1f', theme.palette.primary)}>
                ~{estimateExerciseKcal(exercise, userWeight)} {t('workout.kcal')}
              </span>
            </div>

            {exercise.description && (
              <Text variant="small" muted style={{ display: 'block', marginTop: '10px', lineHeight: 1.45 }}>
                {exercise.description}
              </Text>
            )}

            <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
              <InfoPill label={t('workout.sets')} value={String(exercise.defaultSets)} />
              <InfoPill
                label={exercise.defaultDurationSec ? t('workout.duration') : t('workout.reps')}
                value={
                  exercise.defaultDurationSec
                    ? `${exercise.defaultDurationSec} ${t('workout.sec')}`
                    : String(exercise.defaultReps)
                }
              />
              <InfoPill label="MET" value={String(exercise.metValue)} />
            </div>
          </div>

          {/* Человечек с подсветкой задействованных мышц */}
          <div style={{ ...workoutCardStyle, padding: '14px', marginBottom: '12px' }}>
            <Text bold style={{ display: 'block', marginBottom: '10px' }}>
              {t('workout.musclesInvolved')}
            </Text>
            {slugs.length === 0 ? (
              <Text variant="small" muted>{t('workout.musclesUnknown')}</Text>
            ) : (
              <>
                <BodyMap view={view} gender={gender} intensity={intensity} maxWidth={190} />
                <div style={{ display: 'flex', gap: '6px', marginTop: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
                  {slugs.map((slug) => (
                    <span key={slug} style={chip(theme.palette.primary + '1a', theme.palette.primary)}>
                      {MUSCLES[slug].name}
                    </span>
                  ))}
                </div>
              </>
            )}
          </div>

        </>
      )}
    </div>
  );
}

function InfoPill({ label, value }: { label: string; value: string }) {
  const theme = useTheme();
  return (
    <div
      style={{
        padding: '6px 10px',
        borderRadius: '12px',
        background: 'rgba(255,255,255,0.06)',
        border: '1px solid rgba(255,255,255,0.1)',
      }}
    >
      <span style={{ fontSize: '10px', color: theme.palette.textMuted }}>{label} </span>
      <span style={{ fontSize: '12px', fontWeight: 700, color: theme.palette.text }}>{value}</span>
    </div>
  );
}
