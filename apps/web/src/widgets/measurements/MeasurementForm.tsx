import { useState } from 'react';
import { apiClient } from '../../api/client';
import { useTheme } from '../../theme/useTheme';
import { Text } from '../../ui/Text';
import { measurementCardStyle, MEASUREMENT_ROWS, MeasurementKey } from './shared';

interface MeasurementFormProps {
  onSaved: () => void;
  onCancel: () => void;
}

export function MeasurementForm({ onSaved, onCancel }: MeasurementFormProps) {
  const theme = useTheme();
  const now = new Date();
  const [date, setDate] = useState(
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`,
  );
  const [form, setForm] = useState<Record<MeasurementKey, string>>({
    waistCm: '',
    hipsCm: '',
    chestCm: '',
    bicepCm: '',
    thighCm: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasAnyValue = Object.values(form).some((v) => v.trim() !== '');

  const inputStyle: React.CSSProperties = {
    width: '100%',
    boxSizing: 'border-box',
    height: '42px',
    padding: '0 12px',
    borderRadius: '13px',
    border: '1px solid rgba(160, 200, 220, 0.18)',
    background: 'rgba(255, 255, 255, 0.06)',
    color: theme.palette.text,
    fontSize: '14px',
    outline: 'none',
    fontFamily: 'inherit',
  };

  const handleSave = async () => {
    if (!hasAnyValue) return;
    setSaving(true);
    setError(null);
    const data: Record<string, any> = { date };
    for (const row of MEASUREMENT_ROWS) {
      if (form[row.key].trim()) data[row.key] = parseFloat(form[row.key]);
    }
    try {
      await apiClient.post('/measurements', data);
      onSaved();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Не удалось сохранить');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ ...measurementCardStyle, border: `1px solid ${theme.palette.primary}55` }}>
      <Text variant="h2" bold style={{ display: 'block', fontSize: '16px', marginBottom: '10px' }}>
        Добавить замеры
      </Text>

      <Text variant="small" muted style={{ display: 'block', marginBottom: '4px', fontSize: '11px' }}>Дата</Text>
      <input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        style={{ ...inputStyle, marginBottom: '10px', colorScheme: 'dark' }}
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
        {MEASUREMENT_ROWS.map((row) => (
          <label key={row.key}>
            <Text variant="small" muted style={{ display: 'block', marginBottom: '4px', fontSize: '11px' }}>
              {row.label} ({row.unit})
            </Text>
            <input
              type="number"
              step="0.1"
              min="0"
              placeholder="—"
              value={form[row.key]}
              onChange={(e) => setForm({ ...form, [row.key]: e.target.value })}
              style={inputStyle}
            />
          </label>
        ))}
      </div>

      {error && (
        <Text variant="small" style={{ display: 'block', color: '#ff8a8a', marginTop: '8px' }}>
          {error}
        </Text>
      )}

      <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
        <button
          type="button"
          onClick={onCancel}
          style={{
            flex: 1,
            height: '44px',
            borderRadius: '14px',
            border: '1px solid rgba(160, 200, 220, 0.24)',
            background: 'rgba(255,255,255,0.06)',
            color: theme.palette.text,
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          Отмена
        </button>
        <button
          type="button"
          disabled={!hasAnyValue || saving}
          onClick={handleSave}
          style={{
            flex: 2,
            height: '44px',
            borderRadius: '14px',
            border: 'none',
            background: hasAnyValue
              ? 'linear-gradient(180deg, rgba(83, 212, 107, 1), rgba(60, 170, 82, 1))'
              : 'rgba(255,255,255,0.08)',
            color: hasAnyValue ? '#07210f' : theme.palette.textMuted,
            fontSize: '13px',
            fontWeight: 700,
            cursor: hasAnyValue ? 'pointer' : 'default',
            boxShadow: hasAnyValue ? '0 14px 26px rgba(83, 212, 107, 0.22)' : 'none',
            opacity: saving ? 0.6 : 1,
            fontFamily: 'inherit',
          }}
        >
          Сохранить
        </button>
      </div>
    </div>
  );
}
