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
}

export function ProfilePage() {
  const navigate = useNavigate();
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<ProfileData>({
    weightKg: undefined,
    heightCm: undefined,
    age: undefined,
    gender: undefined,
    activityLevel: undefined,
    goal: 'maintain',
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get('/profile');
      if (res.data.profile) {
        setFormData({
          weightKg: res.data.profile.weightKg,
          heightCm: res.data.profile.heightCm,
          age: res.data.profile.age,
          gender: res.data.profile.gender,
          activityLevel: res.data.profile.activityLevel,
          goal: res.data.profile.goal || 'maintain',
        });
      }
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









        <Button type="submit" disabled={saving}>
          {saving ? t('common.saving') : t('profile.save')}
        </Button>
      </form>
    </div>
  );
}
