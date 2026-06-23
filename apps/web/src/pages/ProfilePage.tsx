import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../api/client';
import { t } from '../i18n';
import { useTheme } from '../theme/useTheme';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import Loader from '../ui/Loader';
import { Text } from '../ui/Text';

interface ProfileData {
  weightKg?: number;
  heightCm?: number;
  age?: number;
  gender?: 'male' | 'female';
  activityLevel?: 'low' | 'medium' | 'high' | 'very_high';
  goal?: 'lose' | 'maintain' | 'gain';
  startWeightKg?: number;
  targetWeightKg?: number;
  targetDate?: string;
}

export function ProfilePage() {
  const navigate = useNavigate();
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [prediction, setPrediction] = useState<any>(null);
  const [formData, setFormData] = useState<ProfileData>({
    weightKg: undefined,
    heightCm: undefined,
    age: undefined,
    gender: undefined,
    activityLevel: undefined,
    goal: 'maintain',
    startWeightKg: undefined,
    targetWeightKg: undefined,
    targetDate: undefined,
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const [res, predRes] = await Promise.all([
        apiClient.get('/profile'),
        apiClient.get('/weight/prediction').catch(() => ({ data: { available: false } })),
      ]);
      if (res.data.profile) {
        setFormData({
          weightKg: res.data.profile.weightKg,
          heightCm: res.data.profile.heightCm,
          age: res.data.profile.age,
          gender: res.data.profile.gender,
          activityLevel: res.data.profile.activityLevel,
          goal: res.data.profile.goal || 'maintain',
          startWeightKg: res.data.profile.startWeightKg,
          targetWeightKg: res.data.profile.targetWeightKg,
          targetDate: res.data.profile.targetDate,
        });
      }
      setUser(res.data.user);
      setPrediction(predRes.data);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || t('profile.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      await apiClient.patch('/profile', formData);
      navigate('/today');
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || t('profile.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: keyof ProfileData, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value === '' ? undefined : value,
    }));
  };

  if (loading) {
    return (
      <Loader />
    );
  }

  return (
    <div style={{ padding: theme.spacing.lg, maxWidth: '600px', margin: '0 auto', minHeight: 'calc(100vh - 64px)', backgroundColor: theme.palette.bg }}>
      {/* User Card */}
      {user && (
        <Card style={{ marginBottom: theme.spacing.md, backgroundColor: theme.palette.primary + '10' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.md }}>
            <div style={{ fontSize: '48px' }}>{user.avatarEmoji || '🦊'}</div>
            <div>
              <Text variant="h2" bold>{user.displayName || user.username || 'User'}</Text>
              {user.username && (
                <Text variant="small" muted>@{user.username}</Text>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Goal Card */}
      {formData.goal && (
        <Card style={{ marginBottom: theme.spacing.md }}>
          <Text variant="h2" style={{ marginBottom: theme.spacing.sm }}>
            {formData.goal === 'lose' ? '🎯 Похудение' : formData.goal === 'gain' ? '💪 Набор веса' : '⚖️ Поддержание'}
          </Text>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: theme.spacing.sm }}>
            {formData.startWeightKg && (
              <div>
                <Text variant="small" muted>Стартовый вес</Text>
                <Text bold>{formData.startWeightKg} кг</Text>
              </div>
            )}
            {formData.weightKg && (
              <div>
                <Text variant="small" muted>Текущий вес</Text>
                <Text bold>{formData.weightKg} кг</Text>
              </div>
            )}
            {formData.targetWeightKg && (
              <div>
                <Text variant="small" muted>Целевой вес</Text>
                <Text bold>{formData.targetWeightKg} кг</Text>
              </div>
            )}
            {formData.targetDate && (
              <div>
                <Text variant="small" muted>Дедлайн</Text>
                <Text bold>{formData.targetDate}</Text>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Progress Card */}
      {formData.startWeightKg && formData.weightKg && formData.targetWeightKg && (
        <Card style={{ marginBottom: theme.spacing.md }}>
          <Text variant="h2" style={{ marginBottom: theme.spacing.sm }}>📊 Прогресс</Text>
          {(() => {
            const total = Math.abs(formData.startWeightKg - formData.targetWeightKg);
            const current = Math.abs(formData.startWeightKg - formData.weightKg);
            const pct = total > 0 ? Math.min(100, Math.round((current / total) * 100)) : 0;
            return (
              <>
                <div style={{ backgroundColor: theme.palette.bg, borderRadius: theme.radius.sm, height: '12px', overflow: 'hidden', marginBottom: theme.spacing.sm }}>
                  <div style={{ width: `${pct}%`, height: '100%', backgroundColor: theme.palette.primary, borderRadius: theme.radius.sm, transition: 'width 0.3s' }} />
                </div>
                <Text variant="small" muted>{pct}% выполнено</Text>
              </>
            );
          })()}
        </Card>
      )}

      {/* Prediction Card */}
      {prediction?.available && (
        <Card style={{ marginBottom: theme.spacing.md, borderLeft: `3px solid ${prediction.pace === 'too_fast' ? '#FFA500' : prediction.pace === 'stalled' ? theme.palette.danger : theme.palette.success}` }}>
          <Text variant="h2" style={{ marginBottom: theme.spacing.sm }}>🔮 Прогноз</Text>
          {prediction.outlierWarning && (
            <div style={{ 
              padding: theme.spacing.sm, 
              marginBottom: theme.spacing.sm, 
              backgroundColor: '#FFA500' + '20', 
              borderRadius: theme.radius.sm,
              border: '1px solid #FFA500'
            }}>
              <Text variant="small" style={{ color: '#FFA500' }}>⚠️ {prediction.outlierWarning}</Text>
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.sm }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Text variant="small" muted>Тренд за неделю</Text>
              <Text bold style={{ color: prediction.weeklyTrend < 0 ? theme.palette.success : prediction.weeklyTrend > 0 ? theme.palette.danger : theme.palette.text }}>
                {prediction.weeklyTrend > 0 ? '+' : ''}{prediction.weeklyTrend} кг/нед
              </Text>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Text variant="small" muted>Темп</Text>
              <Text bold style={{ color: prediction.pace === 'too_fast' ? '#FFA500' : prediction.pace === 'stalled' ? theme.palette.danger : prediction.pace === 'too_slow' ? theme.palette.danger : theme.palette.success }}>
                {prediction.pace === 'too_fast' ? '⚠️ Слишком быстро' :
                 prediction.pace === 'stalled' ? '⏸️ Вес стоит' :
                 prediction.pace === 'too_slow' ? '🐌 Слишком медленно' : '✅ Нормально'}
              </Text>
            </div>
            {prediction.estimatedDate && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text variant="small" muted>Прогноз достижения</Text>
                <Text bold>{prediction.estimatedDate}</Text>
              </div>
            )}
            {prediction.pace === 'stalled' && (
              <Text variant="small" style={{ color: theme.palette.danger, marginTop: theme.spacing.xs }}>
                Вес стоит несколько дней. Можно пересмотреть калории или добавить активность.
              </Text>
            )}
            {prediction.pace === 'too_fast' && (
              <Text variant="small" style={{ color: '#FFA500', marginTop: theme.spacing.xs }}>
                Слишком быстрый темп может привести к срыву. Рекомендуем не более 0.5-1 кг в неделю.
              </Text>
            )}
          </div>
        </Card>
      )}

      <Text variant="h1" style={{ marginBottom: theme.spacing.lg }}>
        {t('profile.title')}
      </Text>

      {error && (
        <Card style={{ marginBottom: theme.spacing.lg, backgroundColor: theme.palette.danger + '20' }}>
          <Text style={{ color: theme.palette.danger }}>{error}</Text>
        </Card>
      )}

      <form onSubmit={handleSubmit}>
        <Card style={{ marginBottom: theme.spacing.md }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: '4px', rowGap: '4px' }}>
            <Input
              label={t('profile.weight')}
              type="number"
              value={formData.weightKg || ''}
              onChange={(e) => handleChange('weightKg', e.target.value ? parseFloat(e.target.value) : undefined)}
              min={30}
              max={300}
              step={0.1}
            />

            <Input
              label={t('profile.height')}
              type="number"
              value={formData.heightCm || ''}
              onChange={(e) => handleChange('heightCm', e.target.value ? parseFloat(e.target.value) : undefined)}
              min={120}
              max={230}
              step={1}
            />
            <Input
              label={t('profile.age')}
              type="number"
              value={formData.age || ''}
              onChange={(e) => handleChange('age', e.target.value ? parseInt(e.target.value, 10) : undefined)}
              min={10}
              max={100}
              step={1}
            />
            <div> <label style={{ display: 'block', marginBottom: theme.spacing.xs, fontWeight: '600', color: theme.palette.text }}>
              {t('profile.gender')}
            </label>
              <select
                value={formData.gender || ''}
                onChange={(e) => handleChange('gender', e.target.value || undefined)}
                style={{
                  width: '100%',
                  padding: '7.5px',
                  fontSize: theme.typography.body.fontSize,
                  backgroundColor: theme.palette.surface,
                  color: theme.palette.text,
                  border: `1px solid ${theme.palette.border}`,
                  borderRadius: theme.radius.sm,
                }}
              >
                <option value="">—</option>
                <option value="male">{t('profile.gender_male')}</option>
                <option value="female">{t('profile.gender_female')}</option>
              </select></div>
          </div>
          <div style={{ display: "flex", gap: '4px', marginTop: '4px', width: '100%', flexDirection: 'column' }}>
            <div>    <label style={{ display: 'block', marginBottom: theme.spacing.xs, fontWeight: '600', color: theme.palette.text }}>
              {t('profile.activityLevel')}
            </label>
              <select
                value={formData.activityLevel || ''}
                onChange={(e) => handleChange('activityLevel', e.target.value || undefined)}
                style={{
                  width: '100%',
                  padding: theme.spacing.sm,
                  fontSize: theme.typography.body.fontSize,
                  backgroundColor: theme.palette.surface,
                  color: theme.palette.text,
                  border: `1px solid ${theme.palette.border}`,
                  borderRadius: theme.radius.sm,
                }}
              >
                <option value="">—</option>
                <option value="low">{t('profile.activityLevel_low')}</option>
                <option value="medium">{t('profile.activityLevel_medium')}</option>
                <option value="high">{t('profile.activityLevel_high')}</option>
                <option value="very_high">{t('profile.activityLevel_very_high')}</option>
              </select></div>

            <div>
              <label style={{ display: 'block', marginBottom: theme.spacing.xs, fontWeight: '600', color: theme.palette.text }}>
                {t('profile.goal')}
              </label>
              <select
                value={formData.goal || 'maintain'}
                onChange={(e) => handleChange('goal', e.target.value as 'lose' | 'maintain' | 'gain')}
                style={{
                  width: '100%',
                  padding: theme.spacing.sm,
                  fontSize: theme.typography.body.fontSize,
                  backgroundColor: theme.palette.surface,
                  color: theme.palette.text,
                  border: `1px solid ${theme.palette.border}`,
                  borderRadius: theme.radius.sm,
                }}
              >
                <option value="lose">{t('profile.goal_lose')}</option>
                <option value="maintain">{t('profile.goal_maintain')}</option>
                <option value="gain">{t('profile.goal_gain')}</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Goal Settings Card */}
        <Card style={{ marginBottom: theme.spacing.md }}>
          <Text variant="h2" style={{ marginBottom: theme.spacing.sm }}>🎯 Настройки цели</Text>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: '4px', rowGap: '4px' }}>
            <Input
              label="Стартовый вес (кг)"
              type="number"
              value={formData.startWeightKg || ''}
              onChange={(e) => handleChange('startWeightKg', e.target.value ? parseFloat(e.target.value) : undefined)}
              min={30}
              max={300}
              step={0.1}
            />
            <Input
              label="Целевой вес (кг)"
              type="number"
              value={formData.targetWeightKg || ''}
              onChange={(e) => handleChange('targetWeightKg', e.target.value ? parseFloat(e.target.value) : undefined)}
              min={30}
              max={300}
              step={0.1}
            />
            <Input
              label="Дедлайн цели"
              type="date"
              value={formData.targetDate || ''}
              onChange={(e) => handleChange('targetDate', e.target.value || undefined)}
            />
          </div>
        </Card>









        <Button type="submit" disabled={saving}>
          {saving ? t('common.saving') : t('profile.save')}
        </Button>
      </form>
    </div>
  );
}
