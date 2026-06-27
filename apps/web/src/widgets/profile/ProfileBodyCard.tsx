import type { FormEvent } from 'react';
import { useTheme } from '../../theme/useTheme';
import { Button } from '../../ui/Button';
import { Card } from '../../ui/Card';
import { Input } from '../../ui/Input';
import { Text } from '../../ui/Text';
import { t } from '../../i18n';
import type { ProfileData } from './types';

interface ProfileBodyCardProps {
  formData: ProfileData;
  editing: boolean;
  saving: boolean;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  onChange: (field: keyof ProfileData, value: any) => void;
  onToggleEdit: () => void;
}

const bodyFields = [
  { labelKey: 'profile.weight', field: 'weightKg' as const, type: 'number' as const, min: 30, max: 300, step: 0.1 },
  { labelKey: 'profile.height', field: 'heightCm' as const, type: 'number' as const, min: 120, max: 230, step: 1 },
  { labelKey: 'profile.age', field: 'age' as const, type: 'number' as const, min: 10, max: 100, step: 1 },
] as const;

function formatGoal(goal?: ProfileData['goal']) {
  if (goal === 'lose') return t('profile.goal_lose');
  if (goal === 'gain') return t('profile.goal_gain');
  return t('profile.goal_maintain');
}

function formatActivity(activity?: ProfileData['activityLevel']) {
  if (activity === 'low') return t('profile.activityLevel_low');
  if (activity === 'medium') return t('profile.activityLevel_medium');
  if (activity === 'high') return t('profile.activityLevel_high');
  if (activity === 'very_high') return t('profile.activityLevel_very_high');
  return '—';
}

function formatGender(gender?: ProfileData['gender']) {
  if (gender === 'male') return t('profile.gender_male');
  if (gender === 'female') return t('profile.gender_female');
  return '—';
}

