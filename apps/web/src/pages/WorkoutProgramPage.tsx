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
import type { ProgramDetail } from '../widgets/workout/types';

export function WorkoutProgramPage() {
  const { programId } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const [program, setProgram] = useState<ProgramDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    apiClient
      .get(`/workouts/programs/${programId}`)
      .then((res) => setProgram(res.data))
      .catch((err) => console.error('Failed to load program', err))
      .finally(() => setLoading(false));
  }, [programId]);

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
        maxWidth: '520px',
        margin: '0 auto',
        minHeight: '100vh',
        paddingBottom: '140px',
        background: workoutPageBackground(theme.palette.bg),
      }}
    >
      <PageHeader title={t('workout.title')} onBack={() => navigate('/workouts')} />

      <ProgramHero program={program} />

      <Text variant="h2" bold style={{ display: 'block', marginBottom: '8px', fontSize: '17px' }}>
        {t('workout.exercises')}
      </Text>
      {program.items.map((item, i) => (
        <ProgramExerciseRow key={`${item.exerciseId}-${i}`} item={item} index={i} />
      ))}

      <StartWorkoutCTA label={t('workout.startWorkout')} busy={starting} onClick={handleStart} />
    </div>
  );
}
