import { useMemo } from 'react';
import { Text } from '../../ui/Text';
import type { ReportDay } from './types';
import { getDayNumberLabel, getWeekdayLabel } from './utils';

interface ReportsCaloriesChartProps {
  days: ReportDay[];
  goal: number | null;
}

export function ReportsCaloriesChart({ days, goal }: ReportsCaloriesChartProps) {
  const chart = useMemo(() => {
    const values = days.map((day) => day.entries.reduce((sum, entry) => sum + (entry.kcal || 0), 0));
    const maxValue = Math.max(goal ?? 0, ...values, 0);
    const stepCandidates = [50, 100, 200, 250, 500, 1000, 2000];
    const step = stepCandidates.find((candidate) => Math.ceil(maxValue / candidate) <= 5) ?? 2000;
    const top = Math.max(step, Math.ceil(maxValue / step) * step);
    const width = 320;
    const height = 208;
    const leftPad = 40;
    const rightPad = 12;
    const plotWidth = width - leftPad - rightPad;
    const plotHeight = height - 34;
    const yToPx = (value: number) => 12 + plotHeight - (value / top) * plotHeight;
    const bars = values.map((value, index) => {
      const barWidth = 24;
      const gap = days.length > 1 ? plotWidth / (days.length - 1) : 0;
      const centerX = leftPad + (days.length === 1 ? plotWidth / 2 : index * gap);
      return {
        value,
        x: centerX - barWidth / 2,
        width: barWidth,
        height: Math.max(2, (value / top) * plotHeight),
        centerX,
      };
    });
    const targetY = goal != null ? yToPx(goal) : null;

    return {
      width,
      height,
      leftPad,
      rightPad,
      plotWidth,
      top,
      step,
      bars,
      targetY,
      yToPx,
    };
  }, [days, goal]);

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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
        <Text bold style={{ fontSize: '24px', letterSpacing: '-0.03em' }}>
          Калории по дням
        </Text>
        {goal != null && (
          <Text muted style={{ fontSize: '18px', lineHeight: '1.2', textAlign: 'right' }}>
            цель: {Math.round(goal)} ккал
          </Text>
        )}
      </div>

      <div style={{ width: '100%' }}>
        <svg
          viewBox={`0 0 ${chart.width} ${chart.height}`}
          width="100%"
          height="208"
          preserveAspectRatio="none"
          style={{ display: 'block' }}
        >
          <defs>
            <linearGradient id="caloriesBars" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#7be67c" />
              <stop offset="100%" stopColor="#49c35e" />
            </linearGradient>
          </defs>

          {Array.from({ length: chart.top / chart.step + 1 }, (_, index) => {
            const value = chart.top - index * chart.step;
            const y = chart.yToPx(value);

            return (
              <g key={value}>
                <line
                  x1={chart.leftPad}
                  x2={chart.width - chart.rightPad}
                  y1={y}
                  y2={y}
                  stroke="rgba(255, 255, 255, 0.10)"
                />
                <text x="0" y={y + 5} fill="rgba(255, 255, 255, 0.82)" fontSize="13">
                  {Math.round(value)}
                </text>
              </g>
            );
          })}

          {chart.targetY != null && (
            <line
              x1={chart.leftPad}
              x2={chart.width - chart.rightPad}
              y1={chart.targetY}
              y2={chart.targetY}
              stroke="#ffffff"
              strokeDasharray="6 8"
              strokeWidth="1.5"
              opacity="0.85"
            />
          )}

          {chart.bars.map((bar, index) => {
            const x = bar.centerX - 12;
            const y = chart.height - 20 - bar.height;

            return (
              <rect
                key={`${days[index].date}-${index}`}
                x={x}
                y={y}
                width="24"
                height={bar.height}
                rx="4"
                fill="url(#caloriesBars)"
              />
            );
          })}

          {days.map((day, index) => {
            const isLong = days.length > 8;
            const labelStep = isLong ? Math.ceil(days.length / 6) : 1;
            const isLast = index === days.length - 1;
            const showLabel = isLast || (index % labelStep === 0 && days.length - 1 - index >= labelStep / 2);
            if (!showLabel) return null;
            const x = chart.leftPad + (days.length === 1 ? chart.plotWidth / 2 : index * (chart.plotWidth / (days.length - 1)));
            return (
              <text
                key={day.date}
                x={x}
                y={chart.height - 1}
                fill="rgba(255, 255, 255, 0.84)"
                fontSize="13"
                textAnchor="middle"
              >
                {isLong ? getDayNumberLabel(day.date) : getWeekdayLabel(day.date)}
              </text>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
