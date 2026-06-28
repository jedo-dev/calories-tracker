import { useMemo } from 'react';
import { Text } from '../../ui/Text';
import type { ReportDay } from './types';
import { getWeekdayLabel } from './utils';

interface ReportsCaloriesChartProps {
  days: ReportDay[];
  goal: number;
}

export function ReportsCaloriesChart({ days, goal }: ReportsCaloriesChartProps) {
  const chart = useMemo(() => {
    const values = days.map((day) => day.entries.reduce((sum, entry) => sum + (entry.kcal || 0), 0));
    const maxValue = Math.max(goal, ...values, 0);
    const step = maxValue > 500 ? 200 : maxValue > 250 ? 100 : 50;
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
    const targetY = yToPx(goal);

    return {
      width,
      height,
      leftPad,
      rightPad,
      plotWidth,
      top,
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
        <Text muted style={{ fontSize: '18px', lineHeight: '1.2', textAlign: 'right' }}>
          цель: {goal} ккал
        </Text>
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

          {Array.from({ length: chart.top / (chart.top > 500 ? 200 : chart.top > 250 ? 100 : 50) + 1 }, (_, index) => {
            const step = chart.top > 500 ? 200 : chart.top > 250 ? 100 : 50;
            const value = chart.top - index * step;
            const y = chart.yToPx(value);

            return (
              <g key={value}>
                <line
                  x1={chart.leftPad}
                  x2={chart.width - chart.rightPad}
                  y1={y}
                  y2={y}
                  stroke={index === 2 ? 'rgba(255, 255, 255, 0.36)' : 'rgba(255, 255, 255, 0.10)'}
                  strokeDasharray={index === 2 ? '6 8' : undefined}
                />
                <text x="0" y={y + 5} fill="rgba(255, 255, 255, 0.82)" fontSize="13">
                  {Math.round(value)}
                </text>
              </g>
            );
          })}

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
            const showLabel = days.length <= 8 || index % 2 === 0 || index === days.length - 1;
            const x = chart.leftPad + (days.length === 1 ? chart.plotWidth / 2 : index * (chart.plotWidth / (days.length - 1)));
            return (
              <text
                key={day.date}
                x={x}
                y={chart.height - 1}
                fill="rgba(255, 255, 255, 0.84)"
                fontSize="13"
                textAnchor="middle"
                opacity={showLabel ? 1 : 0.35}
              >
                {showLabel ? getWeekdayLabel(day.date) : ''}
              </text>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
