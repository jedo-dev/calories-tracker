import { useMemo } from 'react';
import { Text } from '../../ui/Text';
import { t } from '../../i18n';
import { calcWaterGoalMl } from '../water/waterGoal';
import type { ReportDay } from './types';
import { getDayNumberLabel, getWeekdayLabel } from './utils';

interface ReportsWaterChartProps {
  days: ReportDay[];
}

// Вода по дням (литры) с пунктиром дневной нормы (от последнего веса за период)
export function ReportsWaterChart({ days }: ReportsWaterChartProps) {
  const chart = useMemo(() => {
    const values = days.map((day) => day.waterMl || 0);
    const weights = days.map((d) => d.weight).filter((w): w is number => w != null);
    const goal = calcWaterGoalMl(weights.length ? weights[weights.length - 1] : null);
    const maxValue = Math.max(goal, ...values, 500);

    const width = 320;
    const height = 180;
    const leftPad = 34;
    const rightPad = 12;
    const plotWidth = width - leftPad - rightPad;
    const plotHeight = height - 34;
    const step = [500, 1000, 2000].find((s) => Math.ceil(maxValue / s) <= 4) ?? 2000;
    const top = Math.max(step, Math.ceil(maxValue / step) * step);
    const yToPx = (value: number) => 12 + plotHeight - (value / top) * plotHeight;
    const barWidth = days.length > 8 ? 8 : 24;

    const bars = values.map((value, index) => ({
      value,
      centerX: leftPad + (days.length === 1 ? plotWidth / 2 : index * (plotWidth / (days.length - 1))),
      height: Math.max(value > 0 ? 2 : 0, (value / top) * plotHeight),
    }));

    return { width, height, leftPad, rightPad, plotWidth, top, step, yToPx, bars, barWidth, goal, goalY: yToPx(goal) };
  }, [days]);

  const hasAny = chart.bars.some((b) => b.value > 0);
  if (!hasAny) return null;

  return (
    <div
      style={{
        borderRadius: '20px',
        padding: '18px 18px 14px',
        background: 'linear-gradient(180deg, rgba(14, 40, 61, 0.96), rgba(13, 32, 51, 0.96))',
        border: '1px solid rgba(114, 163, 194, 0.18)',
        boxShadow: '0 12px 28px rgba(0, 0, 0, 0.18)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '10px' }}>
        <Text bold style={{ fontSize: '24px', letterSpacing: '-0.03em' }}>
          {t('report.waterTitle')}
        </Text>
        <Text muted style={{ fontSize: '15px' }}>
          {t('report.waterGoal')}: {(chart.goal / 1000).toFixed(1)} л
        </Text>
      </div>

      <svg
        viewBox={`0 0 ${chart.width} ${chart.height}`}
        width="100%"
        height="180"
        preserveAspectRatio="none"
        style={{ display: 'block' }}
      >
        <defs>
          <linearGradient id="waterBars" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#7fd0ff" />
            <stop offset="100%" stopColor="#3f9be0" />
          </linearGradient>
        </defs>

        {Array.from({ length: chart.top / chart.step + 1 }, (_, index) => {
          const value = chart.top - index * chart.step;
          const y = chart.yToPx(value);
          return (
            <g key={value}>
              <line x1={chart.leftPad} x2={chart.width - chart.rightPad} y1={y} y2={y} stroke="rgba(255, 255, 255, 0.10)" />
              <text x="0" y={y + 5} fill="rgba(255, 255, 255, 0.82)" fontSize="13">
                {(value / 1000).toFixed(value % 1000 === 0 ? 0 : 1)}л
              </text>
            </g>
          );
        })}

        <line
          x1={chart.leftPad}
          x2={chart.width - chart.rightPad}
          y1={chart.goalY}
          y2={chart.goalY}
          stroke="#ffffff"
          strokeDasharray="6 8"
          strokeWidth="1.5"
          opacity="0.85"
        />

        {chart.bars.map((bar, index) =>
          bar.height > 0 ? (
            <rect
              key={days[index].date}
              x={bar.centerX - chart.barWidth / 2}
              y={chart.height - 20 - bar.height}
              width={chart.barWidth}
              height={bar.height}
              rx="3"
              fill="url(#waterBars)"
            />
          ) : null,
        )}

        {days.map((day, index) => {
          const isLong = days.length > 8;
          const labelStep = isLong ? Math.ceil(days.length / 6) : 1;
          const isLast = index === days.length - 1;
          const showLabel = isLast || (index % labelStep === 0 && days.length - 1 - index >= labelStep / 2);
          if (!showLabel) return null;
          const x = chart.leftPad + (days.length === 1 ? chart.plotWidth / 2 : index * (chart.plotWidth / (days.length - 1)));
          return (
            <text key={day.date} x={x} y={chart.height - 1} fill="rgba(255, 255, 255, 0.84)" fontSize="13" textAnchor="middle">
              {isLong ? getDayNumberLabel(day.date) : getWeekdayLabel(day.date)}
            </text>
          );
        })}
      </svg>
    </div>
  );
}
