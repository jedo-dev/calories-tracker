import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../api/client';
import { t } from '../i18n';
import { useTheme } from '../theme/useTheme';
import { Card } from '../ui/Card';
import Loader from '../ui/Loader';
import { Text } from '../ui/Text';
import { Button } from '../ui/Button';

interface WorkoutCategory {
  _id: string;
  name: string;
  description?: string;
  emoji: string;
}

interface WorkoutSession {
  _id: string;
  name?: string;
  totalCaloriesBurned: number;
  totalDurationSec: number;
  exerciseCount: number;
  finishedAt?: string;
}

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  if (m === 0) return `${s}${t('workout.sec')}`;
  if (s === 0) return `${m}${t('workout.min')}`;
  return `${m}${t('workout.min')} ${s}${t('workout.sec')}`;
}

export function WorkoutsPage() {
  const navigate = useNavigate();
  const theme = useTheme();
  const [categories, setCategories] = useState<WorkoutCategory[]>([]);
  const [todaySessions, setTodaySessions] = useState<WorkoutSession[]>([]);
  const [history, setHistory] = useState<WorkoutSession[]>([]);
  const [tab, setTab] = useState<'categories' | 'history'>('categories');
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const today = formatDate(new Date());
      const [catRes, sessionsRes, historyRes] = await Promise.all([
        apiClient.get('/workouts/categories'),
        apiClient.get('/workouts/sessions', { params: { date: today } }),
        apiClient.get('/workouts/history', { params: { limit: 20 } }),
      ]);
      setCategories(catRes.data);
      setTodaySessions(sessionsRes.data);
      setHistory(historyRes.data);
    } catch (err) {
      console.error('Failed to load workouts', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) return <Loader />;

  return (
    <div style={{ padding: theme.spacing.lg, maxWidth: '600px', margin: '0 auto', minHeight: 'calc(100vh - 64px)', backgroundColor: theme.palette.bg }}>
      <div style={{ display: 'flex', gap: theme.spacing.sm, marginBottom: theme.spacing.lg }}>
        <Button
          variant={tab === 'categories' ? 'primary' : 'ghost'}
          onClick={() => setTab('categories')}
          style={{ flex: 1 }}
        >
          {t('workout.categories')}
        </Button>
        <Button
          variant={tab === 'history' ? 'primary' : 'ghost'}
          onClick={() => setTab('history')}
          style={{ flex: 1 }}
        >
          {t('workout.history')}
        </Button>
      </div>

      {tab === 'categories' && (
        <>
          {todaySessions.length > 0 && (
            <div style={{ marginBottom: theme.spacing.lg }}>
              <Text variant="h2" style={{ marginBottom: theme.spacing.md }}>{t('workout.todayWorkouts')}</Text>
              {todaySessions.map((s) => (
                <Card
                  key={s._id}
                  style={{
                    marginBottom: theme.spacing.sm,
                    cursor: 'pointer',
                    borderLeft: `3px solid ${theme.palette.primary}`,
                  }}
                  onClick={() => navigate(`/workout/${s._id}`)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <Text bold style={{ display: 'block' }}>{s.name || t('workout.activeWorkout')}</Text>
                      <Text variant="small" muted style={{ display: 'block' }}>
                        {s.exerciseCount} {t('workout.exerciseCount').toLowerCase()} · {formatDuration(s.totalDurationSec)}
                      </Text>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <Text bold style={{ color: theme.palette.primary, fontSize: '18px' }}>
                        {Math.round(s.totalCaloriesBurned)}
                      </Text>
                      <Text variant="small" muted>{t('workout.calories')}</Text>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: theme.spacing.md }}>
            {categories.map((cat) => (
              <Card
                key={cat._id}
                style={{
                  cursor: 'pointer',
                  textAlign: 'center',
                  padding: theme.spacing.lg,
                  transition: 'transform 0.15s, box-shadow 0.15s',
                  border: `1px solid ${theme.palette.border}`,
                }}
                onClick={() => navigate(`/workout/category/${cat._id}`)}
              >
                <div style={{ fontSize: '40px', marginBottom: theme.spacing.sm }}>{cat.emoji}</div>
                <Text bold style={{ display: 'block' }}>{cat.name}</Text>
                {cat.description && (
                  <Text variant="small" muted style={{ display: 'block', marginTop: theme.spacing.xs, fontSize: '12px', lineHeight: '1.3' }}>
                    {cat.description}
                  </Text>
                )}
              </Card>
            ))}
          </div>
        </>
      )}

      {tab === 'history' && (
        <>
          {history.length === 0 ? (
            <Card style={{ textAlign: 'center', padding: theme.spacing.xl }}>
              <div style={{ fontSize: '48px', marginBottom: theme.spacing.md }}>🏋️</div>
              <Text muted>{t('workout.noHistory')}</Text>
            </Card>
          ) : (
            history.map((s) => (
              <Card
                key={s._id}
                style={{
                  marginBottom: theme.spacing.sm,
                  borderLeft: `3px solid ${theme.palette.primary}`,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <Text bold style={{ display: 'block' }}>{s.name || t('workout.activeWorkout')}</Text>
                    <Text variant="small" muted style={{ display: 'block' }}>
                      {s.exerciseCount} {t('workout.exerciseCount').toLowerCase()} · {formatDuration(s.totalDurationSec)}
                    </Text>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <Text bold style={{ color: theme.palette.primary, fontSize: '20px' }}>
                      {Math.round(s.totalCaloriesBurned)}
                    </Text>
                    <Text variant="small" muted>{t('workout.calories')}</Text>
                  </div>
                </div>
              </Card>
            ))
          )}
        </>
      )}
    </div>
  );
}
