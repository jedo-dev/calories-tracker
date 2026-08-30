import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { apiClient } from '../api/client';
import emptyWorkoutExercises from '../assets/03_empty_states/empty_workout_exercises.png';
import { EmptyState } from '../ui/EmptyState';
import { useDebounce } from '../hooks/useDebounce';
import { t } from '../i18n';
import { useTheme } from '../theme/useTheme';
import { InlineLoader } from '../ui/Loader';
import { PageHeader } from '../ui/PageHeader';
import { Text } from '../ui/Text';
import { showToast } from '../ui/Toast';
import { workoutCardStyle, workoutPageBackground } from './workoutShared';
import type { WorkoutCategory } from '../widgets/workout/types';

interface CatalogExercise {
  _id: string;
  name: string;
  categoryId?: string;
  muscleGroups?: string[];
  defaultSets: number;
  defaultReps: number;
  defaultDurationSec?: number;
}

const DRAFT_KEY = 'programBuilderDraft';
// Пагинация на бэкенде: каталог грузим порциями, а не целиком
const PAGE_SIZE = 25;

// Конструктор личной программы: имя + набор упражнений из каталога.
// Программа сохраняется на сервере и появляется в общей ленте программ.
export function ProgramBuilderPage() {
  const navigate = useNavigate();
  const theme = useTheme();
  const [searchParams] = useSearchParams();
  const initialCategoryId = searchParams.get('categoryId');

  // Черновик переживает уход на карточку упражнения («i») и возврат назад.
  // Выбранные упражнения храним объектами: они могут быть с разных страниц
  // каталога, и для сохранения нужны их дефолтные подходы/повторы.
  const draft = useMemo(() => {
    try {
      return JSON.parse(sessionStorage.getItem(DRAFT_KEY) || 'null');
    } catch {
      return null;
    }
  }, []);

  const [name, setName] = useState<string>(draft?.name || '');
  const [categories, setCategories] = useState<WorkoutCategory[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(draft?.categoryFilter ?? initialCategoryId);
  const [selected, setSelected] = useState<CatalogExercise[]>(draft?.selected || []);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);

  const [items, setItems] = useState<CatalogExercise[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [loadingPage, setLoadingPage] = useState(true);
  const [saving, setSaving] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  // Отсекаем ответы устаревших запросов (быстрая смена фильтра/поиска)
  const requestSeq = useRef(0);

  useEffect(() => {
    apiClient
      .get('/workouts/categories')
      .then((res) => setCategories(res.data || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ name, categoryFilter, selected }));
  }, [name, categoryFilter, selected]);

  const loadPage = async (reset: boolean) => {
    const seq = ++requestSeq.current;
    setLoadingPage(true);
    try {
      const res = await apiClient.get('/workouts/exercises', {
        params: {
          limit: PAGE_SIZE,
          offset: reset ? 0 : items.length,
          ...(categoryFilter && { categoryId: categoryFilter }),
          ...(debouncedSearch.trim() && { search: debouncedSearch.trim() }),
        },
      });
      if (seq !== requestSeq.current) return;
      const page: CatalogExercise[] = res.data || [];
      setItems((prev) => (reset ? page : [...prev, ...page]));
      setHasMore(page.length === PAGE_SIZE);
    } catch {
      if (seq === requestSeq.current) showToast(t('common.loadError'));
    } finally {
      if (seq === requestSeq.current) setLoadingPage(false);
    }
  };

  useEffect(() => {
    loadPage(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryFilter, debouncedSearch]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasMore && !loadingPage) loadPage(false);
      },
      { rootMargin: '300px' },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasMore, loadingPage, items.length]);

  const selectedIds = useMemo(() => new Set(selected.map((ex) => ex._id)), [selected]);

  const toggle = (ex: CatalogExercise) => {
    // Порядок выбора = порядок упражнений в программе
    setSelected((prev) => (prev.some((s) => s._id === ex._id) ? prev.filter((s) => s._id !== ex._id) : [...prev, ex]));
  };

  const handleSave = async () => {
    const trimmed = name.trim();
    if (trimmed.length < 3) {
      showToast(t('workout.programNameTooShort'));
      return;
    }
    if (selected.length === 0) {
      showToast(t('workout.programNoExercises'));
      return;
    }
    setSaving(true);
    try {
      const res = await apiClient.post('/workouts/programs', {
        name: trimmed,
        ...(categoryFilter && { categoryId: categoryFilter }),
        items: selected.map((ex) => ({
          exerciseId: ex._id,
          sets: ex.defaultSets,
          ...(ex.defaultDurationSec ? { durationSec: ex.defaultDurationSec } : { reps: ex.defaultReps }),
        })),
      });
      sessionStorage.removeItem(DRAFT_KEY);
      showToast(t('workout.programSaved'));
      navigate(`/workout/program/${res.data._id}`, { replace: true });
    } catch (err: any) {
      showToast(err.response?.data?.message || t('common.error'));
      setSaving(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    boxSizing: 'border-box',
    height: '46px',
    padding: '0 14px',
    borderRadius: '14px',
    border: '1px solid rgba(160, 200, 220, 0.18)',
    background: 'rgba(3, 18, 28, 0.5)',
    color: theme.palette.text,
    fontSize: '15px',
    outline: 'none',
    fontFamily: 'inherit',
  };

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
        title={t('workout.createProgram')}
        onBack={() => {
          // Явный выход из конструктора — черновик больше не нужен
          sessionStorage.removeItem(DRAFT_KEY);
          navigate('/workouts');
        }}
      />

      <div style={{ ...workoutCardStyle, padding: '14px', marginBottom: '10px' }}>
        <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600, color: theme.palette.textMuted, fontSize: '12px' }}>
          {t('workout.programName')}
        </label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t('workout.programNamePlaceholder')}
          maxLength={60}
          style={inputStyle}
        />
      </div>

      {/* Выбранные упражнения (могут быть с разных страниц каталога) */}
      {selected.length > 0 && (
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '10px' }}>
          {selected.map((ex, i) => (
            <button
              key={ex._id}
              type="button"
              onClick={() => toggle(ex)}
              title={t('common.delete')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                height: '32px',
                padding: '0 10px',
                borderRadius: '11px',
                border: `1px solid ${theme.palette.primary}55`,
                background: theme.palette.primary + '1a',
                color: theme.palette.primary,
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: 'inherit',
                maxWidth: '100%',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              <span style={{ opacity: 0.7 }}>{i + 1}</span>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ex.name}</span>
              <span aria-hidden="true">✕</span>
            </button>
          ))}
        </div>
      )}

      {/* Фильтр по категории + поиск */}
      <div className="no-scrollbar" style={{ display: 'flex', gap: '6px', overflowX: 'auto', marginBottom: '8px', scrollbarWidth: 'none' }}>
        {[null, ...categories.map((c) => c._id)].map((id) => {
          const cat = categories.find((c) => c._id === id);
          const active = categoryFilter === id;
          return (
            <button
              key={id || 'all'}
              type="button"
              onClick={() => setCategoryFilter(id)}
              style={{
                flexShrink: 0,
                height: '36px',
                padding: '0 13px',
                borderRadius: '12px',
                border: active ? `1px solid ${theme.palette.primary}66` : '1px solid rgba(160, 200, 220, 0.18)',
                background: active ? theme.palette.primary + '1f' : 'rgba(255,255,255,0.05)',
                color: active ? theme.palette.primary : theme.palette.text,
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: 'inherit',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              {cat ? `${cat.emoji ? cat.emoji + ' ' : ''}${cat.name}` : t('common.all')}
            </button>
          );
        })}
      </div>
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder={t('common.search')}
        style={{ ...inputStyle, marginBottom: '10px' }}
      />

      {items.map((ex) => {
        const orderIndex = selectedIds.has(ex._id) ? selected.findIndex((s) => s._id === ex._id) : -1;
        const isSelected = orderIndex !== -1;
        return (
          <button
            key={ex._id}
            type="button"
            onClick={() => toggle(ex)}
            style={{
              ...workoutCardStyle,
              width: '100%',
              marginBottom: '8px',
              padding: '11px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              cursor: 'pointer',
              textAlign: 'left',
              fontFamily: 'inherit',
              color: theme.palette.text,
              border: isSelected ? `1px solid ${theme.palette.primary}` : (workoutCardStyle.border as string),
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            <span
              style={{
                width: '26px',
                height: '26px',
                borderRadius: '9px',
                border: `2px solid ${isSelected ? theme.palette.primary : 'rgba(255,255,255,0.2)'}`,
                background: isSelected ? theme.palette.primary : 'transparent',
                color: '#07210f',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                fontWeight: 800,
                flexShrink: 0,
              }}
            >
              {isSelected ? orderIndex + 1 : ''}
            </span>
            <span style={{ minWidth: 0, flex: 1 }}>
              <Text bold style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '14px' }}>
                {ex.name}
              </Text>
              {(ex.muscleGroups || []).length > 0 && (
                <Text variant="small" muted style={{ display: 'block', marginTop: '2px', fontSize: '11px' }}>
                  {(ex.muscleGroups || []).join(' · ')}
                </Text>
              )}
            </span>
            {/* span, а не button: строка сама <button>, вложенные кнопки невалидны */}
            <span
              role="button"
              aria-label={t('workout.exerciseDetails')}
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/exercise/${ex._id}`);
              }}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '11px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(160, 200, 220, 0.2)',
                color: theme.palette.textMuted,
                fontSize: '13px',
                fontWeight: 800,
                fontStyle: 'italic',
                fontFamily: 'Georgia, serif',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              i
            </span>
          </button>
        );
      })}

      {/* Сторожок пагинации: доехал до низа — запросили следующую порцию */}
      {hasMore && !loadingPage && <div ref={sentinelRef} style={{ height: '1px' }} />}
      {/* Лоадер прямо в списке — гантель, без полноэкранной «Загрузки» */}
      {loadingPage && <InlineLoader variant="dumbbell" />}

      {!loadingPage && items.length === 0 && (
        <EmptyState
          image={emptyWorkoutExercises}
          title={t('common.nothingFound')}
          description={t('workout.builderEmptyHint')}
        />
      )}

      {/* Sticky-панель сохранения */}
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
            onClick={handleSave}
            disabled={saving}
            style={{
              width: '100%',
              height: '48px',
              borderRadius: '16px',
              border: 'none',
              background:
                selected.length === 0
                  ? 'rgba(255,255,255,0.08)'
                  : 'linear-gradient(180deg, rgba(83, 212, 107, 1), rgba(60, 170, 82, 1))',
              color: selected.length === 0 ? theme.palette.textMuted : '#07210f',
              fontSize: '15px',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: selected.length === 0 ? 'none' : '0 14px 26px rgba(83, 212, 107, 0.22)',
              opacity: saving ? 0.6 : 1,
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            {saving
              ? t('common.saving')
              : `${t('workout.saveProgram')}${selected.length > 0 ? ` (${selected.length})` : ''}`}
          </button>
        </div>
      </div>
    </div>
  );
}
