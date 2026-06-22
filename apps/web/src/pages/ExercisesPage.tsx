import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { apiClient } from '../api/client';
import { t } from '../i18n';
import { useTheme } from '../theme/useTheme';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import Loader from '../ui/Loader';
import { Text } from '../ui/Text';

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

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function ExercisesPage() {
  const { categoryId } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [categoryName, setCategoryName] = useState('');
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    loadExercises();
  }, [categoryId]);

  const loadExercises = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/workouts/exercises', { params: { categoryId } });
      setExercises(res.data);
      if (res.data.length > 0) {
        // Try to get category name from the first exercise's populated data
        // or we can fetch categories
        const catRes = await apiClient.get('/workouts/categories');
        const cat = catRes.data.find((c: any) => c._id === categoryId);
        if (cat) setCategoryName(cat.name);
      }
    } catch (err) {
      console.error('Failed to load exercises', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartWorkout = async () => {
    try {
      const today = formatDate(new Date());
      const res = await apiClient.post('/workouts/sessions', {
        date: today,
        categoryId,
        name: categoryName,
      });
      navigate(`/workout/${res.data._id}`);
    } catch (err) {
      console.error('Failed to start workout', err);
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
    <div style={{ padding: theme.spacing.lg, maxWidth: '600px', margin: '0 auto', minHeight: 'calc(100vh - 64px)', backgroundColor: theme.palette.bg }}>
      <Text variant="h1" style={{ marginBottom: theme.spacing.lg }}>
        {categoryName || t('workout.exercises')}
      </Text>

      <Button onClick={handleStartWorkout} size="lg" style={{ marginBottom: theme.spacing.lg }}>
        {t('workout.startWorkout')}
      </Button>

      {exercises.map((ex) => (
        <Card key={ex._id} style={{ marginBottom: theme.spacing.md, padding: 0, overflow: 'hidden' }}>
          <div
            style={{ cursor: 'pointer', padding: theme.spacing.md }}
            onClick={() => setExpandedId(expandedId === ex._id ? null : ex._id)}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ flex: 1 }}>
                <Text bold style={{ color: theme.palette.text }}>{ex.name}</Text>
                <div style={{ display: 'flex', gap: theme.spacing.sm, marginTop: theme.spacing.xs, flexWrap: 'wrap' }}>
                  <span style={{
                    fontSize: '11px',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    backgroundColor: theme.palette.primary + '20',
                    color: theme.palette.primary,
                  }}>
                    {getDifficultyLabel(ex.difficulty)}
                  </span>
                  <span style={{
                    fontSize: '11px',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    backgroundColor: theme.palette.secondary + '20',
                    color: theme.palette.secondaryText,
                  }}>
                    {ex.type === 'cardio' ? t('workout.cardio') : t('workout.strength')}
                  </span>
                </div>
              </div>
              <Text variant="small" muted>{expandedId === ex._id ? '▲' : '▼'}</Text>
            </div>
          </div>

          {expandedId === ex._id && (
            <div style={{ borderTop: `1px solid ${theme.palette.border}` }}>
              {/* GIF */}
              <div style={{ textAlign: 'center', padding: theme.spacing.md, backgroundColor: theme.palette.surface }}>
                <img
                  src={ex.gifUrl}
                  alt={ex.name}
                  style={{
                    maxWidth: '100%',
                    maxHeight: '250px',
                    borderRadius: theme.radius.md,
                    objectFit: 'contain',
                  }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>

              <div style={{ padding: theme.spacing.md }}>
                {ex.description && (
                  <Text muted style={{ marginBottom: theme.spacing.sm }}>{ex.description}</Text>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: theme.spacing.sm }}>
                  <div>
                    <Text variant="small" muted>{t('workout.sets')}</Text>
                    <Text bold>{ex.defaultSets}</Text>
                  </div>
                  <div>
                    <Text variant="small" muted>{t('workout.reps')}</Text>
                    <Text bold>{ex.defaultDurationSec ? `${ex.defaultDurationSec}${t('workout.sec')}` : ex.defaultReps}</Text>
                  </div>
                  <div>
                    <Text variant="small" muted>{t('workout.muscleGroups')}</Text>
                    <Text variant="small">{ex.muscleGroups.join(', ')}</Text>
                  </div>
                  <div>
                    <Text variant="small" muted>{t('workout.equipment')}</Text>
                    <Text variant="small">{ex.equipment || t('workout.noEquipment')}</Text>
                  </div>
                </div>
              </div>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}
