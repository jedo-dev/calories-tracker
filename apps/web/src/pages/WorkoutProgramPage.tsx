import { PageHeader } from '../ui/PageHeader';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { apiClient } from '../api/client';
import { t } from '../i18n';
import { useTheme } from '../theme/useTheme';
import Loader from '../ui/Loader';
import { Text } from '../ui/Text';
import { workoutPageBackground, formatDate } from './workoutShared';
import { ProgramHero } from '../widgets/workout/ProgramHero';
import { ProgramExerciseRow } from '../widgets/workout/ProgramExerciseRow';
import { StartWorkoutCTA } from '../widgets/workout/StartWorkoutCTA';
import { ConfirmSheet } from '../ui/ConfirmSheet';
import type { ProgramDetail } from '../widgets/workout/types';

export function WorkoutProgramPage() {
  const { programId } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const [program, setProgram] = useState<ProgramDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [favorite, setFavorite] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    Promise.all([
      apiClient.get(`/workouts/programs/${programId}`),
      apiClient.get('/workouts/programs/favorites').catch(() => ({ data: [] })),
    ])
      .then(([res, favRes]) => {
        setProgram(res.data);
        setFavorite((favRes.data || []).includes(programId));
      })
      .catch((err) => console.error('Failed to load program', err))
      .finally(() => setLoading(false));
  }, [programId]);

  const toggleFavorite = () => {
    setFavorite((prev) => !prev);
    apiClient.post(`/workouts/programs/${programId}/favorite`).catch(() => setFavorite((prev) => !prev));
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await apiClient.delete(`/workouts/programs/${programId}`);
      navigate('/workouts');
    } catch (err) {
      console.error('Failed to delete program', err);
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  const handleStart = async () => {
    if (starting) return;
    setStarting(true);
    try {
      const res = await apiClient.post(`/workouts/programs/${programId}/start`, {
        date: formatDate(new Date()),
      });
      navigate(`/workout/${res.data.session._id}`);
    } catch (err) {
      console.error('Failed to start program', err);
      setStarting(false);
    }
  };

  if (loading) return <Loader />;
  if (!program) return <Text>{t('common.error')}</Text>;

  return (
    <div
      style={{
        padding: '12px',
        paddingTop: 'calc(12px + env(safe-area-inset-top, 0px))',
        maxWidth: '520px',
        margin: '0 auto',
        minHeight: '100vh',
        paddingBottom: '140px',
        background: workoutPageBackground(theme.palette.bg),
      }}
    >
      <PageHeader
        title={t('workout.title')}
        onBack={() => navigate('/workouts')}
        right={
          <button
            type="button"
            onClick={toggleFavorite}
            aria-label={favorite ? t('workout.favoriteRemove') : t('workout.favoriteAdd')}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '6px',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill={favorite ? '#ff7a9a' : 'none'}
              stroke={favorite ? '#ff7a9a' : 'rgba(255,255,255,0.75)'}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21.2l7.8-7.8 1-1a5.5 5.5 0 0 0 0-7.8z" />
            </svg>
          </button>
        }
      />

      <ProgramHero program={program} />

      <Text variant="h2" bold style={{ display: 'block', marginBottom: '8px', fontSize: '17px' }}>
        {t('workout.exercises')}
      </Text>
      {program.items.map((item, i) => (
        <ProgramExerciseRow key={`${item.exerciseId}-${i}`} item={item} index={i} />
      ))}

      {/* Личную программу (в ответе она бывает только своя) можно удалить */}
      {program.userId && (
        <button
          type="button"
          onClick={() => setConfirmDelete(true)}
          style={{
            display: 'block',
            margin: '14px auto 0',
            background: 'none',
            border: 'none',
            color: '#ff8a8a',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            fontFamily: 'inherit',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          {t('workout.deleteProgram')}
        </button>
      )}

      <StartWorkoutCTA label={t('workout.startWorkout')} busy={starting} onClick={handleStart} />

      <ConfirmSheet
        isOpen={confirmDelete}
        title={t('workout.confirmDeleteProgram')}
        confirmLabel={deleting ? t('common.loading') : t('common.delete')}
        danger
        onConfirm={handleDelete}
        onClose={() => setConfirmDelete(false)}
      />
    </div>
  );
}
