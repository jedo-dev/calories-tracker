import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { apiClient } from '../api/client';
import DayChanger from '../features/TodayComponents/DayChanger';
import FoodList from '../features/TodayComponents/FoodList';
import { RecentProducts } from '../features/TodayComponents/RecentProducts';
import { DailyTips } from '../features/TodayComponents/DailyTips';
import { t } from '../i18n';
import { useTheme } from '../theme/useTheme';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { DashboardRing } from '../ui/DashboardRing';
import { Input } from '../ui/Input';
import Loader from '../ui/Loader';
import { Text } from '../ui/Text';

export interface Entry {
  _id: string;
  productId?: string;
  productName: string;
  grams: number;
  kcal: number;
  kcalPer100g?: number;
  protein: number;
  fat: number;
  carb: number;
  time?: string;
  mealType: string;
}

interface DashboardData {
  date: string;
  consumed: { kcal: number; protein: number; fat: number; carb: number };
  targets: { kcalTarget: number; proteinTargetG: number; fatTargetG: number; carbTargetG: number } | null;
  progress: { kcalPct: number; proteinPct: number; fatPct: number; carbPct: number } | null;
}

interface SocialStats {
  user: { id: string; username?: string; displayName: string; avatarEmoji: string; createdAt: Date };
  stats: { xpTotal: number; xpWeek: number; weekKey: string; currentStreak: number; bestStreak: number; lastLoggedDate?: string };
}

interface WorkoutSession { _id: string; totalCaloriesBurned: number; exerciseCount: number }

// Sanitize numeric values: return 0 for NaN, Infinity, or unreasonably large numbers
function safeNum(val: number): number {
  if (!isFinite(val) || isNaN(val) || Math.abs(val) > 100000) return 0;
  return val;
}

// Format to 2 decimal places, trimming trailing zeros
function fmt2(val: number): string {
  return safeNum(val).toFixed(2);
}

