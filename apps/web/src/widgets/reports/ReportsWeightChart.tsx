import { useMemo } from 'react';
import { Text } from '../../ui/Text';
import type { ReportDay } from './types';
import { extractWeights, getDayNumberLabel, getWeekdayLabel, round1 } from './utils';

interface ReportsWeightChartProps {
  days: ReportDay[];
}

function createLinePath(points: Array<{ x: number; y: number }>): string {
  if (points.length === 0) return '';
  return points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
    .join(' ');
}

export function ReportsWeightChart({ days }: ReportsWeightChartProps) {
  const weights = extractWeights(days);

  const chart = useMemo(() => {
    if (weights.length === 0) return null;

    const values = weights.map((item) => item.weight);
    const maxValue = Math.max(...values);
    const minValue = Math.min(...values);
    const roundedTop = Math.round(maxValue);
    const roundedBottom = maxValue - minValue > 3 ? Math.floor(minValue) : roundedTop - 3;
    const lineStep = Math.max(1, Math.ceil((Math.max(roundedTop, roundedBottom + 3) - roundedBottom) / 3));
    const domainBottom = roundedBottom;
    const domainTop = domainBottom + lineStep * 3;
    const height = 190;
    const width = 320;
    const leftPad = 40;
    const rightPad = 16;
    const plotWidth = width - leftPad - rightPad;
    const plotHeight = height - 28;
    const yToPx = (value: number) => {
      const ratio = (value - domainBottom) / (domainTop - domainBottom);
      return 12 + plotHeight - ratio * plotHeight;
    };

    const linePoints = days
      .map((day, index) => {
        if (day.weight == null) return null;
        const x = leftPad + (days.length === 1 ? plotWidth / 2 : (index / (days.length - 1)) * plotWidth);
        const y = yToPx(day.weight);
        return { x, y, value: day.weight, date: day.date };
      })
      .filter((item): item is { x: number; y: number; value: number; date: string } => item !== null);

    const lines = Array.from({ length: 4 }, (_, index) => domainTop - index * lineStep);
    const areaPath = linePoints.length > 1
      ? `${createLinePath(linePoints)} L ${linePoints[linePoints.length - 1].x} ${height - 20} L ${linePoints[0].x} ${height - 20} Z`
      : '';

    return {
      width,
      height,
      leftPad,
      rightPad,
      plotWidth,
      domainTop,
      domainBottom,
      linePoints,
      lines,
      areaPath,
      yToPx,
    };
  }, [days, weights.length]);

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
          Динамика веса
        </Text>
        <Text muted style={{ fontSize: '20px', lineHeight: '1.1' }}>
          кг
        </Text>
      </div>

      {!chart || chart.linePoints.length === 0 ? (
        <Text muted style={{ display: 'block', padding: '16px 0 8px' }}>
          Нет данных по весу за период
        </Text>
      ) : (
        <div style={{ width: '100%' }}>
          <svg
            viewBox={`0 0 ${chart.width} ${chart.height}`}
            width="100%"
            height="190"
            preserveAspectRatio="none"
            style={{ display: 'block' }}
          >
            <defs>
              <linearGradient id="weightLineFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6ee77a" stopOpacity="0.32" />
                <stop offset="100%" stopColor="#6ee77a" stopOpacity="0.02" />
              </linearGradient>
              <linearGradient id="weightLineStroke" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#7de07a" />
                <stop offset="100%" stopColor="#53d46b" />
              </linearGradient>
            </defs>

            {chart.lines.map((value) => {
              const y = chart.yToPx(value);
              return (
                <g key={value}>
                  <line
                    x1={chart.leftPad}
                    x2={chart.width - chart.rightPad}
                    y1={y}
                    y2={y}
                    stroke="rgba(255, 255, 255, 0.18)"
                    strokeDasharray="4 6"
                  />
                  <text x="0" y={y + 5} fill="rgba(255, 255, 255, 0.82)" fontSize="13">
                    {value} кг
                  </text>
                </g>
              );
            })}

            <line
              x1={chart.leftPad}
              x2={chart.width - chart.rightPad}
              y1={chart.height - 20}
              y2={chart.height - 20}
              stroke="rgba(255, 255, 255, 0.28)"
            />

            {chart.areaPath && <path d={chart.areaPath} fill="url(#weightLineFill)" />}

            <path
              d={createLinePath(chart.linePoints)}
              fill="none"
              stroke="url(#weightLineStroke)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {chart.linePoints.map((point, index) => (
              <circle key={`${point.date}-${index}`} cx={point.x} cy={point.y} r="5.5" fill="#7ee07c" />
            ))}

            {days.map((day, index) => {
              const isLong = days.length > 8;
              const labelStep = isLong ? Math.ceil(days.length / 6) : 1;
              const isLast = index === days.length - 1;
              const showLabel = isLast || (index % labelStep === 0 && days.length - 1 - index >= labelStep / 2);
              if (!showLabel) return null;
              const x = chart.leftPad + (days.length === 1 ? chart.plotWidth / 2 : (index / (days.length - 1)) * chart.plotWidth);
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

            {chart.linePoints.length > 0 && (
              <text
                x={chart.linePoints[chart.linePoints.length - 1].x + 10}
                y={chart.linePoints[chart.linePoints.length - 1].y + 6}
                fill="#7ee07c"
                fontSize="14"
                fontWeight="700"
              >
                {round1(chart.linePoints[chart.linePoints.length - 1].value)} кг
              </text>
            )}
          </svg>
        </div>
      )}
    </div>
  );
}
