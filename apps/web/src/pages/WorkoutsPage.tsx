import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../api/client';
import emptyWorkouts from '../assets/03_empty_states/empty_workouts.jpg';
import catChest from '../assets/04_workout_categories/cat_chest.jpg';
import catBack from '../assets/04_workout_categories/cat_back.jpg';
import catLegs from '../assets/04_workout_categories/cat_legs.jpg';
import catShoulders from '../assets/04_workout_categories/cat_shoulders.jpg';
import catArms from '../assets/04_workout_categories/cat_arms.jpg';
import catCardio from '../assets/04_workout_categories/cat_cardio.jpg';
import catAbs from '../assets/04_workout_categories/cat_abs.jpg';
import { t } from '../i18n';
import { useTheme } from '../theme/useTheme';
import Loader from '../ui/Loader';
import { Text } from '../ui/Text';
import { workoutCardStyle, workoutPageBackground, formatDuration, formatDate } from './workoutShared';

interface WorkoutCategory {
  _id: string;
  name: string;
  description?: string;
  emoji: string;
}

interface WorkoutSession {
  _id: string;
  name?: string;
  date?: string;
  totalCaloriesBurned: number;
  totalDurationSec: number;
  exerciseCount: number;
  finishedAt?: string;
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  const theme = useTheme();
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: '8px 12px',
        borderRadius: '12px',
        border: `1px solid ${active ? theme.palette.primary : 'rgba(255,255,255,0.12)'}`,
        background: active ? `linear-gradient(180deg, ${theme.palette.primary}33, ${theme.palette.primary}1f)` : 'rgba(255,255,255,0.06)',
        color: active ? theme.palette.primary : theme.palette.textMuted,
        fontSize: '12px',
        fontWeight: 700,
        cursor: 'pointer',
      }}
    >
      {children}
    </button>
  );
}

function SessionCard({ session, onClick }: { session: WorkoutSession; onClick?: () => void }) {
  const theme = useTheme();
  return (
    <div
      onClick={onClick}
      style={{
        ...workoutCardStyle,
        marginBottom: '10px',
        cursor: onClick ? 'pointer' : 'default',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}
    >
      <div>
        <Text bold style={{ display: 'block' }}>{session.name || t('workout.activeWorkout')}</Text>
        <Text variant="small" muted style={{ display: 'block' }}>
          {session.exerciseCount} {t('workout.exerciseCount').toLowerCase()} · {formatDuration(session.totalDurationSec)}
        </Text>
      </div>
      <div style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
        <span style={{ fontSize: '20px', fontWeight: 800, color: theme.palette.primary }}>
          {Math.round(session.totalCaloriesBurned)}
        </span>
        <span style={{ fontSize: '11px', color: theme.palette.textMuted }}> {t('workout.kcal')}</span>
      </div>
    </div>
  );
}

export function WorkoutsPage() {
  const navigate = useNavigate();
  const theme = useTheme();
  const [categories, setCategories] = useState<WorkoutCategory[]>([]);
  const [todaySessions, setTodaySessions] = useState<WorkoutSession[]>([]);
  const [history, setHistory] = useState<WorkoutSession[]>([]);
  const [tab, setTab] = useState<'categories' | 'history'>('categories');
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

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

  const handleCustomWorkout = async () => {
    setCreating(true);
    try {
      const res = await apiClient.post('/workouts/sessions', {
        date: formatDate(new Date()),
        name: t('workout.customWorkout'),
      });
      navigate(`/workout/${res.data._id}`);
    } catch (err) {
      console.error('Failed to create custom workout', err);
    } finally {
      setCreating(false);
    }
  };

  if (loading) return <Loader />;

  const getCategoryImage = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('рук') || lower.includes('arm')) return catArms;
    if (lower.includes('грудь') || lower.includes('chest')) return catChest;
    if (lower.includes('спин') || lower.includes('back')) return catBack;
    if (lower.includes('ног') || lower.includes('leg')) return catLegs;
    if (lower.includes('плеч') || lower.includes('shoulder')) return catShoulders;
    if (lower.includes('кардио') || lower.includes('cardio')) return catCardio;
    if (lower.includes('пресс') || lower.includes('abs')) return catAbs;
    return null;
  };

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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <Text variant="h2" bold style={{ fontSize: '20px' }}>{t('workout.title')}</Text>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Chip active={tab === 'categories'} onClick={() => setTab('categories')}>{t('workout.categories')}</Chip>
          <Chip active={tab === 'history'} onClick={() => setTab('history')}>{t('workout.history')}</Chip>
        </div>
      </div>

      {tab === 'categories' && (
        <>
          {/* Custom workout CTA */}
          <button
            type="button"
            onClick={handleCustomWorkout}
            disabled={creating}
            style={{
              width: '100%',
              height: '52px',
              borderRadius: '18px',
              border: 'none',
              background: 'linear-gradient(180deg, rgba(83, 212, 107, 1), rgba(60, 170, 82, 1))',
              color: '#07210f',
              fontSize: '15px',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 18px 30px rgba(83, 212, 107, 0.24)',
              marginBottom: '14px',
              opacity: creating ? 0.6 : 1,
            }}
          >
            + {t('workout.customWorkout')}
          </button>

          {todaySessions.length > 0 && (
            <div style={{ marginBottom: '14px' }}>
              <Text variant="h2" bold style={{ marginBottom: '8px', fontSize: '18px' }}>{t('workout.todayWorkouts')}</Text>
              {todaySessions.map((s) => (
                <SessionCard key={s._id} session={s} onClick={() => navigate(`/workout/${s._id}`)} />
              ))}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {categories.map((cat) => {
              const categoryImage = getCategoryImage(cat.name);
              return (
                <div
                  key={cat._id}
                  onClick={() => navigate(`/workout/category/${cat._id}`)}
                  style={{
                    ...workoutCardStyle,
                    cursor: 'pointer',
                    textAlign: 'center',
                    padding: '14px 10px',
                  }}
                >
                  {categoryImage ? (
                    <img
                      src={categoryImage}
                      alt={cat.name}
                      style={{ width: '72px', height: '72px', objectFit: 'contain', marginBottom: '8px', borderRadius: '16px' }}
                    />
                  ) : (
                    <div style={{ fontSize: '38px', marginBottom: '8px' }}>{cat.emoji}</div>
                  )}
                  <Text bold style={{ display: 'block' }}>{cat.name}</Text>
                  {cat.description && (
                    <Text variant="small" muted style={{ display: 'block', marginTop: '4px', fontSize: '11px', lineHeight: 1.3 }}>
                      {cat.description}
                    </Text>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {tab === 'history' && (
        <>
          {history.length === 0 ? (
            <div style={{ ...workoutCardStyle, textAlign: 'center', padding: theme.spacing.xl }}>
              <img src={emptyWorkouts} alt="" style={{ width: '120px', height: '120px', objectFit: 'contain', marginBottom: theme.spacing.md, opacity: 0.8, borderRadius: '20px' }} />
              <Text muted style={{ display: 'block' }}>{t('workout.noHistory')}</Text>
            </div>
          ) : (
            history.map((s) => <SessionCard key={s._id} session={s} />)
          )}
        </>
      )}
    </div>
  );
}
