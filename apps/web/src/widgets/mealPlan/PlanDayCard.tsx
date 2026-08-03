import { useTheme } from '../../theme/useTheme';
import { Text } from '../../ui/Text';
import { planCardStyle, formatDateRu, MealPlan, PlanDay } from './types';

export function PlanDayCard({ plan, day }: { plan: MealPlan; day: PlanDay }) {
  const theme = useTheme();
  const kcalRatio = plan.settings.kcalTarget > 0 ? day.totalKcal / plan.settings.kcalTarget : 0;
  const overTarget = day.totalKcal > plan.settings.kcalTarget * 1.1;

  const stat = (value: string, label: string, accent = false) => (
    <div
      style={{
        textAlign: 'center',
        padding: '9px 4px',
        borderRadius: '13px',
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      <span
        style={{
          fontSize: '16px',
          fontWeight: 800,
          color: accent ? theme.palette.primary : theme.palette.text,
          display: 'block',
          whiteSpace: 'nowrap',
        }}
      >
        {value}
      </span>
      <Text variant="small" muted style={{ fontSize: '10px' }}>{label}</Text>
    </div>
  );

  return (
    <div style={planCardStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <Text bold style={{ fontSize: '15px' }}>{formatDateRu(day.date)}</Text>
        <span
          style={{
            fontSize: '11px',
            padding: '4px 10px',
            borderRadius: '11px',
            background: 'rgba(83,212,107,0.16)',
            color: theme.palette.primary,
            fontWeight: 800,
          }}
        >
          Скор {plan.score}%
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '6px', marginBottom: '10px' }}>
        {stat(`${Math.round(day.totalKcal)}`, `из ${plan.settings.kcalTarget} ккал`, true)}
        {stat(`${Math.round(day.totalProtein)}г`, 'белки')}
        {stat(`${Math.round(day.totalFat)}г`, 'жиры')}
        {stat(`${Math.round(day.totalCarb)}г`, 'углеводы')}
      </div>

      <div style={{ height: '8px', borderRadius: '4px', background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
        <div
          style={{
            width: `${Math.min(100, kcalRatio * 100)}%`,
            height: '100%',
            borderRadius: '4px',
            background: overTarget
              ? 'linear-gradient(90deg, #ff8a6b, #ff6e6e)'
              : `linear-gradient(90deg, #3caa52, ${theme.palette.primary})`,
            transition: 'width 0.4s ease',
          }}
        />
      </div>
    </div>
  );
}
