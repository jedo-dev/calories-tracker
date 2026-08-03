import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { apiClient } from '../api/client';
import { useTheme } from '../theme/useTheme';
import { Text } from '../ui/Text';
import { PlanSettingsCard } from '../widgets/mealPlan/PlanSettingsCard';
import { PlanDayCard } from '../widgets/mealPlan/PlanDayCard';
import { PlanMealCard } from '../widgets/mealPlan/PlanMealCard';
import { PlanHistoryList } from '../widgets/mealPlan/PlanHistoryList';
import { planCardStyle, formatDateRu, MealPlan } from '../widgets/mealPlan/types';

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
  const [notice, setNotice] = useState<string | null>(null);
  const [hasProfile, setHasProfile] = useState(true);
  const [selectedDay, setSelectedDay] = useState(0);

  useEffect(() => {
    const consider = searchParams.get('considerEaten');
    if (consider === 'true') setConsiderEaten(true);
    apiClient
      .get('/profile')
      .then((res) => {
        if (!res.data.profile?.weightKg || !res.data.profile?.heightCm) setHasProfile(false);
      })
      .catch(() => setHasProfile(false));
    loadHistory();
  }, []);

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
    setNotice(null);
    setPlan(null);
    try {
      const payload: any = { mode, mealCount, includePublicRecipes: includePublic, considerEaten, preferQuick };
      if (excludedTags.trim()) {
        payload.excludedTags = excludedTags.split(',').map((s) => s.trim()).filter(Boolean);
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
    setError(null);
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

  const handleReplaceItem = async (mealIdx: number, itemIdx: number) => {
    if (!plan) return;
    setError(null);
    try {
      const res = await apiClient.post(`/meal-plans/${plan._id}/replace-item`, {
        dayIndex: selectedDay,
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
    setError(null);
    try {
      const res = await apiClient.post(`/meal-plans/${plan._id}/save-template`, { dayIndex: selectedDay });
      const count = Array.isArray(res.data) ? res.data.length : 1;
      setNotice(`Сохранено шаблонов: ${count} (по одному на приём пищи) — они на странице «Шаблоны»`);
      setTimeout(() => setNotice(null), 4000);
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

  const pageStyle: React.CSSProperties = {
    minHeight: '100vh',
    maxWidth: '520px',
    margin: '0 auto',
    padding: '12px',
    paddingBottom: '100px',
    background: `
      radial-gradient(circle at top, rgba(83, 212, 107, 0.18), transparent 34%),
      radial-gradient(circle at 20% 25%, rgba(60, 140, 255, 0.12), transparent 24%),
      linear-gradient(180deg, #07111d 0%, ${theme.palette.bg} 28%, #081523 100%)
    `,
  };

  const ghostBtn: React.CSSProperties = {
    padding: '8px 12px',
    borderRadius: '12px',
    border: '1px solid rgba(160, 200, 220, 0.24)',
    background: 'rgba(255,255,255,0.06)',
    color: theme.palette.text,
    fontSize: '12px',
    fontWeight: 700,
    cursor: 'pointer',
    fontFamily: 'inherit',
  };

  const primaryBtn = (disabled: boolean): React.CSSProperties => ({
    width: '100%',
    height: '50px',
    borderRadius: '16px',
    border: 'none',
    background: disabled
      ? 'rgba(255,255,255,0.08)'
      : 'linear-gradient(180deg, rgba(83, 212, 107, 1), rgba(60, 170, 82, 1))',
    color: disabled ? theme.palette.textMuted : '#07210f',
    fontSize: '14px',
    fontWeight: 700,
    cursor: disabled ? 'default' : 'pointer',
    boxShadow: disabled ? 'none' : '0 14px 26px rgba(83, 212, 107, 0.22)',
    fontFamily: 'inherit',
  });

  if (!hasProfile) {
    return (
      <div style={pageStyle}>
        <Text variant="h2" bold style={{ display: 'block', fontSize: '20px', marginBottom: '12px' }}>
          План питания
        </Text>
        <div style={{ ...planCardStyle, textAlign: 'center', padding: '26px 16px' }}>
          <div style={{ fontSize: '44px', marginBottom: '8px' }}>📋</div>
          <Text variant="h2" bold style={{ display: 'block', marginBottom: '6px' }}>Заполните профиль</Text>
          <Text variant="small" muted style={{ display: 'block', marginBottom: '16px', lineHeight: 1.5 }}>
            Для составления плана питания нужно указать вес, рост, возраст и цель
          </Text>
          <button type="button" onClick={() => navigate('/profile')} style={{ ...primaryBtn(false), maxWidth: '260px' }}>
            Перейти в профиль
          </button>
        </div>
      </div>
    );
  }

  const currentDay = plan?.days[selectedDay];

  return (
    <div style={pageStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <Text variant="h2" bold style={{ fontSize: '20px' }}>План питания</Text>
        <button type="button" onClick={() => setShowHistory((v) => !v)} style={ghostBtn}>
          {showHistory ? '← Назад' : '🗂 История'}
        </button>
      </div>

      {error && (
        <Text variant="small" style={{ display: 'block', color: '#ff8a8a', marginBottom: '10px' }}>
          {error}
        </Text>
      )}
      {notice && (
        <Text variant="small" style={{ display: 'block', color: '#6fe08a', marginBottom: '10px' }}>
          ✓ {notice}
        </Text>
      )}

      {showHistory ? (
        <PlanHistoryList history={history} onOpen={handleLoadPlan} />
      ) : plan ? (
        <>
          {plan.explanation.length > 0 && (
            <div style={{ ...planCardStyle, borderLeft: `3px solid ${theme.palette.primary}` }}>
              {plan.explanation.map((exp, i) => (
                <Text
                  key={i}
                  variant="small"
                  muted
                  style={{ display: 'block', lineHeight: 1.4, marginBottom: i < plan.explanation.length - 1 ? '6px' : 0 }}
                >
                  💡 {exp}
                </Text>
              ))}
            </div>
          )}

          {plan.mode === 'week' && (
            <div style={{ display: 'flex', gap: '6px', marginBottom: '12px', overflowX: 'auto', scrollbarWidth: 'none' }}>
              {plan.days.map((day, i) => {
                const active = selectedDay === i;
                return (
                  <button
                    key={day.date}
                    type="button"
                    onClick={() => setSelectedDay(i)}
                    style={{
                      padding: '9px 13px',
                      borderRadius: '12px',
                      border: `1px solid ${active ? theme.palette.primary : 'rgba(255,255,255,0.12)'}`,
                      background: active
                        ? `linear-gradient(180deg, ${theme.palette.primary}33, ${theme.palette.primary}1f)`
                        : 'rgba(255,255,255,0.06)',
                      color: active ? theme.palette.primary : theme.palette.textMuted,
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                      minWidth: '54px',
                      fontFamily: 'inherit',
                    }}
                  >
                    {formatDateRu(day.date).split(', ')[0]}
                  </button>
                );
              })}
            </div>
          )}

          {currentDay && <PlanDayCard plan={plan} day={currentDay} />}

          {currentDay?.meals.map((meal, mealIdx) => (
            <PlanMealCard key={mealIdx} meal={meal} onReplaceItem={(itemIdx) => handleReplaceItem(mealIdx, itemIdx)} />
          ))}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
            <button
              type="button"
              onClick={handleApply}
              disabled={plan.status === 'applied' || applying}
              style={primaryBtn(plan.status === 'applied' || applying)}
            >
              {plan.status === 'applied' ? '✓ Применён' : applying ? 'Применение...' : '📥 Применить в дневник'}
            </button>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button type="button" onClick={handleSaveTemplate} style={{ ...ghostBtn, flex: 1, height: '44px' }}>
                💾 Как шаблон
              </button>
              <button
                type="button"
                onClick={handleGenerate}
                disabled={generating}
                style={{ ...ghostBtn, flex: 1, height: '44px', opacity: generating ? 0.6 : 1 }}
              >
                🔄 Другой план
              </button>
            </div>
            <button
              type="button"
              onClick={handleArchive}
              style={{ ...ghostBtn, height: '40px', color: theme.palette.textMuted }}
            >
              В архив
            </button>
          </div>
        </>
      ) : (
        <>
          <PlanSettingsCard
            mode={mode}
            mealCount={mealCount}
            includePublic={includePublic}
            considerEaten={considerEaten}
            preferQuick={preferQuick}
            excludedTags={excludedTags}
            onChange={(patch) => {
              if (patch.mode !== undefined) setMode(patch.mode);
              if (patch.mealCount !== undefined) setMealCount(patch.mealCount);
              if (patch.includePublic !== undefined) setIncludePublic(patch.includePublic);
              if (patch.considerEaten !== undefined) setConsiderEaten(patch.considerEaten);
              if (patch.preferQuick !== undefined) setPreferQuick(patch.preferQuick);
              if (patch.excludedTags !== undefined) setExcludedTags(patch.excludedTags);
            }}
          />
          <button type="button" onClick={handleGenerate} disabled={generating} style={primaryBtn(generating)}>
            {generating ? '⏳ Генерация...' : '✨ Составить план'}
          </button>
        </>
      )}
    </div>
  );
}
