import { useMemo } from 'react';
import { Text } from '../../ui/Text';
import { t } from '../../i18n';
import type { ReportDay } from './types';
import { getDayNumberLabel, getWeekdayLabel } from './utils';

interface ReportsMacrosChartProps {
  days: ReportDay[];
}

const MACROS = [
  { key: 'protein' as const, color: '#6FB5FF', labelKey: 'dashboard.protein' },
  { key: 'fat' as const, color: '#FFD666', labelKey: 'dashboard.fat' },
  { key: 'carb' as const, color: '#7BD98A', labelKey: 'dashboard.carb' },
];

// БЖУ по дням: стековые столбики в граммах + средние за день в легенде
export function ReportsMacrosChart({ days }: ReportsMacrosChartProps) {
  const chart = useMemo(() => {
    const perDay = days.map((day) => ({
      protein: day.entries.reduce((sum, e) => sum + (e.protein || 0), 0),
      fat: day.entries.reduce((sum, e) => sum + (e.fat || 0), 0),
      carb: day.entries.reduce((sum, e) => sum + (e.carb || 0), 0),
    }));
    const totals = perDay.map((d) => d.protein + d.fat + d.carb);
    const maxValue = Math.max(...totals, 1);
    const trackedDays = totals.filter((v) => v > 0).length || 1;
    const avg = {
      protein: Math.round(perDay.reduce((s, d) => s + d.protein, 0) / trackedDays),
      fat: Math.round(perDay.reduce((s, d) => s + d.fat, 0) / trackedDays),
      carb: Math.round(perDay.reduce((s, d) => s + d.carb, 0) / trackedDays),
    };

    const width = 320;
    const height = 190;
    const leftPad = 34;
    const rightPad = 12;
    const plotWidth = width - leftPad - rightPad;
    const plotHeight = height - 34;
    const step = [25, 50, 100, 150, 200, 300].find((s) => Math.ceil(maxValue / s) <= 4) ?? 300;
    const top = Math.max(step, Math.ceil(maxValue / step) * step);
    const yToPx = (value: number) => 12 + plotHeight - (value / top) * plotHeight;
    const barWidth = days.length > 8 ? 8 : 24;

    const bars = perDay.map((d, index) => {
      const centerX = leftPad + (days.length === 1 ? plotWidth / 2 : index * (plotWidth / (days.length - 1)));
      // Сегменты снизу вверх: белки, жиры, углеводы
      let cursor = height - 20;
      const segments = MACROS.map((m) => {
        const h = (d[m.key] / top) * plotHeight;
        cursor -= h;
        return { color: m.color, y: cursor, height: h };
      });
      return { centerX, segments };
    });

    return { width, height, leftPad, rightPad, plotWidth, top, step, yToPx, bars, barWidth, avg };
  }, [days]);

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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '6px' }}>
        <Text bold style={{ fontSize: '24px', letterSpacing: '-0.03em' }}>
          {t('report.macrosTitle')}
        </Text>
        <Text muted style={{ fontSize: '13px' }}>{t('report.macrosAvg')}</Text>
      </div>

      <div style={{ display: 'flex', gap: '14px', marginBottom: '10px', flexWrap: 'wrap' }}>
        {MACROS.map((m) => (
          <span key={m.key} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'rgba(255,255,255,0.85)' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: m.color }} />
            {t(m.labelKey)}: {chart.avg[m.key]} {t('report.grams')}
          </span>
        ))}
      </div>

      <svg
        viewBox={`0 0 ${chart.width} ${chart.height}`}
        width="100%"
        height="190"
        preserveAspectRatio="none"
        style={{ display: 'block' }}
      >
        {Array.from({ length: chart.top / chart.step + 1 }, (_, index) => {
          const value = chart.top - index * chart.step;
          const y = chart.yToPx(value);
          return (
            <g key={value}>
              <line x1={chart.leftPad} x2={chart.width - chart.rightPad} y1={y} y2={y} stroke="rgba(255, 255, 255, 0.10)" />
              <text x="0" y={y + 5} fill="rgba(255, 255, 255, 0.82)" fontSize="13">
                {value}
              </text>
            </g>
          );
        })}

        {chart.bars.map((bar, index) => (
          <g key={days[index].date}>
            {bar.segments.map((seg, i) =>
              seg.height > 0 ? (
                <rect
                  key={i}
                  x={bar.centerX - chart.barWidth / 2}
                  y={seg.y}
                  width={chart.barWidth}
                  height={seg.height}
                  rx="2"
                  fill={seg.color}
                />
              ) : null,
            )}
          </g>
        ))}

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
