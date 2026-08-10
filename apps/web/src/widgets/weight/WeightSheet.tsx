import { useEffect, useState } from 'react';
import { formatDate, t } from '../../i18n';
import { useTheme } from '../../theme/useTheme';
import { BottomSheet } from '../../ui/BottomSheet';
import { Text } from '../../ui/Text';
import { WeightRuler } from './WeightRuler';

interface WeightSheetProps {
  isOpen: boolean;
  onClose: () => void;
  /** Заголовок листа. По умолчанию «Добавить вес». */
  title?: string;
  /** Предзаполненное значение (последний записанный / редактируемый вес). */
  initialWeight: number;
  /** Дата записи (YYYY-MM-DD) — только для показа, менять нельзя. */
  date: string;
  min?: number;
  max?: number;
  saving?: boolean;
  error?: string | null;
  onConfirm: (date: string, weightKg: number) => void;
}

export function WeightSheet({
  isOpen,
  onClose,
  title,
  initialWeight,
  date,
  min = 20,
  max = 300,
  saving,
  error,
  onConfirm,
}: WeightSheetProps) {
  const theme = useTheme();
  const [weight, setWeight] = useState(initialWeight);

  // Сброс к предзаполненному значению при каждом открытии.
  useEffect(() => {
    if (isOpen) setWeight(initialWeight);
  }, [isOpen, initialWeight]);

  const whole = Math.floor(weight);
  const decimal = Math.round((weight - whole) * 10);

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} handle={<div style={{ height: 8 }} />}>
      <div style={{ padding: '4px 16px 28px', maxWidth: '520px', margin: '0 auto' }}>
        {/* Шапка: дата (только показ) + закрыть */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
          <span style={{ width: 32 }} />
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '6px 14px',
              borderRadius: '12px',
              border: '1px solid rgba(160, 200, 220, 0.2)',
              background: 'rgba(255,255,255,0.05)',
              color: theme.palette.text,
              fontSize: '14px',
              fontWeight: 700,
            }}
          >
            {formatDate(date)}
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('common.cancel')}
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              border: 'none',
              background: 'rgba(255,255,255,0.06)',
              color: theme.palette.textMuted,
              fontSize: '18px',
              lineHeight: 1,
              cursor: 'pointer',
            }}
          >
            ✕
          </button>
        </div>

        <Text
          variant="small"
          muted
          style={{ display: 'block', textAlign: 'center', fontSize: '13px', marginBottom: '6px' }}
        >
          {title ?? t('weight.addWeight')}
        </Text>

        {/* Крупное значение */}
        <div style={{ textAlign: 'center', marginBottom: '4px' }}>
          <span style={{ fontSize: '64px', fontWeight: 800, color: theme.palette.primary, lineHeight: 1.05 }}>
            {whole}
            <span style={{ fontSize: '40px' }}>.{decimal}</span>
          </span>
        </div>
        <Text
          bold
          style={{ display: 'block', textAlign: 'center', color: theme.palette.primary, fontSize: '16px', marginBottom: '14px' }}
        >
          {t('weight.kg')}
        </Text>

        <WeightRuler value={weight} onChange={setWeight} min={min} max={max} />

        <Text
          variant="small"
          muted
          style={{ display: 'block', textAlign: 'center', fontSize: '12px', margin: '10px 0 4px', lineHeight: 1.4 }}
        >
          {t('weight.dragHint')}
        </Text>

        {error && (
          <Text variant="small" style={{ display: 'block', textAlign: 'center', color: '#ff8a8a', marginBottom: '8px' }}>
            {error}
          </Text>
        )}

        <button
          type="button"
          disabled={saving}
          onClick={() => onConfirm(date, Math.round(weight * 10) / 10)}
          style={{
            width: '100%',
            height: '54px',
            marginTop: '10px',
            borderRadius: '18px',
            border: 'none',
            background: 'linear-gradient(180deg, rgba(83, 212, 107, 1), rgba(60, 170, 82, 1))',
            color: '#07210f',
            fontSize: '16px',
            fontWeight: 800,
            cursor: saving ? 'default' : 'pointer',
            opacity: saving ? 0.7 : 1,
            boxShadow: '0 18px 30px rgba(83, 212, 107, 0.24)',
            fontFamily: 'inherit',
          }}
        >
          {saving ? t('common.saving') : t('weight.confirm')}
        </button>
      </div>
    </BottomSheet>
  );
}
