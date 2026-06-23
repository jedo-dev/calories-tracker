import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { apiClient } from '../api/client';
import { useTheme } from '../theme/useTheme';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Text } from '../ui/Text';

interface PlanItem {
  sourceType: 'recipe' | 'product';
  sourceId: string;
  name: string;
  grams: number;
  kcal: number;
  protein: number;
  fat: number;
  carb: number;
  photoUrl?: string;
  authorName?: string;
}

interface PlanMeal {
  mealType: string;
  title: string;
  items: PlanItem[];
  totalKcal: number;
  totalProtein: number;
  totalFat: number;
  totalCarb: number;
}

interface PlanDay {
  date: string;
  meals: PlanMeal[];
  totalKcal: number;
  totalProtein: number;
  totalFat: number;
  totalCarb: number;
}

interface MealPlan {
  _id: string;
  dateFrom: string;
  dateTo: string;
  mode: 'day' | 'week';
  status: 'draft' | 'applied' | 'archived';
  title?: string;
  settings: {
    kcalTarget: number;
    proteinTargetG: number;
    fatTargetG: number;
    carbTargetG: number;
    mealCount: number;
    includePublicRecipes: boolean;
    preferQuick: boolean;
    excludedTags: string[];
    excludedProductNames: string[];
    goal: string;
    considerEaten: boolean;
  };
  days: PlanDay[];
  score: number;
  explanation: string[];
}

const formatDateRu = (dateStr: string): string => {
  const months = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
  const days = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
  const d = new Date(dateStr + 'T00:00:00Z');
  return `${days[d.getUTCDay()]}, ${d.getUTCDate()} ${months[d.getUTCMonth()]}`;
};

