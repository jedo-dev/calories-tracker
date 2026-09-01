import type { CSSProperties, FormEvent } from 'react';
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
  /** Показать поле веса (только для первичной инициализации, когда записи в журнале ещё нет). */
  showWeightField?: boolean;
  /** Обязательные поля, не заполненные при попытке сохранения, — подсвечиваются красным. */
  invalidFields?: (keyof ProfileData)[];
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  onChange: (field: keyof ProfileData, value: any) => void;
}

type BodyField = {
  labelKey: string;
  field: keyof ProfileData;
  type: 'number';
  min: number;
  max: number;
  step: number;
};

// Текущий вес редактируется во вкладке «Вес» (/weight) и в обычном режиме здесь
// не дублируется. Поле веса добавляется только при первичной инициализации.
const weightField: BodyField = { labelKey: 'profile.weight', field: 'weightKg', type: 'number', min: 30, max: 300, step: 0.1 };
const baseFields: BodyField[] = [
  { labelKey: 'profile.height', field: 'heightCm', type: 'number', min: 120, max: 230, step: 1 },
  { labelKey: 'profile.age', field: 'age', type: 'number', min: 10, max: 100, step: 1 },
];

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

function fieldShell(editing: boolean, theme: ReturnType<typeof useTheme>, invalid?: boolean) {
  return {
    position: 'relative' as const,
    borderRadius: '16px',
    border: editing
      ? `1px solid ${invalid ? 'rgba(255, 106, 106, 0.85)' : theme.palette.border}`
      : '1px solid transparent',
    background: editing ? 'rgba(3, 18, 28, 0.88)' : 'transparent',
    padding: editing ? '12px 12px 10px' : '0',
    minHeight: editing ? '64px' : 'auto',
  } as CSSProperties;
}

function fieldLabel(editing: boolean) {
  return {
    position: editing ? 'absolute' : 'static',
    top: editing ? '-9px' : undefined,
    left: editing ? '10px' : undefined,
    padding: editing ? '0 6px' : '0',
    background: editing ? 'linear-gradient(180deg, rgba(17, 49, 69, 0.98), rgba(10, 32, 46, 0.98))' : 'transparent',
    fontSize: '11px',
    display: 'inline-block',
    marginBottom: editing ? 0 : '4px',
  } as CSSProperties;
}

export function ProfileBodyCard({ formData, editing, saving, showWeightField, invalidFields, onSubmit, onChange }: ProfileBodyCardProps) {
  const theme = useTheme();
  const bodyFields = showWeightField ? [weightField, ...baseFields] : baseFields;
  const isInvalid = (field: keyof ProfileData) => !!invalidFields?.includes(field);

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
        <div style={{ marginBottom: '10px' }}>
          <Text variant="h2" bold style={{ display: 'block', fontSize: '20px' }}>
            {t('profile.bodyTitle')}
          </Text>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          {bodyFields.map((field) => {
            const value = formData[field.field];
            return (
              <div key={field.field} style={fieldShell(editing, theme, isInvalid(field.field))}>
                <Text variant="small" muted style={fieldLabel(editing)}>
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
                      padding: '4px 0 0',
                      fontSize: '18px',
                      fontWeight: 600,
                    }}
                  />
                ) : (
                  <Text bold style={{ display: 'block', fontSize: '16px', paddingTop: '0' }}>
                    {value ?? '—'}
                  </Text>
                )}
              </div>
            );
          })}

          <div style={fieldShell(editing, theme, isInvalid('gender'))}>
            <Text variant="small" muted style={fieldLabel(editing)}>
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
                  padding: '4px 24px 0 0',
                  cursor: 'pointer',
                }}
              >
                <option value="">—</option>
                <option value="male">{t('profile.gender_male')}</option>
                <option value="female">{t('profile.gender_female')}</option>
              </select>
            ) : (
              <Text bold style={{ display: 'block', fontSize: '16px', paddingTop: '0' }}>
                {formatGender(formData.gender)}
              </Text>
            )}
          </div>

        </div>

        <div style={{ marginTop: '10px' }}>
       
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {[
              { labelKey: 'profile.goal', value: formatGoal(formData.goal), field: 'goal' as const },
              { labelKey: 'profile.activityLevel', value: formatActivity(formData.activityLevel), field: 'activityLevel' as const },
              // На инициализации стартовый вес = введённому весу, отдельное поле не дублируем.
              ...(showWeightField
                ? []
                : [{ labelKey: 'profile.startWeightKg', value: formData.startWeightKg, field: 'startWeightKg' as const }]),
              { labelKey: 'profile.targetWeightKg', value: formData.targetWeightKg, field: 'targetWeightKg' as const },
            ].map((item) => {
              return (
                <div
                  key={item.field}
                  style={fieldShell(editing, theme, isInvalid(item.field))}
                >
                  <Text variant="small" muted style={fieldLabel(editing)}>
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
                          padding: '4px 24px 0 0',
                          cursor: 'pointer',
                        }}
                      >
                        <option value="lose">{t('profile.goal_lose')}</option>
                        <option value="maintain">{t('profile.goal_maintain')}</option>
                        <option value="gain">{t('profile.goal_gain')}</option>
                      </select>
                    ) : item.field === 'activityLevel' ? (
                      <select
                        value={formData.activityLevel || 'medium'}
                        onChange={(e) => onChange('activityLevel', e.target.value as ProfileData['activityLevel'])}
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
                          padding: '4px 24px 0 0',
                          cursor: 'pointer',
                        }}
                      >
                        <option value="low">{t('profile.activityLevel_low')}</option>
                        <option value="medium">{t('profile.activityLevel_medium')}</option>
                        <option value="high">{t('profile.activityLevel_high')}</option>
                        <option value="very_high">{t('profile.activityLevel_very_high')}</option>
                      </select>
                    ) : (
                      <Input
                        type="number"
                        value={(formData[item.field] as number | undefined) ?? ''}
                        onChange={(e) => onChange(item.field, e.target.value ? parseFloat(e.target.value) : undefined)}
                        min={30}
                        max={300}
                        step={0.1}
                        style={{ border: 'none', background: 'transparent', padding: '4px 0 0', fontSize: '18px', fontWeight: 600 }}
                      />
                    )
                  ) : (
                    <Text bold style={{ display: 'block', fontSize: '16px', paddingTop: '0' }}>
                      {item.value ?? '—'}
                    </Text>
                  )}
                </div>
              );
            })}
          </div>
        </div>

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
              marginTop: '12px',
            }}
          >
            {saving ? t('common.saving') : t('profile.save')}
          </Button>
        )}
      </form>
    </Card>
  );
}
