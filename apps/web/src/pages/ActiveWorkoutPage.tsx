import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { apiClient } from '../api/client';
import { t } from '../i18n';
import { useTheme } from '../theme/useTheme';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import Loader from '../ui/Loader';
import { Text } from '../ui/Text';
import { IconButton } from '../ui/IconButton';
import { BackIcon } from '../ui/icons';
import {
  workoutCardStyle,
  workoutPageBackground,
  formatDuration,
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
  categoryId?: string;
  muscleGroups?: string[];
  difficulty?: string;
  equipment?: string;
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

function Thumb({ src, alt, size }: { src?: string; alt: string; size: number }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return (
      <div
        style={{
          width: size,
          height: size,
          borderRadius: '12px',
          background: 'rgba(255,255,255,0.06)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: size / 2.5,
          flexShrink: 0,
        }}
      >
        💪
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      onError={() => setFailed(true)}
      style={{ width: size, height: size, objectFit: 'cover', borderRadius: '12px', flexShrink: 0, border: '1px solid rgba(255,255,255,0.08)' }}
    />
  );
}

export function ActiveWorkoutPage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const userWeight = useUserWeight();
  const [session, setSession] = useState<WorkoutSession | null>(null);
  const [logs, setLogs] = useState<WorkoutLog[]>([]);
  const [availableExercises, setAvailableExercises] = useState<Exercise[]>([]);
  const [showExercisePicker, setShowExercisePicker] = useState(false);
  const [pickerSearch, setPickerSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [addingExercise, setAddingExercise] = useState<Exercise | null>(null);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

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
    // full catalog: powers the picker and the expanded technique cards
    apiClient
      .get('/workouts/exercises')
      .then((res) => setAvailableExercises(res.data))
      .catch((err) => console.error('Failed to load exercises', err));
  }, [sessionId]);

  const exerciseById = useMemo(() => {
    const map = new Map<string, Exercise>();
    availableExercises.forEach((ex) => map.set(ex._id, ex));
    return map;
  }, [availableExercises]);

  const openExercisePicker = () => {
    setPickerSearch('');
    setShowExercisePicker(true);
  };

  const filteredExercises = useMemo(() => {
    const q = pickerSearch.trim().toLowerCase();
    let list = availableExercises;
    if (session?.categoryId && !q) {
      // show the session's category first
      list = [...list].sort((a, b) =>
        (b.categoryId === session.categoryId ? 1 : 0) - (a.categoryId === session.categoryId ? 1 : 0),
      );
    }
    if (!q) return list;
    return list.filter((ex) => ex.name.toLowerCase().includes(q));
  }, [availableExercises, pickerSearch, session?.categoryId]);

  const handleSelectExercise = (exercise: Exercise) => {
    setAddingExercise(exercise);
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
        exerciseId: addingExercise._id,
        sets: formSets ? parseInt(formSets, 10) : undefined,
        reps: formReps ? parseInt(formReps, 10) : undefined,
        weightKg: formWeight ? parseFloat(formWeight) : undefined,
        durationSec: formDuration ? parseInt(formDuration, 10) : undefined,
      });
      setAddingExercise(null);
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
    <div
      style={{
        padding: '12px',
        maxWidth: '520px',
        margin: '0 auto',
        minHeight: '100vh',
        paddingBottom: '100px',
        background: workoutPageBackground(theme.palette.bg),
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
        <IconButton label={t('common.back')} onClick={() => navigate('/workouts')}>
          <BackIcon />
        </IconButton>
        <Text variant="h2" bold style={{ fontSize: '20px', flex: 1 }}>
          {session.name || t('workout.activeWorkout')}
        </Text>
      </div>

      {/* Stats */}
      <div style={{ ...workoutCardStyle, marginBottom: '12px', display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
        <div>
          <span style={{ fontSize: '22px', fontWeight: 800, color: theme.palette.primary, display: 'block' }}>
            {Math.round(session.totalCaloriesBurned)}
          </span>
          <Text variant="small" muted style={{ fontSize: '11px' }}>{t('workout.totalCalories')}</Text>
        </div>
        <div>
          <span style={{ fontSize: '22px', fontWeight: 800, color: theme.palette.text, display: 'block' }}>
            {session.exerciseCount}
          </span>
          <Text variant="small" muted style={{ fontSize: '11px' }}>{t('workout.exerciseCount')}</Text>
        </div>
        <div>
          <span style={{ fontSize: '22px', fontWeight: 800, color: theme.palette.text, display: 'block' }}>
            {formatDuration(session.totalDurationSec)}
          </span>
          <Text variant="small" muted style={{ fontSize: '11px' }}>{t('workout.totalDuration')}</Text>
        </div>
      </div>

      {/* Exercise logs */}
      {logs.length === 0 && !addingExercise && !showExercisePicker ? (
        <div style={{ ...workoutCardStyle, textAlign: 'center', padding: theme.spacing.xl, marginBottom: '12px' }}>
          <Text muted>{t('workout.noExercises')}</Text>
        </div>
      ) : (
        logs.map((log, index) => {
          const detail = exerciseById.get(log.exerciseId);
          const isExpanded = expandedLogId === log._id;
          return (
            <div key={log._id} style={{ ...workoutCardStyle, marginBottom: '10px', padding: '12px' }}>
              <div
                onClick={() => setExpandedLogId(isExpanded ? null : log._id)}
                style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
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
                <Thumb src={log.gifUrl} alt={log.exerciseName} size={52} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Text bold style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {log.exerciseName}
                  </Text>
                  <Text variant="small" muted>
                    {log.sets}×{log.reps}
                    {log.weightKg ? ` × ${log.weightKg}кг` : ''}
                    {log.durationSec > 0 ? ` · ${formatDuration(log.durationSec)}` : ''}
                  </Text>
                </div>
                <span style={{ fontSize: '15px', fontWeight: 800, color: theme.palette.primary, whiteSpace: 'nowrap' }}>
                  {Math.round(log.caloriesBurned)} <span style={{ fontSize: '10px', color: theme.palette.textMuted, fontWeight: 600 }}>{t('workout.kcal')}</span>
                </span>
                <IconButton label={t('common.delete')} onClick={(e) => { e.stopPropagation(); handleRemoveExercise(log._id); }} danger size={30}>
                  <span style={{ fontSize: '14px', lineHeight: 1 }}>✕</span>
                </IconButton>
              </div>

              {/* Technique details */}
              {isExpanded && (
                <div style={{ marginTop: '12px' }}>
                  {log.gifUrl && (
                    <img
                      src={log.gifUrl}
                      alt={log.exerciseName}
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
                  {detail?.description ? (
                    <Text variant="small" muted style={{ display: 'block', marginTop: '10px', lineHeight: 1.5 }}>
                      {detail.description}
                    </Text>
                  ) : (
                    <Text variant="small" muted style={{ display: 'block', marginTop: '10px' }}>
                      {t('workout.noTechnique')}
                    </Text>
                  )}
                  {detail && (detail.muscleGroups?.length || detail.equipment) && (
                    <div style={{ display: 'flex', gap: '6px', marginTop: '8px', flexWrap: 'wrap' }}>
                      {(detail.muscleGroups || []).map((m) => (
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
                      {detail.equipment && (
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
                          {detail.equipment}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })
      )}

      {/* Add exercise form */}
      {addingExercise && (
        <div style={{ ...workoutCardStyle, marginBottom: '12px', border: `1px solid ${theme.palette.primary}66` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: theme.spacing.md }}>
            <Thumb src={addingExercise.gifUrl} alt={addingExercise.name} size={44} />
            <Text bold style={{ fontSize: '16px' }}>{addingExercise.name}</Text>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: theme.spacing.sm }}>
            <Input label={t('workout.sets')} type="number" value={formSets} onChange={(e) => setFormSets(e.target.value)} min="1" />
            <Input label={t('workout.reps')} type="number" value={formReps} onChange={(e) => setFormReps(e.target.value)} min="1" />
            <Input label={t('workout.weight')} type="number" value={formWeight} onChange={(e) => setFormWeight(e.target.value)} min="0" step="0.5" placeholder="0" />
            <Input label={t('workout.duration')} type="number" value={formDuration} onChange={(e) => setFormDuration(e.target.value)} min="0" placeholder="0" />
          </div>
          <div style={{ display: 'flex', gap: theme.spacing.sm, marginTop: theme.spacing.md }}>
            <Button variant="secondary" onClick={() => setAddingExercise(null)} style={{ flex: 1 }}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleAddExercise} style={{ flex: 1 }}>
              {t('common.add')}
            </Button>
          </div>
        </div>
      )}

      {/* Exercise picker */}
      {showExercisePicker && (
        <div style={{ ...workoutCardStyle, marginBottom: '12px', border: `1px solid ${theme.palette.primary}66` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.sm }}>
            <Text variant="h2" bold style={{ fontSize: '17px' }}>{t('workout.addExercise')}</Text>
            <IconButton label={t('common.cancel')} onClick={() => setShowExercisePicker(false)} size={30}>
              <span style={{ fontSize: '14px', lineHeight: 1 }}>✕</span>
            </IconButton>
          </div>
          <input
            type="text"
            placeholder={t('common.search')}
            value={pickerSearch}
            onChange={(e) => setPickerSearch(e.target.value)}
            style={{
              width: '100%',
              boxSizing: 'border-box',
              height: '40px',
              padding: '0 12px',
              borderRadius: '12px',
              border: '1px solid rgba(160, 200, 220, 0.18)',
              background: 'rgba(255, 255, 255, 0.06)',
              color: theme.palette.text,
              fontSize: '14px',
              outline: 'none',
              marginBottom: theme.spacing.sm,
            }}
          />
          <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
            {filteredExercises.map((ex) => (
              <div
                key={ex._id}
                onClick={() => handleSelectExercise(ex)}
                style={{
                  padding: '8px 0',
                  cursor: 'pointer',
                  borderBottom: '1px solid rgba(255,255,255,0.07)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                }}
              >
                <Thumb src={ex.gifUrl} alt={ex.name} size={40} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Text bold style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ex.name}</Text>
                  <Text variant="small" muted>{ex.defaultSets}×{ex.defaultReps}</Text>
                </div>
                <span style={{ fontSize: '12px', fontWeight: 800, color: theme.palette.primary, whiteSpace: 'nowrap' }}>
                  ~{estimateExerciseKcal(ex, userWeight)} {t('workout.kcal')}
                </span>
              </div>
            ))}
            {filteredExercises.length === 0 && (
              <Text variant="small" muted style={{ display: 'block', padding: '10px 0' }}>{t('workout.noExercises')}</Text>
            )}
          </div>
        </div>
      )}

      {/* Bottom actions */}
      {!showExercisePicker && !addingExercise && (
        <button
          type="button"
          onClick={openExercisePicker}
          style={{
            width: '100%',
            height: '46px',
            borderRadius: '16px',
            border: '1px dashed rgba(160, 200, 220, 0.35)',
            background: 'rgba(255,255,255,0.04)',
            color: theme.palette.text,
            fontSize: '14px',
            fontWeight: 700,
            cursor: 'pointer',
            marginBottom: '12px',
          }}
        >
          + {t('workout.addExercise')}
        </button>
      )}

      <div style={{ display: 'flex', gap: theme.spacing.sm }}>
        <Button variant="danger" onClick={handleCancel} style={{ flex: 1, borderRadius: '16px' }}>
          {t('workout.cancelWorkout')}
        </Button>
        <button
          type="button"
          onClick={handleFinish}
          style={{
            flex: 2,
            height: '48px',
            borderRadius: '16px',
            border: 'none',
            background: 'linear-gradient(180deg, rgba(83, 212, 107, 1), rgba(60, 170, 82, 1))',
            color: '#07210f',
            fontSize: '15px',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 14px 26px rgba(83, 212, 107, 0.22)',
          }}
        >
          {t('workout.finishWorkout')}
        </button>
      </div>
    </div>
  );
}
