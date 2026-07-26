import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { apiClient } from '../api/client';
import { t } from '../i18n';
import { useTheme } from '../theme/useTheme';
import Loader from '../ui/Loader';
import { Text } from '../ui/Text';
import { IconButton } from '../ui/IconButton';
import { BackIcon } from '../ui/icons';
import {
  workoutCardStyle,
  workoutPageBackground,
  formatDate,
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
}

const difficultyColor: Record<string, string> = {
  beginner: '#53D46B',
  intermediate: '#FFCC66',
  advanced: '#FF8A8A',
};

function ExerciseThumb({ src, alt, size }: { src: string; alt: string; size: number }) {
  const [failed, setFailed] = useState(false);
  if (failed || !src) {
    return (
      <div
        style={{
          width: size,
          height: size,
          borderRadius: '14px',
          background: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.08)',
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
      style={{
        width: size,
        height: size,
        objectFit: 'cover',
        borderRadius: '14px',
        border: '1px solid rgba(255,255,255,0.08)',
        flexShrink: 0,
      }}
    />
  );
}

export function ExercisesPage() {
  const { categoryId } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const userWeight = useUserWeight();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [categoryName, setCategoryName] = useState('');
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    loadExercises();
  }, [categoryId]);

  const loadExercises = async () => {
    setLoading(true);
    try {
      const [exRes, catRes] = await Promise.all([
        apiClient.get('/workouts/exercises', { params: { categoryId } }),
        apiClient.get('/workouts/categories'),
      ]);
      setExercises(exRes.data);
      const cat = catRes.data.find((c: any) => c._id === categoryId);
      if (cat) setCategoryName(cat.name);
    } catch (err) {
      console.error('Failed to load exercises', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleExercise = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleStartWorkout = async () => {
    if (selectedIds.size === 0) return;
    setStarting(true);
    try {
      const sessionRes = await apiClient.post('/workouts/sessions', {
        date: formatDate(new Date()),
        categoryId,
        name: categoryName,
      });
      const sessionId = sessionRes.data._id;
      const addPromises = exercises
        .filter((ex) => selectedIds.has(ex._id))
        .map((ex) =>
          apiClient.post(`/workouts/sessions/${sessionId}/exercises`, {
            exerciseId: ex._id,
            sets: ex.defaultSets,
            reps: ex.defaultReps,
            durationSec: ex.defaultDurationSec,
          }),
        );
      await Promise.all(addPromises);
      navigate(`/workout/${sessionId}`);
    } catch (err) {
      console.error('Failed to start workout', err);
    } finally {
      setStarting(false);
    }
  };

  const getDifficultyLabel = (d: string) => {
    const map: Record<string, string> = {
      beginner: t('workout.beginner'),
      intermediate: t('workout.intermediate'),
      advanced: t('workout.advanced'),
    };
    return map[d] || d;
  };

  if (loading) return <Loader />;

  return (
    <div
      style={{
        padding: '12px',
        maxWidth: '520px',
        margin: '0 auto',
        minHeight: '100vh',
        paddingBottom: '120px',
        background: workoutPageBackground(theme.palette.bg),
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
        <IconButton label={t('common.back')} onClick={() => navigate('/workouts')}>
          <BackIcon />
        </IconButton>
        <Text variant="h2" bold style={{ fontSize: '20px', flex: 1 }}>
          {categoryName || t('workout.exercises')}
        </Text>
        <Text variant="small" muted>{exercises.length}</Text>
      </div>

      {exercises.map((ex) => {
        const isSelected = selectedIds.has(ex._id);
        const isExpanded = expandedId === ex._id;
        const kcal = estimateExerciseKcal(ex, userWeight);
        return (
          <div
            key={ex._id}
            style={{
              ...workoutCardStyle,
              marginBottom: '10px',
              padding: '12px',
              border: isSelected ? `1px solid ${theme.palette.primary}` : (workoutCardStyle.border as string),
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div onClick={() => setExpandedId(isExpanded ? null : ex._id)} style={{ cursor: 'pointer' }}>
                <ExerciseThumb src={ex.gifUrl} alt={ex.name} size={56} />
              </div>
              <div
                style={{ flex: 1, minWidth: 0, cursor: 'pointer' }}
                onClick={() => setExpandedId(isExpanded ? null : ex._id)}
              >
                <Text bold style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {ex.name}
                </Text>
                <div style={{ display: 'flex', gap: '6px', marginTop: '5px', flexWrap: 'wrap', alignItems: 'center' }}>
                  <span
                    style={{
                      fontSize: '10px',
                      padding: '3px 8px',
                      borderRadius: '10px',
                      backgroundColor: (difficultyColor[ex.difficulty] || '#53D46B') + '26',
                      color: difficultyColor[ex.difficulty] || '#53D46B',
                      fontWeight: 700,
                    }}
                  >
                    {getDifficultyLabel(ex.difficulty)}
                  </span>
                  <span
                    style={{
                      fontSize: '10px',
                      padding: '3px 8px',
                      borderRadius: '10px',
                      backgroundColor: 'rgba(96,165,250,0.16)',
                      color: '#7cb8ff',
                      fontWeight: 700,
                    }}
                  >
                    {ex.type === 'cardio' ? t('workout.cardio') : t('workout.strength')}
                  </span>
                  <span style={{ fontSize: '12px', fontWeight: 800, color: theme.palette.primary, whiteSpace: 'nowrap' }}>
                    ~{kcal} {t('workout.kcal')}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => toggleExercise(ex._id)}
                aria-label={isSelected ? `Снять выделение с ${ex.name}` : `Выбрать ${ex.name}`}
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '10px',
                  border: `2px solid ${isSelected ? theme.palette.primary : 'rgba(255,255,255,0.2)'}`,
                  backgroundColor: isSelected ? theme.palette.primary : 'transparent',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  color: '#07210f',
                  fontSize: '15px',
                  fontWeight: 800,
                  padding: 0,
                }}
              >
                {isSelected && '✓'}
              </button>
            </div>

            {isExpanded && (
              <div style={{ marginTop: '12px' }}>
                <ExerciseAnimation src={ex.gifUrl} alt={ex.name} />
                {ex.description && (
                  <Text variant="small" muted style={{ display: 'block', marginTop: '10px', lineHeight: 1.45 }}>
                    {ex.description}
                  </Text>
                )}
                <div style={{ display: 'flex', gap: '8px', marginTop: '10px', flexWrap: 'wrap' }}>
                  <InfoPill label={t('workout.sets')} value={String(ex.defaultSets)} />
                  <InfoPill
                    label={ex.defaultDurationSec ? t('workout.duration') : t('workout.reps')}
                    value={ex.defaultDurationSec ? `${ex.defaultDurationSec} ${t('workout.sec')}` : String(ex.defaultReps)}
                  />
                  <InfoPill label="MET" value={String(ex.metValue)} />
                  {ex.equipment && <InfoPill label={t('workout.equipment')} value={ex.equipment} />}
                </div>
                {ex.muscleGroups.length > 0 && (
                  <div style={{ display: 'flex', gap: '6px', marginTop: '8px', flexWrap: 'wrap' }}>
                    {ex.muscleGroups.map((m) => (
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
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* Sticky start bar */}
      <div
        style={{
          position: 'fixed',
          left: 0,
          right: 0,
          bottom: '64px',
          padding: '10px 12px',
          background: 'rgba(8, 21, 35, 0.92)',
          backdropFilter: 'blur(8px)',
          borderTop: '1px solid rgba(160, 200, 220, 0.18)',
          zIndex: 5,
        }}
      >
        <div style={{ maxWidth: '520px', margin: '0 auto' }}>
          <button
            type="button"
            onClick={handleStartWorkout}
            disabled={selectedIds.size === 0 || starting}
            style={{
              width: '100%',
              height: '48px',
              borderRadius: '16px',
              border: 'none',
              background:
                selectedIds.size === 0
                  ? 'rgba(255,255,255,0.08)'
                  : 'linear-gradient(180deg, rgba(83, 212, 107, 1), rgba(60, 170, 82, 1))',
              color: selectedIds.size === 0 ? theme.palette.textMuted : '#07210f',
              fontSize: '15px',
              fontWeight: 700,
              cursor: selectedIds.size === 0 ? 'default' : 'pointer',
              boxShadow: selectedIds.size === 0 ? 'none' : '0 14px 26px rgba(83, 212, 107, 0.22)',
            }}
          >
            {starting ? t('common.saving') : `${t('workout.startWorkout')}${selectedIds.size > 0 ? ` (${selectedIds.size})` : ''}`}
          </button>
        </div>
      </div>
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

function ExerciseAnimation({ src, alt }: { src: string; alt: string }) {
  const [failed, setFailed] = useState(false);
  if (failed || !src) return null;
  return (
    <img
      src={src}
      alt={alt}
      onError={() => setFailed(true)}
      style={{
        width: '100%',
        maxHeight: '220px',
        objectFit: 'contain',
        borderRadius: '16px',
        display: 'block',
        background: 'rgba(3, 18, 28, 0.5)',
      }}
    />
  );
}
