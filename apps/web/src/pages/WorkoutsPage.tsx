import { PageHeader } from '../ui/PageHeader';
import { useEffect, useMemo, useRef, useState } from 'react';
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
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const today = formatDate(new Date());
    Promise.all([
      apiClient.get('/workouts/programs').catch(() => null),
      apiClient.get('/workouts/categories').catch(() => null),
      apiClient.get('/workouts/sessions', { params: { date: today } }).catch(() => null),
      apiClient.get('/workouts/history', { params: { limit: 5 } }).catch(() => null),
      apiClient.get('/workouts/programs/favorites').catch(() => null),
    ])
      .then(([programsRes, catRes, sessionsRes, historyRes, favoritesRes]) => {
        if (programsRes) setPrograms(programsRes.data);
        if (favoritesRes) setFavoriteIds(new Set<string>(favoritesRes.data));
        if (catRes) setCategories(catRes.data);
        // Пустые незавершённые сессии (создал и вышел) не показываем
        if (sessionsRes) {
          setTodaySessions(
            sessionsRes.data.filter((s: WorkoutSessionInfo) => !s.finishedAt && (s.exerciseCount || 0) > 0),
          );
        }
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

  // Избранные программы — в начало ленты
  const filteredPrograms = useMemo(() => {
    const list = activeCategoryId ? programs.filter((p) => p.categoryId === activeCategoryId) : programs;
    return [...list].sort((a, b) => Number(favoriteIds.has(b._id)) - Number(favoriteIds.has(a._id)));
  }, [programs, activeCategoryId, favoriteIds]);

  // Оптимистичный тоггл: сердечко откликается сразу, откат при ошибке
  const toggleFavorite = (programId: string) => {
    setFavoriteIds((prev) => {
      const next = new Set(prev);
      if (next.has(programId)) next.delete(programId);
      else next.add(programId);
      return next;
    });
    apiClient.post(`/workouts/programs/${programId}/favorite`).catch(() => {
      setFavoriteIds((prev) => {
        const next = new Set(prev);
        if (next.has(programId)) next.delete(programId);
        else next.add(programId);
        return next;
      });
    });
  };

  // Горизонтальная лента программ: индикатор показывает, что справа есть ещё
  const programsScrollRef = useRef<HTMLDivElement>(null);
  const [scrollThumb, setScrollThumb] = useState({ visible: false, ratio: 1, progress: 0 });

  const syncProgramsScroll = () => {
    const el = programsScrollRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setScrollThumb({
      visible: max > 8,
      ratio: el.scrollWidth > 0 ? el.clientWidth / el.scrollWidth : 1,
      progress: max > 0 ? el.scrollLeft / max : 0,
    });
  };

  useEffect(() => {
    syncProgramsScroll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredPrograms, loading]);

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
        paddingTop: 'calc(12px + env(safe-area-inset-top, 0px))',
        maxWidth: '520px',
        margin: '0 auto',
        minHeight: '100vh',
        paddingBottom: '100px',
        background: workoutPageBackground(theme.palette.bg),
      }}
    >
      <PageHeader title={t('workout.title')} />

      {/* Unfinished sessions today */}
      {todaySessions.length > 0 && (
        <div style={{ marginBottom: '14px' }}>
          <Text variant="h2" bold style={{ display: 'block', marginBottom: '8px', fontSize: '17px' }}>
            {t('workout.todayWorkouts')}
          </Text>
          <WorkoutHistoryList sessions={todaySessions} onSessionClick={(s) => navigate(`/workout/${s._id}`)} />
        </div>
      )}

      {/* Своя тренировка — главная CTA страницы, сверху */}
      <button
        type="button"
        onClick={handleCustomWorkout}
        disabled={creating}
        style={{
          width: '100%',
          minHeight: '52px',
          borderRadius: '16px',
          border: 'none',
          background: 'linear-gradient(180deg, rgba(83, 212, 107, 1), rgba(60, 170, 82, 1))',
          color: '#07210f',
          fontSize: '15px',
          fontWeight: 700,
          cursor: 'pointer',
          boxShadow: '0 14px 26px rgba(83, 212, 107, 0.2)',
          opacity: creating ? 0.6 : 1,
          fontFamily: 'inherit',
          marginBottom: '16px',
          WebkitTapHighlightColor: 'transparent',
        }}
      >
        + {t('workout.customWorkout')}
      </button>

      {/* Programs: сетка 2 ряда с горизонтальной прокруткой (~4 на экран) */}
      <Text variant="h2" bold style={{ display: 'block', marginBottom: '8px', fontSize: '17px' }}>
        {t('workout.programs')}
      </Text>
      <CategoryChips categories={categories} activeCategoryId={activeCategoryId} onSelect={setActiveCategoryId} />
      <div
        ref={programsScrollRef}
        onScroll={syncProgramsScroll}
        className="no-scrollbar"
        style={{
          display: 'grid',
          gridAutoFlow: 'column',
          gridTemplateRows: filteredPrograms.length > 1 ? '1fr 1fr' : '1fr',
          gridAutoColumns: 'calc(50% - 5px)',
          gap: '10px',
          overflowX: 'auto',
          scrollSnapType: 'x proximity',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
          marginBottom: scrollThumb.visible ? '8px' : '14px',
        }}
      >
        {filteredPrograms.map((program) => (
          <div key={program._id} style={{ scrollSnapAlign: 'start', minWidth: 0 }}>
            <ProgramCard
              program={program}
              favorite={favoriteIds.has(program._id)}
              onToggleFavorite={() => toggleFavorite(program._id)}
              onClick={() => navigate(`/workout/program/${program._id}`)}
            />
          </div>
        ))}
        {/* Карточка-плюс: собрать и сохранить свою программу */}
        <div style={{ scrollSnapAlign: 'start', minWidth: 0 }}>
          <button
            type="button"
            onClick={() =>
              navigate(`/workout/program-builder${activeCategoryId ? `?categoryId=${activeCategoryId}` : ''}`)
            }
            style={{
              width: '100%',
              height: '100%',
              minHeight: '150px',
              borderRadius: '18px',
              border: '1.5px dashed rgba(160, 200, 220, 0.35)',
              background: 'rgba(255,255,255,0.03)',
              color: theme.palette.text,
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              fontFamily: 'inherit',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            <span
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: theme.palette.primary + '1f',
                border: `1px solid ${theme.palette.primary}55`,
                color: theme.palette.primary,
                fontSize: '24px',
                fontWeight: 700,
                lineHeight: 1,
              }}
            >
              +
            </span>
            <span style={{ fontSize: '12px', fontWeight: 700, color: theme.palette.textMuted, padding: '0 10px', textAlign: 'center' }}>
              {t('workout.createProgram')}
            </span>
          </button>
        </div>
      </div>
      {scrollThumb.visible && (
        <div
          style={{
            height: '3px',
            borderRadius: '2px',
            background: 'rgba(160, 200, 220, 0.16)',
            marginBottom: '14px',
            position: 'relative',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              borderRadius: '2px',
              background: theme.palette.primary + 'aa',
              width: `${Math.max(scrollThumb.ratio * 100, 12)}%`,
              left: `${scrollThumb.progress * (100 - Math.max(scrollThumb.ratio * 100, 12))}%`,
              transition: 'left 0.05s linear',
            }}
          />
        </div>
      )}
      {filteredPrograms.length === 0 && (
        <Text variant="small" muted style={{ display: 'block', marginBottom: '14px' }}>
          {t('workout.noHistory')}
        </Text>
      )}


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