function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function TodayPage() {
  const navigate = useNavigate();
  const theme = useTheme();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryDate = searchParams.get('date');
  const date = queryDate || formatDate(new Date());

  const setDate = (newDate: string) => {
    setSearchParams({ date: newDate });
  };
  const [entries, setEntries] = useState<Entry[]>([]);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [socialStats, setSocialStats] = useState<SocialStats | null>(null);
  const [workouts, setWorkouts] = useState<WorkoutSession[]>([]);
  const [water, setWater] = useState<{ totalMl: number; logs: any[] }>({ totalMl: 0, logs: [] });
  const [weightInput, setWeightInput] = useState('');
  const [showWeightInput, setShowWeightInput] = useState(false);
  const [showSaveTpl, setShowSaveTpl] = useState(false);
  const [tplName, setTplName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [entriesRes, dashboardRes, socialRes, workoutsRes, waterRes] = await Promise.all([
        apiClient.get(`/entries?date=${date}`),
        apiClient.get(`/dashboard/day?date=${date}`),
        apiClient.get('/social/me'),
        apiClient.get('/workouts/sessions', { params: { date } }),
        apiClient.get('/water', { params: { date } }),
      ]);
      setEntries(entriesRes.data);
      setDashboard(dashboardRes.data);
      setSocialStats(socialRes.data);
      setWorkouts(workoutsRes.data);
      setWater(waterRes.data);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || t('dashboard.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [date]);

  const handleDelete = async (id: string) => {
    if (!confirm(t('today.deleteConfirm'))) return;
    try {
      await apiClient.delete(`/entries/${id}`);
      await loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || t('today.deleteFailed'));
    }
  };

  const handleAddWater = async (amountMl: number) => {
    try {
      if (amountMl < 0) {
        // Remove the most recent water log(s) to approximate the negative amount
        const remaining = Math.abs(amountMl);
        let removed = 0;
        const logsCopy = [...water.logs];
        while (removed < remaining && logsCopy.length > 0) {
          const lastLog = logsCopy.shift();
          if (!lastLog) break;
          await apiClient.delete(`/water/${lastLog._id}`);
          removed += lastLog.amountMl;
        }
      } else {
        await apiClient.post('/water', { date, amountMl });
      }
      const res = await apiClient.get('/water', { params: { date } });
      setWater(res.data);
    } catch (err) { console.error(err); }
  };

  const handleLogWeight = async () => {
    if (!weightInput) return;
    const weight = parseFloat(weightInput);
    if (isNaN(weight) || weight < 30 || weight > 300) {
      alert('Введите вес от 30 до 300 кг');
      return;
    }
    try {
      await apiClient.post('/weight', { date, weightKg: weight });
      setWeightInput('');
      setShowWeightInput(false);
    } catch (err) { console.error(err); }
  };

  const handleSaveAsTemplate = async () => {
    if (!tplName.trim() || entries.length === 0) return;
    try {
      await apiClient.post('/templates/from-entries', {
        name: tplName,
        entries: entries.map(e => ({
          productId: e.productId,
          productName: e.productName,
          grams: e.grams,
          kcal: e.kcal,
          kcalPer100g: e.kcalPer100g,
        })),
      });
      setTplName('');
      setShowSaveTpl(false);
      alert(t('template.saved'));
    } catch (err) { console.error(err); }
  };

  const totalBurned = workouts.reduce((s, w) => s + w.totalCaloriesBurned, 0);
  const kcalEaten = dashboard?.consumed.kcal || 0;
  const kcalTarget = dashboard?.targets?.kcalTarget || 0;
  const kcalRemaining = kcalTarget > 0 ? kcalTarget - kcalEaten + totalBurned : 0;
  const waterGoal = 2000;
  const waterPct = Math.round((water.totalMl / waterGoal) * 100);
  const waterReached = water.totalMl >= waterGoal;

  if (loading) return <Loader />;
  if (error) {
    return (
      <div style={{ padding: theme.spacing.lg }}>
        <Text variant="h2" style={{ color: theme.palette.danger }}>{t('common.error')}: {error}</Text>
      </div>
    );
  }

  return (
    <div style={{ padding: theme.spacing.lg, maxWidth: '600px', margin: '0 auto', minHeight: 'calc(100vh - 64px)', backgroundColor: theme.palette.bg, paddingBottom: '80px' }}>
      <DayChanger setDate={setDate} date={date} registrationDate={socialStats?.user.createdAt} />

      {/* Quick Add */}
      <RecentProducts date={date} onAdded={loadData} />

      {/* Daily Tips */}
      <DailyTips dashboard={dashboard} waterMl={water.totalMl} waterGoal={waterGoal} />

      {/* Streak */}
      {socialStats && (
        <Card style={{ marginBottom: theme.spacing.md, backgroundColor: theme.palette.primary + '10' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <Text variant="small" muted style={{ display: 'block' }}>{t('commandCenter.streak')}</Text>
              <Text variant="h2" bold>{t('today.streakDays', { count: socialStats.stats.currentStreak })} 🔥</Text>
            </div>
            <div style={{ textAlign: 'right' }}>
              <Text variant="small" muted style={{ display: 'block' }}>{t('today.xpWeek')}</Text>
              <Text variant="h2" bold>{socialStats.stats.xpWeek}</Text>
            </div>
          </div>
        </Card>
      )}

      {/* Calorie Balance */}
      {dashboard && kcalTarget > 0 && (
        <Card style={{ marginBottom: theme.spacing.md }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm, marginBottom: theme.spacing.sm }}>
            <Text variant="h2">🔥 {t('today.totals')}</Text>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: theme.spacing.sm, textAlign: 'center' }}>
            <div>
              <Text variant="small" muted style={{ display: 'block' }}>{t('dashboard.consumed')}</Text>
              <Text bold style={{ color: theme.palette.success, fontSize: '20px' }}>{fmt2(kcalEaten)}</Text>
            </div>
            <div>
              <Text variant="small" muted style={{ display: 'block' }}>{t('workout.burned')}</Text>
              <Text bold style={{ color: theme.palette.primary, fontSize: '20px' }}>{fmt2(totalBurned)}</Text>
            </div>
            <div>
              <Text variant="small" muted style={{ display: 'block' }}>Остаток</Text>
              <Text bold style={{ color: safeNum(kcalRemaining) >= 0 ? theme.palette.text : theme.palette.danger, fontSize: '20px' }}>{fmt2(kcalRemaining)}</Text>
            </div>
          </div>
          {dashboard.progress && (
            <div style={{ marginTop: theme.spacing.sm }}>
              <DashboardRing consumed={dashboard.consumed} targets={dashboard.targets!} progress={dashboard.progress} />
            </div>
          )}
        </Card>
      )}

      {/* Meal Plan CTA */}
      {dashboard?.targets && (
        <Card
          style={{ marginBottom: theme.spacing.md, cursor: 'pointer' }}
          onClick={() => navigate(`/meal-plan?considerEaten=${entries.length > 0}`)}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <Text bold>🧠 План питания</Text>
              <Text variant="small" muted style={{ display: 'block', marginTop: '2px' }}>
                {entries.length === 0
                  ? 'Составить план на сегодня'
                  : `Добрать остаток ${Math.max(0, safeNum(kcalRemaining)).toFixed(2)} ккал`}
              </Text>
            </div>
            <span style={{ fontSize: '20px' }}>→</span>
          </div>
        </Card>
      )}

      {/* Water Tracking */}
      <Card style={{ marginBottom: theme.spacing.md }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.sm }}>
          <Text bold>💧 {t('water.title')}</Text>
          <Text variant="small" muted>
            {water.totalMl} / {waterGoal} {t('water.ml')}
            {waterReached && ' ✅'}
          </Text>
        </div>
        <div style={{ backgroundColor: theme.palette.bg, borderRadius: theme.radius.sm, height: '12px', overflow: 'hidden', marginBottom: theme.spacing.sm }}>
          <div style={{
            width: `${Math.min(100, waterPct)}%`,
            height: '100%',
            backgroundColor: waterReached ? theme.palette.success : '#4A9EFF',
            borderRadius: theme.radius.sm,
            transition: 'width 0.3s',
          }} />
        </div>
        {waterReached && (
          <Text variant="small" style={{ color: theme.palette.success, display: 'block', marginBottom: theme.spacing.sm }}>
            {waterPct >= 100 ? `Цель достигнута (${waterPct}%)` : ''}
          </Text>
        )}
        <div style={{ display: 'flex', gap: theme.spacing.sm, flexWrap: 'wrap' }}>
          <Button variant="ghost" size="sm" onClick={() => handleAddWater(250)}>+250 мл</Button>
          <Button variant="ghost" size="sm" onClick={() => handleAddWater(500)}>+500 мл</Button>
          {water.totalMl > 0 && (
            <Button variant="ghost" size="sm" onClick={() => handleAddWater(-250)} style={{ color: theme.palette.danger }}>-250 мл</Button>
          )}
        </div>
      </Card>

      {/* Weight */}
      <Card style={{ marginBottom: theme.spacing.md }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text bold>⚖️ {t('weight.title')}</Text>
          {!showWeightInput ? (
            <Button variant="ghost" size="sm" onClick={() => setShowWeightInput(true)}>{t('weight.logWeight')}</Button>
          ) : null}
        </div>
        {showWeightInput && (
          <div style={{ display: 'flex', gap: theme.spacing.sm, marginTop: theme.spacing.sm }}>
            <Input type="number" placeholder="кг" value={weightInput} onChange={(e) => setWeightInput(e.target.value)} step="0.1" min="20" max="300" />
            <Button size="sm" onClick={handleLogWeight} style={{ width: 'auto', minWidth: '80px' }}>OK</Button>
            <Button variant="ghost" size="sm" onClick={() => setShowWeightInput(false)} style={{ width: 'auto', minWidth: '40px' }}>✕</Button>
          </div>
        )}
      </Card>

      {/* Profile banner */}
      {!dashboard?.targets && (
        <Card style={{ marginBottom: theme.spacing.md, backgroundColor: theme.palette.primary + '20', border: `2px solid ${theme.palette.primary}` }}>
          <Text variant="h2" style={{ marginBottom: theme.spacing.md }}>{t('profile.fillProfileBanner')}</Text>
          <Button onClick={() => navigate('/profile')}>{t('profile.goToProfile')}</Button>
        </Card>
      )}

      {/* Totals without targets */}
      {dashboard && !dashboard.targets && (
        <Card style={{ marginBottom: theme.spacing.md }}>
          <Text variant="h2" bold style={{ marginBottom: theme.spacing.sm }}>{t('totals.kcal', { value: dashboard.consumed.kcal.toFixed(0) })}</Text>
          <Text muted>{t('totals.macros', { protein: dashboard.consumed.protein.toFixed(1), fat: dashboard.consumed.fat.toFixed(1), carb: dashboard.consumed.carb.toFixed(1) })}</Text>
        </Card>
      )}

      {/* Add entry button */}
      <div style={{ display: 'flex', gap: theme.spacing.sm, marginBottom: theme.spacing.lg }}>
        <Button onClick={() => navigate('/entry/new')} style={{ flex: 1 }}>{t('today.addEntry')}</Button>
        {entries.length > 0 && (
          <Button variant="ghost" onClick={() => setShowSaveTpl(!showSaveTpl)} style={{ width: 'auto', minWidth: '44px' }}>
            📋
          </Button>
        )}
      </div>

      {showSaveTpl && (
        <Card style={{ marginBottom: theme.spacing.lg, border: `2px solid ${theme.palette.primary}` }}>
          <Text variant="h2" style={{ marginBottom: theme.spacing.sm }}>{t('template.save')}</Text>
          <div style={{ display: 'flex', gap: theme.spacing.sm }}>
            <Input placeholder={t('template.name')} value={tplName} onChange={(e) => setTplName(e.target.value)} style={{ flex: 1 }} />
            <Button size="sm" onClick={handleSaveAsTemplate} disabled={!tplName.trim()} style={{ width: 'auto', minWidth: '80px' }}>{t('common.save')}</Button>
          </div>
        </Card>
      )}

      <FoodList entries={entries} handleDelete={handleDelete} />
    </div>
  );
}
