import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { apiClient } from '../api/client';
import { t } from '../i18n';
import { useTheme } from '../theme/useTheme';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import Loader from '../ui/Loader';
import { Text } from '../ui/Text';

interface Exercise {
  _id: string;
  name: string;
  gifUrl: string;
  type: string;
  defaultSets: number;
  defaultReps: number;
  defaultDurationSec?: number;
}

interface WorkoutLog {
  _id: string;
  exerciseId: string;
  exerciseName: string;
  gifUrl?: string;
  sets: number;
  reps: number;
  weightKg?: number;
  durationSec: number;
  caloriesBurned: number;
}

interface WorkoutSession {
  _id: string;
  name?: string;
  categoryId?: string;
  totalCaloriesBurned: number;
  totalDurationSec: number;
  exerciseCount: number;
  finishedAt?: string;
}

function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  if (m === 0) return `${s}${t('workout.sec')}`;
  return `${m}${t('workout.min')} ${s > 0 ? s + t('workout.sec') : ''}`;
}

export function ActiveWorkoutPage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const [session, setSession] = useState<WorkoutSession | null>(null);
  const [logs, setLogs] = useState<WorkoutLog[]>([]);
  const [availableExercises, setAvailableExercises] = useState<Exercise[]>([]);
  const [showExercisePicker, setShowExercisePicker] = useState(false);
  const [loading, setLoading] = useState(true);
  const [addingExercise, setAddingExercise] = useState<string | null>(null);

  // Form state for adding exercise
  const [formSets, setFormSets] = useState('');
  const [formReps, setFormReps] = useState('');
  const [formWeight, setFormWeight] = useState('');
  const [formDuration, setFormDuration] = useState('');

  const loadData = async () => {
    try {
      const [sessionRes, logsRes] = await Promise.all([
        apiClient.get(`/workouts/sessions/${sessionId}`),
        apiClient.get(`/workouts/sessions/${sessionId}/logs`),
      ]);
      setSession(sessionRes.data);
      setLogs(logsRes.data);
    } catch (err) {
      console.error('Failed to load session', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [sessionId]);

  const loadExercisesForCategory = async () => {
    if (!session?.categoryId) {
      // If no category, load all exercises
      try {
        const catRes = await apiClient.get('/workouts/categories');
        const allExercises: Exercise[] = [];
        for (const cat of catRes.data) {
          const exRes = await apiClient.get('/workouts/exercises', { params: { categoryId: cat._id } });
          allExercises.push(...exRes.data);
        }
        setAvailableExercises(allExercises);
      } catch (err) {
        console.error('Failed to load exercises', err);
      }
    } else {
      try {
        const res = await apiClient.get('/workouts/exercises', { params: { categoryId: session.categoryId } });
        setAvailableExercises(res.data);
      } catch (err) {
        console.error('Failed to load exercises', err);
      }
    }
    setShowExercisePicker(true);
  };

  const handleSelectExercise = (exercise: Exercise) => {
    setAddingExercise(exercise._id);
    setFormSets(exercise.defaultSets.toString());
    setFormReps(exercise.defaultReps.toString());
    setFormWeight('');
    setFormDuration(exercise.defaultDurationSec?.toString() || '');
    setShowExercisePicker(false);
  };

  const handleAddExercise = async () => {
    if (!addingExercise) return;
    try {
      await apiClient.post(`/workouts/sessions/${sessionId}/exercises`, {
        exerciseId: addingExercise,
        sets: formSets ? parseInt(formSets, 10) : undefined,
        reps: formReps ? parseInt(formReps, 10) : undefined,
        weightKg: formWeight ? parseFloat(formWeight) : undefined,
        durationSec: formDuration ? parseInt(formDuration, 10) : undefined,
      });
      setAddingExercise(null);
      setFormSets('');
      setFormReps('');
      setFormWeight('');
      setFormDuration('');
      await loadData();
    } catch (err) {
      console.error('Failed to add exercise', err);
    }
  };

  const handleRemoveExercise = async (logId: string) => {
    try {
      await apiClient.delete(`/workouts/logs/${logId}`);
      await loadData();
    } catch (err) {
      console.error('Failed to remove exercise', err);
    }
  };

  const handleFinish = async () => {
    if (!confirm(t('workout.confirmFinish'))) return;
    try {
      await apiClient.post(`/workouts/sessions/${sessionId}/finish`);
      navigate('/workouts');
    } catch (err) {
      console.error('Failed to finish workout', err);
    }
  };

  const handleCancel = async () => {
    if (!confirm(t('workout.confirmCancel'))) return;
    try {
      await apiClient.delete(`/workouts/sessions/${sessionId}`);
      navigate('/workouts');
    } catch (err) {
      console.error('Failed to cancel workout', err);
    }
  };

  if (loading) return <Loader />;
  if (!session) return <Text>{t('common.error')}</Text>;

  return (
    <div style={{ padding: theme.spacing.lg, maxWidth: '600px', margin: '0 auto', minHeight: 'calc(100vh - 64px)', paddingBottom: '100px', backgroundColor: theme.palette.bg }}>
      {/* Header with stats */}
      <Card style={{ marginBottom: theme.spacing.lg, backgroundColor: theme.palette.primary + '10' }}>
        <Text variant="h2" style={{ marginBottom: theme.spacing.sm, color: theme.palette.text }}>
          {session.name || t('workout.activeWorkout')}
        </Text>
        <div style={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
          <div>
            <Text variant="h2" bold style={{ color: theme.palette.primary }}>
              {Math.round(session.totalCaloriesBurned)}
            </Text>
            <Text variant="small" muted> {t('workout.totalCalories')}</Text>
          </div>
          <div>
            <Text variant="h2" bold style={{ color: theme.palette.text }}>
              {session.exerciseCount}
            </Text>
            <Text variant="small" muted> {t('workout.exerciseCount')}</Text>
          </div>
          <div>
            <Text variant="h2" bold style={{ color: theme.palette.text }}>
              {formatDuration(session.totalDurationSec)}
            </Text>
            <Text variant="small" muted> {t('workout.totalDuration')}</Text>
          </div>
        </div>
      </Card>

      {/* Exercise list */}
      {logs.length === 0 && !addingExercise && !showExercisePicker ? (
        <Card style={{ textAlign: 'center', padding: theme.spacing.xl, marginBottom: theme.spacing.lg }}>
          <Text muted>{t('workout.noExercises')}</Text>
        </Card>
      ) : (
        logs.map((log) => (
          <Card key={log._id} style={{ marginBottom: theme.spacing.sm }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <Text bold style={{ color: theme.palette.text }}>{log.exerciseName}</Text>
                <div style={{ display: 'flex', gap: theme.spacing.md, marginTop: theme.spacing.xs, flexWrap: 'wrap' }}>
                  <Text variant="small" muted>
                    {log.sets}×{log.reps}
                    {log.weightKg ? ` × ${log.weightKg}кг` : ''}
                  </Text>
                  {log.durationSec > 0 && (
                    <Text variant="small" muted>{formatDuration(log.durationSec)}</Text>
                  )}
                </div>
              </div>
              <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: theme.spacing.sm }}>
                <div>
                  <Text bold style={{ color: theme.palette.primary }}>
                    {Math.round(log.caloriesBurned)} ккал
                  </Text>
                </div>
                <button
                  onClick={() => handleRemoveExercise(log._id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: theme.palette.danger,
                    cursor: 'pointer',
                    fontSize: '18px',
                    padding: '4px',
                  }}
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Show GIF thumbnail */}
            {log.gifUrl && (
              <div style={{ marginTop: theme.spacing.sm }}>
                <img
                  src={log.gifUrl}
                  alt={log.exerciseName}
                  style={{
                    width: '80px',
                    height: '80px',
                    objectFit: 'cover',
                    borderRadius: theme.radius.sm,
                  }}
                  onError={(e) => {
                    const img = e.target as HTMLImageElement;
                    img.style.display = 'none';
                    const placeholder = document.createElement('div');
                    placeholder.style.cssText = `width:80px;height:80px;border-radius:${theme.radius.sm};background:${theme.palette.surface};display:flex;align-items:center;justify-content:center;font-size:32px;`;
                    placeholder.textContent = '💪';
                    img.parentNode?.insertBefore(placeholder, img);
                  }}
                />
              </div>
            )}
          </Card>
        ))
      )}

      {/* Add exercise form */}
      {addingExercise && (
        <Card style={{ marginBottom: theme.spacing.lg, border: `2px solid ${theme.palette.primary}` }}>
          <Text variant="h2" style={{ marginBottom: theme.spacing.md, color: theme.palette.text }}>
            {t('workout.addExercise')}
          </Text>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: theme.spacing.sm }}>
            <Input
              label={t('workout.sets')}
              type="number"
              value={formSets}
              onChange={(e) => setFormSets(e.target.value)}
              min="1"
            />
            <Input
              label={t('workout.reps')}
              type="number"
              value={formReps}
              onChange={(e) => setFormReps(e.target.value)}
              min="1"
            />
            <Input
              label={t('workout.weight')}
              type="number"
              value={formWeight}
              onChange={(e) => setFormWeight(e.target.value)}
              min="0"
              step="0.5"
              placeholder="0"
            />
            <Input
              label={t('workout.duration')}
              type="number"
              value={formDuration}
              onChange={(e) => setFormDuration(e.target.value)}
              min="0"
              placeholder="0"
            />
          </div>
          <div style={{ display: 'flex', gap: theme.spacing.sm, marginTop: theme.spacing.md }}>
            <Button variant="secondary" onClick={() => setAddingExercise(null)} style={{ flex: 1 }}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleAddExercise} style={{ flex: 1 }}>
              {t('common.add')}
            </Button>
          </div>
        </Card>
      )}

      {/* Exercise picker */}
      {showExercisePicker && (
        <Card style={{ marginBottom: theme.spacing.lg, border: `2px solid ${theme.palette.primary}`, maxHeight: '400px', overflowY: 'auto' }}>
          <Text variant="h2" style={{ marginBottom: theme.spacing.md, color: theme.palette.text }}>
            {t('workout.selectCategory')}
          </Text>
          {availableExercises.map((ex) => (
            <div
              key={ex._id}
              onClick={() => handleSelectExercise(ex)}
              style={{
                padding: theme.spacing.sm,
                cursor: 'pointer',
                borderBottom: `1px solid ${theme.palette.border}`,
                display: 'flex',
                alignItems: 'center',
                gap: theme.spacing.md,
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = theme.palette.surface; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
            >
              <img
                src={ex.gifUrl}
                alt={ex.name}
                style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: theme.radius.sm }}
                onError={(e) => {
                  const img = e.target as HTMLImageElement;
                  img.style.display = 'none';
                  const placeholder = document.createElement('div');
                  placeholder.style.cssText = `width:48px;height:48px;border-radius:${theme.radius.sm};background:${theme.palette.surface};display:flex;align-items:center;justify-content:center;font-size:24px;flex-shrink:0;`;
                  placeholder.textContent = '💪';
                  img.parentNode?.insertBefore(placeholder, img);
                }}
              />
              <div>
                <Text bold style={{ color: theme.palette.text }}>{ex.name}</Text>
                <Text variant="small" muted>{ex.defaultSets}×{ex.defaultReps}</Text>
              </div>
            </div>
          ))}
          <Button variant="secondary" onClick={() => setShowExercisePicker(false)} style={{ marginTop: theme.spacing.md }}>
            {t('common.cancel')}
          </Button>
        </Card>
      )}

      {/* Bottom actions */}
      <div style={{ display: 'flex', gap: theme.spacing.sm, marginTop: theme.spacing.lg }}>
        <Button variant="danger" onClick={handleCancel} style={{ flex: 1 }}>
          {t('workout.cancelWorkout')}
        </Button>
        {!showExercisePicker && !addingExercise && (
          <Button variant="secondary" onClick={loadExercisesForCategory} style={{ flex: 1 }}>
            + {t('workout.addExercise')}
          </Button>
        )}
        <Button onClick={handleFinish} style={{ flex: 1 }}>
          {t('workout.finishWorkout')}
        </Button>
      </div>
    </div>
  );
}