export function MealPlanPage() {
  const theme = useTheme();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [mode, setMode] = useState<'day' | 'week'>('day');
  const [mealCount, setMealCount] = useState(3);
  const [includePublic, setIncludePublic] = useState(true);
  const [considerEaten, setConsiderEaten] = useState(true);
  const [preferQuick, setPreferQuick] = useState(false);
  const [excludedTags, setExcludedTags] = useState('');

  const [plan, setPlan] = useState<MealPlan | null>(null);
  const [history, setHistory] = useState<MealPlan[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasProfile, setHasProfile] = useState(true);
  const [selectedDay, setSelectedDay] = useState(0);

  useEffect(() => {
    const consider = searchParams.get('considerEaten');
    if (consider === 'true') setConsiderEaten(true);
    checkProfile();
    loadHistory();
  }, []);

  const checkProfile = async () => {
    try {
      const res = await apiClient.get('/profile');
      if (!res.data.profile?.weightKg || !res.data.profile?.heightCm) {
        setHasProfile(false);
      }
    } catch {
      setHasProfile(false);
    }
  };

  const loadHistory = async () => {
    try {
      const res = await apiClient.get('/meal-plans');
      setHistory(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    setError(null);
    setPlan(null);
    try {
      const payload: any = {
        mode,
        mealCount,
        includePublicRecipes: includePublic,
        considerEaten,
        preferQuick,
      };
      if (excludedTags.trim()) {
        payload.excludedTags = excludedTags.split(',').map(s => s.trim()).filter(Boolean);
      }
      const res = await apiClient.post('/meal-plans/generate', payload);
      setPlan(res.data);
      setSelectedDay(0);
      await loadHistory();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка генерации плана');
    } finally {
      setGenerating(false);
    }
  };

  const handleApply = async () => {
    if (!plan) return;
    setApplying(true);
    try {
      await apiClient.post(`/meal-plans/${plan._id}/apply`);
      setPlan({ ...plan, status: 'applied' });
      await loadHistory();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка применения плана');
    } finally {
      setApplying(false);
    }
  };

  const handleArchive = async () => {
    if (!plan) return;
    try {
      await apiClient.post(`/meal-plans/${plan._id}/archive`);
      setPlan(null);
      await loadHistory();
    } catch (err) {
      console.error(err);
    }
  };

  const handleReplaceItem = async (dayIdx: number, mealIdx: number, itemIdx: number) => {
    if (!plan) return;
    try {
      const res = await apiClient.post(`/meal-plans/${plan._id}/replace-item`, {
        dayIndex: dayIdx,
        mealIndex: mealIdx,
        itemIndex: itemIdx,
      });
      setPlan(res.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Нет альтернатив для замены');
    }
  };

  const handleSaveTemplate = async () => {
    if (!plan) return;
    try {
      await apiClient.post(`/meal-plans/${plan._id}/save-template`, { dayIndex: selectedDay });
      alert('Шаблон сохранён');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка сохранения шаблона');
    }
  };

  const handleLoadPlan = async (id: string) => {
    try {
      const res = await apiClient.get(`/meal-plans/${id}`);
      setPlan(res.data);
      setSelectedDay(0);
      setShowHistory(false);
    } catch (err) {
      console.error(err);
    }
  };

  if (!hasProfile) {
    return (
      <div style={{ padding: theme.spacing.lg, paddingBottom: '100px' }}>
        <Text variant="h1" style={{ marginBottom: theme.spacing.lg }}>🧠 План питания</Text>
        <Card style={{ textAlign: 'center', padding: theme.spacing.xl }}>
          <Text style={{ fontSize: '48px', marginBottom: theme.spacing.md }}>📋</Text>
          <Text variant="h2" style={{ marginBottom: theme.spacing.sm }}>Заполните профиль</Text>
          <Text muted style={{ marginBottom: theme.spacing.lg, display: 'block' }}>
            Для составления плана питания нужно указать вес, рост, возраст и цель
          </Text>
          <Button onClick={() => navigate('/profile')}>
            Перейти в профиль
          </Button>
        </Card>
      </div>
    );
  }

  const currentDay = plan?.days[selectedDay];

  return (
    <div style={{ padding: theme.spacing.lg, paddingBottom: '100px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.lg }}>
        <Text variant="h1">🧠 План питания</Text>
        <Button variant="ghost" size="sm" onClick={() => setShowHistory(!showHistory)} style={{ width: 'auto' }}>
          {showHistory ? '← Назад' : '📋 История'}
        </Button>
      </div>

      {showHistory ? (
        /* History List */
        <div>
          {history.length === 0 ? (
            <Card style={{ textAlign: 'center', padding: theme.spacing.xl }}>
              <Text muted>Нет сохранённых планов</Text>
            </Card>
          ) : (
            history.map((p) => (
              <Card
                key={p._id}
                style={{ marginBottom: theme.spacing.sm, cursor: 'pointer' }}
                onClick={() => handleLoadPlan(p._id)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <Text bold>{p.title || `План ${p.dateFrom}`}</Text>
                    <Text variant="small" muted>
                      {p.mode === 'day' ? 'На день' : 'На неделю'} · {p.settings.kcalTarget} ккал
                    </Text>
                  </div>
                  <span style={{
                    fontSize: '11px',
                    padding: '2px 8px',
                    borderRadius: '8px',
                    backgroundColor: p.status === 'applied' ? theme.palette.success + '20' : p.status === 'draft' ? theme.palette.primary + '20' : theme.palette.surface,
                    color: p.status === 'applied' ? theme.palette.success : p.status === 'draft' ? theme.palette.primary : theme.palette.textMuted,
                    fontWeight: '600',
                  }}>
                    {p.status === 'applied' ? 'Применён' : p.status === 'draft' ? 'Черновик' : 'Архив'}
                  </span>
                </div>
              </Card>
            ))
          )}
        </div>
      ) : plan ? (
        /* Generated Plan View */
        <div>
          {/* Explanation */}
          {plan.explanation.length > 0 && (
            <Card style={{ marginBottom: theme.spacing.md, borderLeft: `3px solid ${theme.palette.primary}` }}>
              {plan.explanation.map((exp, i) => (
                <Text key={i} variant="small" style={{ display: 'block', marginBottom: i < plan.explanation.length - 1 ? theme.spacing.xs : 0 }}>
                  💡 {exp}
                </Text>
              ))}
            </Card>
          )}

          {/* Day selector for week mode */}
          {plan.mode === 'week' && (
            <div style={{ display: 'flex', gap: theme.spacing.xs, marginBottom: theme.spacing.md, overflowX: 'auto', paddingBottom: theme.spacing.xs }}>
              {plan.days.map((day, i) => (
                <button
                  key={day.date}
                  onClick={() => setSelectedDay(i)}
                  style={{
                    padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                    borderRadius: theme.radius.md,
                    border: `2px solid ${selectedDay === i ? theme.palette.primary : theme.palette.border}`,
                    backgroundColor: selectedDay === i ? theme.palette.primary + '20' : 'transparent',
                    color: selectedDay === i ? theme.palette.primary : theme.palette.text,
                    cursor: 'pointer',
                    fontSize: theme.typography.small.fontSize,
                    fontWeight: '600',
                    whiteSpace: 'nowrap',
                    minWidth: '60px',
                    textAlign: 'center',
                  }}
                >
                  {formatDateRu(day.date).split(', ')[0]}
                </button>
              ))}
            </div>
          )}

          {/* Day totals */}
          {currentDay && (
            <Card style={{ marginBottom: theme.spacing.md }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.sm }}>
                <Text bold>{formatDateRu(currentDay.date)}</Text>
                <Text variant="small" muted>Скор: {plan.score}%</Text>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: theme.spacing.xs, textAlign: 'center' }}>
                <div>
                  <Text variant="small" muted>ккал</Text>
                  <Text bold style={{ color: theme.palette.primary }}>{Math.round(currentDay.totalKcal)}</Text>
                  <Text variant="small" muted>/ {plan.settings.kcalTarget}</Text>
                </div>
                <div>
                  <Text variant="small" muted>белки</Text>
                  <Text bold>{Math.round(currentDay.totalProtein)}г</Text>
                </div>
                <div>
                  <Text variant="small" muted>жиры</Text>
                  <Text bold>{Math.round(currentDay.totalFat)}г</Text>
                </div>
                <div>
                  <Text variant="small" muted>углев.</Text>
                  <Text bold>{Math.round(currentDay.totalCarb)}г</Text>
                </div>
              </div>
              {/* Progress bar */}
              <div style={{ marginTop: theme.spacing.sm, backgroundColor: theme.palette.bg, borderRadius: theme.radius.sm, height: '8px', overflow: 'hidden' }}>
                <div style={{
                  width: `${Math.min(100, (currentDay.totalKcal / plan.settings.kcalTarget) * 100)}%`,
                  height: '100%',
                  backgroundColor: currentDay.totalKcal > plan.settings.kcalTarget * 1.1 ? theme.palette.danger : theme.palette.primary,
                  borderRadius: theme.radius.sm,
                  transition: 'width 0.3s',
                }} />
              </div>
            </Card>
          )}

          {/* Meals */}
          {currentDay?.meals.map((meal, mealIdx) => (
            <Card key={mealIdx} style={{ marginBottom: theme.spacing.sm }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.sm }}>
                <Text bold>{meal.title}</Text>
                <Text variant="small" muted>{Math.round(meal.totalKcal)} ккал</Text>
              </div>
              {meal.items.length === 0 ? (
                <Text variant="small" muted>Не удалось подобрать блюдо</Text>
              ) : (
                meal.items.map((item, itemIdx) => (
                  <div
                    key={itemIdx}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: `${theme.spacing.sm} 0`,
                      borderTop: itemIdx > 0 ? `1px solid ${theme.palette.border}` : 'none',
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <Text style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
                        {item.name}
                      </Text>
                      <Text variant="small" muted>
                        {item.grams}г · {Math.round(item.kcal)} ккал · Б{Math.round(item.protein)} Ж{Math.round(item.fat)} У{Math.round(item.carb)}
                      </Text>
                      {item.authorName && (
                        <Text variant="small" muted style={{ fontSize: '10px' }}>
                          от {item.authorName}
                        </Text>
                      )}
                    </div>
                    <button
                      onClick={() => handleReplaceItem(selectedDay, mealIdx, itemIdx)}
                      style={{
                        background: 'none',
                        border: `1px solid ${theme.palette.border}`,
                        borderRadius: theme.radius.sm,
                        padding: '4px 8px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        color: theme.palette.textMuted,
                        marginLeft: theme.spacing.sm,
                        flexShrink: 0,
                      }}
                      title="Заменить"
                    >
                      🔄
                    </button>
                  </div>
                ))
              )}
            </Card>
          ))}

          {/* Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.sm, marginTop: theme.spacing.md }}>
            <Button
              onClick={handleApply}
              disabled={plan.status === 'applied' || applying}
            >
              {plan.status === 'applied' ? '✅ Применён' : applying ? 'Применение...' : '📥 Применить в дневник'}
            </Button>
            <div style={{ display: 'flex', gap: theme.spacing.sm }}>
              <Button variant="secondary" onClick={handleSaveTemplate} style={{ flex: 1 }}>
                📋 Как шаблон
              </Button>
              <Button variant="secondary" onClick={handleGenerate} style={{ flex: 1 }}>
                🔄 Другой план
              </Button>
            </div>
            <Button variant="ghost" onClick={handleArchive}>
              🗄️ В архив
            </Button>
          </div>
        </div>
      ) : (
        /* Settings & Generate */
        <div>
          {error && (
            <Card style={{ marginBottom: theme.spacing.md, backgroundColor: theme.palette.danger + '20' }}>
              <Text style={{ color: theme.palette.danger }}>{error}</Text>
            </Card>
          )}

          {/* Mode */}
          <Card style={{ marginBottom: theme.spacing.md }}>
            <Text bold style={{ marginBottom: theme.spacing.sm }}>Режим</Text>
            <div style={{ display: 'flex', gap: theme.spacing.sm }}>
              <Button
                variant={mode === 'day' ? 'primary' : 'ghost'}
                onClick={() => setMode('day')}
                style={{ flex: 1 }}
              >
                Сегодня
              </Button>
              <Button
                variant={mode === 'week' ? 'primary' : 'ghost'}
                onClick={() => setMode('week')}
                style={{ flex: 1 }}
              >
                Неделя
              </Button>
            </div>
          </Card>

          {/* Settings */}
          <Card style={{ marginBottom: theme.spacing.md }}>
            <Text bold style={{ marginBottom: theme.spacing.sm }}>Настройки</Text>

            {/* Meal count */}
            <div style={{ marginBottom: theme.spacing.md }}>
              <Text variant="small" muted style={{ marginBottom: theme.spacing.xs, display: 'block' }}>
                Приёмов пищи
              </Text>
              <div style={{ display: 'flex', gap: theme.spacing.xs }}>
                {[3, 4, 5].map(n => (
                  <button
                    key={n}
                    onClick={() => setMealCount(n)}
                    style={{
                      flex: 1,
                      padding: theme.spacing.sm,
                      borderRadius: theme.radius.sm,
                      border: `2px solid ${mealCount === n ? theme.palette.primary : theme.palette.border}`,
                      backgroundColor: mealCount === n ? theme.palette.primary + '20' : 'transparent',
                      color: mealCount === n ? theme.palette.primary : theme.palette.text,
                      cursor: 'pointer',
                      fontWeight: '600',
                    }}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            {/* Toggles */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.sm }}>
              <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
                <Text variant="small">Публичные рецепты</Text>
                <input
                  type="checkbox"
                  checked={includePublic}
                  onChange={(e) => setIncludePublic(e.target.checked)}
                  style={{ width: '20px', height: '20px' }}
                />
              </label>
              {mode === 'day' && (
                <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
                  <Text variant="small">Учитывать съеденное</Text>
                  <input
                    type="checkbox"
                    checked={considerEaten}
                    onChange={(e) => setConsiderEaten(e.target.checked)}
                    style={{ width: '20px', height: '20px' }}
                  />
                </label>
              )}
              <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
                <Text variant="small">Быстрые блюда</Text>
                <input
                  type="checkbox"
                  checked={preferQuick}
                  onChange={(e) => setPreferQuick(e.target.checked)}
                  style={{ width: '20px', height: '20px' }}
                />
              </label>
            </div>

            {/* Excluded tags */}
            <div style={{ marginTop: theme.spacing.md }}>
              <Input
                label="Исключить теги (через запятую)"
                placeholder="сладкое, фастфуд"
                value={excludedTags}
                onChange={(e) => setExcludedTags(e.target.value)}
              />
            </div>
          </Card>

          {/* Generate button */}
          <Button onClick={handleGenerate} disabled={generating} size="lg">
            {generating ? '⏳ Генерация...' : '🧠 Составить план'}
          </Button>
        </div>
      )}
    </div>
  );
}
