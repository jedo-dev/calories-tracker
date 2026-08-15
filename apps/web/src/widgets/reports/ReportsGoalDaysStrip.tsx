import { Text } from '../../ui/Text';
import { t } from '../../i18n';
import type { ReportDay } from './types';
import { getDayNumberLabel, getWeekdayLabel } from './utils';

interface ReportsGoalDaysStripProps {
  days: ReportDay[];
  goal: number | null;
}

type DayStatus = 'empty' | 'inGoal' | 'over' | 'low';

// Полоска «дни в цели»: качество периода одним взглядом. Среднее по неделе
// маскирует пропуски и срывы — эта полоска их показывает.
function dayStatus(day: ReportDay, goal: number): DayStatus {
  if (day.entries.length === 0) return 'empty';
  const kcal = day.entries.reduce((sum, entry) => sum + (entry.kcal || 0), 0);
  if (kcal > goal * 1.1) return 'over';
  // Меньше 60% нормы — скорее недозаполненный дневник, чем «в цели»
  if (kcal < goal * 0.6) return 'low';
  return 'inGoal';
}

const STATUS_COLOR: Record<DayStatus, string> = {
  inGoal: 'rgba(83, 212, 107, 0.9)',
  over: 'rgba(255, 122, 122, 0.85)',
  low: 'rgba(255, 214, 102, 0.8)',
  empty: 'rgba(160, 200, 220, 0.16)',
};

export function ReportsGoalDaysStrip({ days, goal }: ReportsGoalDaysStripProps) {
  if (goal == null || days.length === 0) return null;

  const statuses = days.map((day) => dayStatus(day, goal));
  const inGoalCount = statuses.filter((s) => s === 'inGoal').length;
  const trackedCount = statuses.filter((s) => s !== 'empty').length;
  const isLong = days.length > 8;

  return (
    <div
      style={{
        borderRadius: '20px',
        padding: '16px 18px',
        background: 'linear-gradient(180deg, rgba(14, 40, 61, 0.96), rgba(13, 32, 51, 0.96))',
        border: '1px solid rgba(114, 163, 194, 0.18)',
        boxShadow: '0 12px 28px rgba(0, 0, 0, 0.18)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '12px' }}>
        <Text bold style={{ fontSize: '20px', letterSpacing: '-0.03em' }}>
          {t('report.goalDaysTitle')}
        </Text>
        <Text muted style={{ fontSize: '15px' }}>
          {t('report.goalDaysOf', { n: inGoalCount, m: Math.max(trackedCount, 1) })}
        </Text>
      </div>

      <div style={{ display: 'flex', gap: isLong ? '3px' : '6px' }}>
        {days.map((day, index) => (
          <div key={day.date} style={{ flex: 1, minWidth: 0, textAlign: 'center' }}>
            <div
              title={day.date}
              style={{
                height: '26px',
                borderRadius: '7px',
                background: STATUS_COLOR[statuses[index]],
              }}
            />
            {(!isLong || index % Math.ceil(days.length / 6) === 0 || index === days.length - 1) && (
              <Text muted style={{ fontSize: isLong ? '9px' : '11px', display: 'block', marginTop: '4px' }}>
                {isLong ? getDayNumberLabel(day.date) : getWeekdayLabel(day.date)}
              </Text>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