export function ProfileBodyCard({ formData, editing, saving, onSubmit, onChange, onToggleEdit }: ProfileBodyCardProps) {
  const theme = useTheme();

  return (
    <Card
      style={{
        marginBottom: '12px',
        borderRadius: '22px',
        background: 'linear-gradient(180deg, rgba(17, 49, 69, 0.94), rgba(10, 32, 46, 0.94))',
        border: '1px solid rgba(160, 200, 220, 0.18)',
      }}
    >
      <form onSubmit={onSubmit}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <Text variant="h2" bold style={{ display: 'block', fontSize: '20px' }}>
            {t('profile.bodyTitle')}
          </Text>
          <button
            type="button"
            onClick={onToggleEdit}
            style={{
              border: 'none',
              background: 'transparent',
              color: theme.palette.primary,
              fontWeight: 700,
              fontSize: '15px',
              cursor: 'pointer',
              padding: 0,
            }}
          >
            {editing ? t('common.cancel') : '✎'}
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          {bodyFields.map((field) => {
            const value = formData[field.field];
            return (
              <div
                key={field.field}
                style={{
                  position: 'relative',
                  borderRadius: '16px',
                  border: `1px solid ${theme.palette.border}`,
                  background: 'rgba(3, 18, 28, 0.88)',
                  padding: '12px 12px 10px',
                  minHeight: '64px',
                }}
              >
                <Text
                  variant="small"
                  muted
                  style={{
                    position: 'absolute',
                    top: '-9px',
                    left: '10px',
                    padding: '0 6px',
                    background: 'linear-gradient(180deg, rgba(17, 49, 69, 0.98), rgba(10, 32, 46, 0.98))',
                    fontSize: '11px',
                  }}
                >
                  {t(field.labelKey)}
                </Text>
                {editing ? (
                  <Input
                    type={field.type}
                    value={value ?? ''}
                    onChange={(e) => onChange(field.field, e.target.value ? parseFloat(e.target.value) : undefined)}
                    min={field.min}
                    max={field.max}
                    step={field.step}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      padding: 0,
                      fontSize: '18px',
                      fontWeight: 600,
                    }}
                  />
                ) : (
                  <Text bold style={{ display: 'block', fontSize: '18px', paddingTop: '6px' }}>
                    {value ?? '—'}
                  </Text>
                )}
              </div>
            );
          })}

          <div
            style={{
              position: 'relative',
              borderRadius: '16px',
              border: `1px solid ${theme.palette.border}`,
              background: 'rgba(3, 18, 28, 0.88)',
              padding: '12px 12px 10px',
              minHeight: '64px',
            }}
          >
            <Text variant="small" muted style={{ position: 'absolute', top: '-9px', left: '10px', padding: '0 6px', background: 'linear-gradient(180deg, rgba(17, 49, 69, 0.98), rgba(10, 32, 46, 0.98))', fontSize: '11px' }}>
              {t('profile.gender')}
            </Text>
            {editing ? (
              <select
                value={formData.gender || ''}
                onChange={(e) => onChange('gender', e.target.value || undefined)}
                style={{
                  width: '100%',
                  border: 'none',
                  background: 'transparent',
                  color: theme.palette.text,
                  fontSize: '18px',
                  fontWeight: 600,
                  outline: 'none',
                  appearance: 'none',
                  WebkitAppearance: 'none',
                  MozAppearance: 'none',
                  padding: '6px 24px 0 0',
                  cursor: 'pointer',
                }}
              >
                <option value="">—</option>
                <option value="male">{t('profile.gender_male')}</option>
                <option value="female">{t('profile.gender_female')}</option>
              </select>
            ) : (
              <Text bold style={{ display: 'block', fontSize: '18px', paddingTop: '6px' }}>
                {formatGender(formData.gender)}
              </Text>
            )}
          </div>
        </div>

        <details style={{ marginTop: '10px' }}>
          <summary style={{ cursor: 'pointer', color: theme.palette.textMuted, fontWeight: 600, listStyle: 'none', fontSize: '14px' }}>
            {t('profile.additional')}
          </summary>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '10px' }}>
            {[
              { labelKey: 'profile.goal', value: formatGoal(formData.goal), field: 'goal' as const },
              { labelKey: 'profile.activityLevel', value: formatActivity(formData.activityLevel), field: 'activityLevel' as const },
              { labelKey: 'profile.startWeightKg', value: formData.startWeightKg, field: 'startWeightKg' as const },
              { labelKey: 'profile.targetWeightKg', value: formData.targetWeightKg, field: 'targetWeightKg' as const },
              { labelKey: 'profile.targetDate', value: formData.targetDate, field: 'targetDate' as const },
            ].map((item) => {
              const isWide = item.field === 'targetDate';
              return (
                <div
                  key={item.field}
                  style={{
                    position: 'relative',
                    borderRadius: '16px',
                    border: `1px solid ${theme.palette.border}`,
                    background: 'rgba(3, 18, 28, 0.88)',
                    padding: '12px 12px 10px',
                    minHeight: '64px',
                    gridColumn: isWide ? '1 / -1' : undefined,
                  }}
                >
                  <Text variant="small" muted style={{ position: 'absolute', top: '-9px', left: '10px', padding: '0 6px', background: 'linear-gradient(180deg, rgba(17, 49, 69, 0.98), rgba(10, 32, 46, 0.98))', fontSize: '11px' }}>
                    {t(item.labelKey)}
                  </Text>
                  {editing ? (
                    item.field === 'goal' ? (
                      <select
                        value={formData.goal || 'maintain'}
                        onChange={(e) => onChange('goal', e.target.value as ProfileData['goal'])}
                        style={{
                          width: '100%',
                          border: 'none',
                          background: 'transparent',
                          color: theme.palette.text,
                          fontSize: '18px',
                          fontWeight: 600,
                          outline: 'none',
                          appearance: 'none',
                          WebkitAppearance: 'none',
                          MozAppearance: 'none',
                          padding: '6px 24px 0 0',
                          cursor: 'pointer',
                        }}
                      >
                        <option value="lose">{t('profile.goal_lose')}</option>
                        <option value="maintain">{t('profile.goal_maintain')}</option>
                        <option value="gain">{t('profile.goal_gain')}</option>
                      </select>
                    ) : item.field === 'activityLevel' ? (
                      <select
                        value={formData.activityLevel || ''}
                        onChange={(e) => onChange('activityLevel', e.target.value || undefined)}
                        style={{
                          width: '100%',
                          border: 'none',
                          background: 'transparent',
                          color: theme.palette.text,
                          fontSize: '18px',
                          fontWeight: 600,
                          outline: 'none',
                          appearance: 'none',
                          WebkitAppearance: 'none',
                          MozAppearance: 'none',
                          padding: '6px 24px 0 0',
                          cursor: 'pointer',
                        }}
                      >
                        <option value="">—</option>
                        <option value="low">{t('profile.activityLevel_low')}</option>
                        <option value="medium">{t('profile.activityLevel_medium')}</option>
                        <option value="high">{t('profile.activityLevel_high')}</option>
                        <option value="very_high">{t('profile.activityLevel_very_high')}</option>
                      </select>
                    ) : item.field === 'targetDate' ? (
                      <Input
                        type="date"
                        value={formData.targetDate || ''}
                        onChange={(e) => onChange('targetDate', e.target.value || undefined)}
                        style={{ border: 'none', background: 'transparent', padding: 0, fontSize: '18px', fontWeight: 600 }}
                      />
                    ) : (
                      <Input
                        type="number"
                        value={(formData[item.field] as number | undefined) ?? ''}
                        onChange={(e) => onChange(item.field, e.target.value ? parseFloat(e.target.value) : undefined)}
                        min={30}
                        max={300}
                        step={0.1}
                        style={{ border: 'none', background: 'transparent', padding: 0, fontSize: '18px', fontWeight: 600 }}
                      />
                    )
                  ) : (
                    <Text bold style={{ display: 'block', fontSize: '18px', paddingTop: '6px' }}>
                      {item.value ?? '—'}
                    </Text>
                  )}
                </div>
              );
            })}
          </div>
        </details>

        {editing && (
          <Button
            type="submit"
            disabled={saving}
            style={{
              height: '52px',
              borderRadius: '18px',
              background: 'linear-gradient(180deg, rgba(83,212,107,1), rgba(60,170,82,1))',
              color: '#07210f',
              boxShadow: '0 18px 30px rgba(83, 212, 107, 0.24)',
              marginTop: '2px',
            }}
          >
            {saving ? t('common.saving') : t('profile.save')}
          </Button>
        )}
      </form>
    </Card>
  );
}
