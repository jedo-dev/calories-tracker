import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../api/client';
import emptyWorkouts from '../assets/03_empty_states/empty_workouts.png';
import { t } from '../i18n';
import { useTheme } from '../theme/useTheme';
import Loader from '../ui/Loader';
import { Text } from '../ui/Text';
import { workoutPageBackground, formatDate } from './workoutShared';
import { ProgramCard } from '../widgets/workout/ProgramCard';
import { CategoryChips } from '../widgets/workout/CategoryChips';
import { WorkoutHistoryList } from '../widgets/workout/WorkoutHistoryList';
import type { ProgramListItem, WorkoutCategory, WorkoutSessionInfo } from '../widgets/workout/types';

export function WorkoutsPage() {
  const navigate = useNavigate();
  const theme = useTheme();
  const [programs, setPrograms] = useState<ProgramListItem[]>([]);
  const [categories, setCategories] = useState<WorkoutCategory[]>([]);
  const [todaySessions, setTodaySessions] = useState<WorkoutSessionInfo[]>([]);
  const [history, setHistory] = useState<WorkoutSessionInfo[]>([]);
  const [historyHasMore, setHistoryHasMore] = useState(false);
  const [historyLoadingMore, setHistoryLoadingMore] = useState(false);
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const today = formatDate(new Date());
    Promise.all([
      apiClient.get('/workouts/programs').catch(() => null),
      apiClient.get('/workouts/categories').catch(() => null),
      apiClient.get('/workouts/sessions', { params: { date: today } }).catch(() => null),
      apiClient.get('/workouts/history', { params: { limit: 5 } }).catch(() => null),
    ])
      .then(([programsRes, catRes, sessionsRes, historyRes]) => {
        if (programsRes) setPrograms(programsRes.data);
        if (catRes) setCategories(catRes.data);
        if (sessionsRes) setTodaySessions(sessionsRes.data.filter((s: WorkoutSessionInfo) => !s.finishedAt));
        if (historyRes) {
          setHistory(historyRes.data);
          setHistoryHasMore(historyRes.data.length === 5);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  // Догрузка истории: раньше были видны только последние 5 тренировок.
  const loadMoreHistory = async () => {
    if (historyLoadingMore) return;
    setHistoryLoadingMore(true);
    try {
      const res = await apiClient.get('/workouts/history', {
        params: { limit: 10, offset: history.length },
      });
      setHistory((prev) => [...prev, ...res.data]);
      setHistoryHasMore(res.data.length === 10);
    } catch (err) {
      console.error(err);
    } finally {
      setHistoryLoadingMore(false);
    }
  };

  const filteredPrograms = useMemo(
    () => (activeCategoryId ? programs.filter((p) => p.categoryId === activeCategoryId) : programs),
    [programs, activeCategoryId],
  );

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
      <Text variant="h2" bold style={{ display: 'block', fontSize: '20px', marginBottom: '12px' }}>
        {t('workout.title')}
      </Text>

      {/* Unfinished sessions today */}
      {todaySessions.length > 0 && (
        <div style={{ marginBottom: '14px' }}>
          <Text variant="h2" bold style={{ display: 'block', marginBottom: '8px', fontSize: '17px' }}>
            {t('workout.todayWorkouts')}
          </Text>
          <WorkoutHistoryList sessions={todaySessions} onSessionClick={(s) => navigate(`/workout/${s._id}`)} />
        </div>
      )}

      {/* Programs */}
      <Text variant="h2" bold style={{ display: 'block', marginBottom: '8px', fontSize: '17px' }}>
        {t('workout.programs')}
      </Text>
      <CategoryChips categories={categories} activeCategoryId={activeCategoryId} onSelect={setActiveCategoryId} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
        {filteredPrograms.map((program) => (
          <ProgramCard key={program._id} program={program} onClick={() => navigate(`/workout/program/${program._id}`)} />
        ))}
      </div>
      {filteredPrograms.length === 0 && (
        <Text variant="small" muted style={{ display: 'block', marginBottom: '14px' }}>
          {t('workout.noHistory')}
        </Text>
      )}

      {/* Browse catalog / custom workout */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
        <button
          type="button"
          disabled={categories.length === 0}
          onClick={() => {
            const target = activeCategoryId || categories[0]?._id;
            if (target) navigate(`/workout/category/${target}`);
          }}
          style={{
            flex: 1,
            height: '46px',
            borderRadius: '16px',
            border: '1px solid rgba(160, 200, 220, 0.24)',
            background: 'rgba(255,255,255,0.06)',
            color: theme.palette.text,
            fontSize: '13px',
            fontWeight: 700,
            cursor: categories.length === 0 ? 'default' : 'pointer',
            opacity: categories.length === 0 ? 0.5 : 1,
            fontFamily: 'inherit',
          }}
        >
          {t('workout.allExercises')}
        </button>
        <button
          type="button"
          onClick={handleCustomWorkout}
          disabled={creating}
          style={{
            flex: 1,
            height: '46px',
            borderRadius: '16px',
            border: 'none',
            background: 'linear-gradient(180deg, rgba(83, 212, 107, 1), rgba(60, 170, 82, 1))',
            color: '#07210f',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 14px 26px rgba(83, 212, 107, 0.2)',
            opacity: creating ? 0.6 : 1,
            fontFamily: 'inherit',
          }}
        >
          + {t('workout.customWorkout')}
        </button>
      </div>

      {/* Recent history */}
      <Text variant="h2" bold style={{ display: 'block', marginBottom: '8px', fontSize: '17px' }}>
        {t('workout.history')}
      </Text>
      <WorkoutHistoryList
        sessions={history}
        emptyImage={emptyWorkouts}
        onSessionClick={(s) => navigate(`/workout/history/${s._id}`)}
      />
      {historyHasMore && (
        <button
          type="button"
          onClick={loadMoreHistory}
          disabled={historyLoadingMore}
          style={{
            width: '100%',
            height: '44px',
            borderRadius: '14px',
            border: '1px solid rgba(160, 200, 220, 0.24)',
            background: 'rgba(255,255,255,0.06)',
            color: theme.palette.text,
            fontSize: '13px',
            fontWeight: 700,
            cursor: historyLoadingMore ? 'default' : 'pointer',
            opacity: historyLoadingMore ? 0.6 : 1,
            fontFamily: 'inherit',
          }}
        >
          {historyLoadingMore ? t('common.loading') : t('common.showMore')}
        </button>
      )}
    </div>
  );
}
