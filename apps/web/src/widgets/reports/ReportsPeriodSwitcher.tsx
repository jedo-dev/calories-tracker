import { useTheme } from '../../theme/useTheme';
import { Text } from '../../ui/Text';
import type { ReportPeriod } from './types';

interface ReportsPeriodSwitcherProps {
  period: ReportPeriod;
  onChange: (period: ReportPeriod) => void;
}

export function ReportsPeriodSwitcher({ period, onChange }: ReportsPeriodSwitcherProps) {
  const theme = useTheme();

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '4px',
        padding: '4px',
        borderRadius: '20px',
        background: 'rgba(14, 37, 56, 0.75)',
        border: '1px solid rgba(116, 160, 190, 0.18)',
        boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.03)',
      }}
    >
      {(['week', 'month'] as const).map((item) => {
        const active = period === item;

        return (
          <button
            key={item}
            type="button"
            onClick={() => onChange(item)}
            style={{
              width: '100%',
              minHeight: '54px',
              border: 'none',
              borderRadius: '16px',
              background: active
                ? 'linear-gradient(180deg, rgba(111, 220, 114, 0.95), rgba(78, 198, 94, 0.95))'
                : 'transparent',
              color: active ? '#ffffff' : theme.palette.textMuted,
              cursor: 'pointer',
              display: 'grid',
              placeItems: 'center',
            }}
          >
            <Text
              bold
              style={{
                color: active ? '#ffffff' : theme.palette.textMuted,
                fontSize: '18px',
              }}
            >
              {item === 'week' ? 'Неделя' : 'Месяц'}
            </Text>
          </button>
        );
      })}
    </div>
  );
}
