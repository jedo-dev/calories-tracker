import { useEffect, useMemo, useRef, useState } from 'react';
import { apiClient } from '../api/client';
import { t, toISODate } from '../i18n';
import { glassCardStyle, pageBackground } from '../theme/styles';
import { useTheme } from '../theme/useTheme';
import Loader from '../ui/Loader';
import { PageHeader } from '../ui/PageHeader';
import { Text } from '../ui/Text';
import { BodyGender, BodyMap, BodyView } from '../widgets/muscles/BodyMap';
import { MuscleSlug, normalizeMuscles } from '../widgets/muscles/muscleData';
import { MuscleTooltip, TooltipAnchor } from '../widgets/muscles/MuscleTooltip';

interface MuscleStatRow {
  muscle: string;
  days: string[];
  sets: number;
}

interface CatalogExercise {
  _id: string;
  name: string;
  categoryId?: string;
  muscleGroups?: string[];
}

// Дней тренировок за последние 7 дней → уровень подсветки 0–3
function intensityFromDays(days: string[], weekAgo: string): number {
  const recent = days.filter((d) => d >= weekAgo).length;
  if (recent >= 3) return 3;
  return recent; // 0, 1 или 2
}

export function MusclesPage() {
  const theme = useTheme();
  const [view, setView] = useState<BodyView>('front');
  const [gender, setGender] = useState<BodyGender>('male');
  const [selected, setSelected] = useState<MuscleSlug | null>(null);
  const [anchor, setAnchor] = useState<TooltipAnchor | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [stats, setStats] = useState<MuscleStatRow[]>([]);
  const [exercises, setExercises] = useState<CatalogExercise[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiClient.get('/workouts/muscles/stats', { params: { days: 30 } }),
      apiClient.get('/workouts/exercises'),
      // Пол из профиля выбирает мужскую/женскую модель; без профиля — мужская
      apiClient.get('/profile').catch(() => null),
    ])
      .then(([statsRes, exercisesRes, profileRes]) => {
        setStats(statsRes.data || []);
        setExercises(exercisesRes.data || []);
        if (profileRes?.data?.profile?.gender === 'female') setGender('female');
      })
      .catch(() => {
        // Карта тела полезна и без статистики — просто показываем пустую
      })
      .finally(() => setLoading(false));
  }, []);

  // Сырые строки мышц из БД → слаги; дни складываем по всем синонимам
  const daysBySlug = useMemo(() => {
    const map = new Map<MuscleSlug, Set<string>>();
    for (const row of stats) {
      for (const slug of normalizeMuscles([row.muscle])) {
        const set = map.get(slug) || new Set<string>();
        for (const day of row.days) set.add(day);
        map.set(slug, set);
      }
    }
    return map;
  }, [stats]);

  const intensity = useMemo(() => {
    const weekAgoDate = new Date();
    weekAgoDate.setDate(weekAgoDate.getDate() - 6);
    const weekAgo = toISODate(weekAgoDate);
    const result: Partial<Record<MuscleSlug, number>> = {};
    daysBySlug.forEach((days, slug) => {
      result[slug] = intensityFromDays([...days], weekAgo);
    });
    return result;
  }, [daysBySlug]);

  // Куда вести «схожие упражнения»: категория, чаще всего встречающаяся
  // среди упражнений выбранной мышцы
  const selectedCategoryId = useMemo(() => {
    if (!selected) return null;
    const counts = new Map<string, number>();
    for (const ex of exercises) {
      if (!ex.categoryId) continue;
      if (!normalizeMuscles(ex.muscleGroups).includes(selected)) continue;
      counts.set(ex.categoryId, (counts.get(ex.categoryId) || 0) + 1);
    }
    let best: string | null = null;
    let bestCount = 0;
    counts.forEach((count, id) => {
      if (count > bestCount) {
        best = id;
        bestCount = count;
      }
    });
    return best;
  }, [selected, exercises]);

  const closeTooltip = () => {
    setSelected(null);
    setAnchor(null);
  };

  // Позиция тултипа — над нажатой мышцей, в координатах карточки с картой
  const handleSelect = (slug: MuscleSlug, rect: DOMRect) => {
    if (selected === slug) {
      closeTooltip();
      return;
    }
    const card = cardRef.current?.getBoundingClientRect();
    if (card) {
      setAnchor({
        x: rect.left + rect.width / 2 - card.left,
        top: rect.top - card.top,
        bottom: rect.bottom - card.top,
        containerWidth: card.width,
      });
    }
    setSelected(slug);
  };

  if (loading) return <Loader />;

  const legendLevels = [0, 1, 2, 3];
  const legendAlpha = ['1a', '4d', '8c', 'e6'];

  return (
    <div
      style={{
        minHeight: '100dvh',
        maxWidth: '520px',
        margin: '0 auto',
        padding: '14px 14px 110px',
        paddingTop: 'calc(14px + env(safe-area-inset-top, 0px))',
        background: pageBackground(theme.palette.bg),
      }}
    >
      <PageHeader title={t('muscles.title')} style={{ marginBottom: '8px' }} />

      {/* Переключатель вида */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
        {(['front', 'back'] as BodyView[]).map((v) => {
          const active = view === v;
          return (
            <button
              key={v}
              type="button"
              onClick={() => {
                setView(v);
                closeTooltip();
              }}
              style={{
                flex: 1,
                height: '40px',
                borderRadius: '14px',
                border: active ? `1px solid ${theme.palette.primary}66` : '1px solid rgba(160, 200, 220, 0.18)',
                background: active ? theme.palette.primary + '1f' : 'rgba(255,255,255,0.05)',
                color: active ? theme.palette.primary : theme.palette.text,
                fontSize: '14px',
                fontWeight: 700,
                cursor: 'pointer',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              {t(v === 'front' ? 'muscles.front' : 'muscles.back')}
            </button>
          );
        })}
      </div>

      <div ref={cardRef} style={{ ...glassCardStyle, padding: '18px 14px 12px', position: 'relative' }}>
        <BodyMap
          view={view}
          gender={gender}
          intensity={intensity}
          selected={selected}
          onSelect={handleSelect}
        />

        {/* Тултип поверх карты, прямо над нажатой мышцей — layout не двигается */}
        {selected && anchor && (
          <MuscleTooltip
            slug={selected}
            trainedDays={[...(daysBySlug.get(selected) || [])]}
            categoryId={selectedCategoryId}
            anchor={anchor}
            onClose={closeTooltip}
          />
        )}

        {/* Легенда интенсивности за неделю */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            marginTop: '12px',
            flexWrap: 'wrap',
          }}
        >
          <Text variant="small" muted>{t('muscles.legend')}</Text>
          {legendLevels.map((level) => (
            <span key={level} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <span
                style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '4px',
                  background: level === 0 ? 'rgba(148, 190, 214, 0.14)' : theme.palette.primary + legendAlpha[level],
                  border: '1px solid rgba(148, 190, 214, 0.3)',
                }}
              />
              <span style={{ fontSize: '11px', color: theme.palette.textMuted }}>
                {level === 3 ? '3+' : level}
              </span>
            </span>
          ))}
        </div>
      </div>

      {!selected && (
        <Text variant="small" muted style={{ display: 'block', marginTop: '10px', textAlign: 'center' }}>
          {t('muscles.hint')}
        </Text>
      )}
    </div>
  );
}
