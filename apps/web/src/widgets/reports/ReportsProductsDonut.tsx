import { useMemo, useState } from 'react';
import { Text } from '../../ui/Text';
import { t } from '../../i18n';
import type { ReportDay } from './types';

interface ReportsProductsDonutProps {
  days: ReportDay[];
}

const TOP_LIMIT = 10;

// Палитра в стилистике остальных графиков (зелёный акцент + холодные тона)
const COLORS = [
  '#53D46B',
  '#6FB5FF',
  '#FFD666',
  '#C792EA',
  '#5AC8FA',
  '#FF9F6E',
  '#7BD98A',
  '#F97583',
  '#4DD0C4',
  '#B8C4FF',
];

const polar = (cx: number, cy: number, r: number, angleDeg: number): [number, number] => {
  const a = ((angleDeg - 90) * Math.PI) / 180;
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
};

function arcPath(cx: number, cy: number, rOuter: number, rInner: number, start: number, end: number): string {
  const [x1, y1] = polar(cx, cy, rOuter, start);
  const [x2, y2] = polar(cx, cy, rOuter, end);
  const [x3, y3] = polar(cx, cy, rInner, end);
  const [x4, y4] = polar(cx, cy, rInner, start);
  const large = end - start > 180 ? 1 : 0;
  return `M ${x1} ${y1} A ${rOuter} ${rOuter} 0 ${large} 1 ${x2} ${y2} L ${x3} ${y3} A ${rInner} ${rInner} 0 ${large} 0 ${x4} ${y4} Z`;
}

// Бублик «Топ продуктов» по суммарному весу за период. Всё, что не попало
// в топ-10, сознательно не показываем (в т.ч. без сегмента «прочее»).
// Тап по сегменту или строке легенды подсвечивает продукт и показывает
// его вес в центре бублика.
export function ReportsProductsDonut({ days }: ReportsProductsDonutProps) {
  const [selected, setSelected] = useState<number | null>(null);

  const top = useMemo(() => {
    // Группируем записи по названию продукта без учёта регистра
    const byName = new Map<string, { name: string; grams: number }>();
    for (const day of days) {
      for (const entry of day.entries) {
        const name = (entry.productName || '').trim();
        const grams = entry.grams || 0;
        if (!name || grams <= 0) continue;
        const key = name.toLowerCase();
        const acc = byName.get(key);
        if (acc) acc.grams += grams;
        else byName.set(key, { name, grams });
      }
    }
    return [...byName.values()]
      .sort((a, b) => b.grams - a.grams)
      .slice(0, TOP_LIMIT);
  }, [days]);

  const chart = useMemo(() => {
    const total = top.reduce((sum, item) => sum + item.grams, 0);
    if (total <= 0) return null;

    const size = 240;
    const cx = size / 2;
    const cy = size / 2;
    const rOuter = 92;
    const rInner = 62;
    // Зазор между сегментами; при одном продукте рисуем почти полный круг
    const gap = top.length > 1 ? 1.6 : 0;
    const available = 360 - gap * top.length;

    let cursor = 0;
    const segments = top.map((item, index) => {
      const sweep = (item.grams / total) * available;
      const start = cursor;
      const end = cursor + Math.max(sweep, 0.4);
      cursor = end + gap;
      return {
        ...item,
        color: COLORS[index % COLORS.length],
        pct: Math.round((item.grams / total) * 100),
        path: (grow: number) => arcPath(cx, cy, rOuter + grow, rInner, start, Math.min(end, start + 359.9)),
      };
    });

    return { size, total, segments };
  }, [top]);

  if (!chart) return null;

  const active = selected !== null ? chart.segments[selected] : null;

  const toggle = (index: number) => {
    setSelected((current) => (current === index ? null : index));
  };

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
          {t('report.topProductsTitle')}
        </Text>
        <Text muted style={{ fontSize: '13px' }}>{t('report.topProductsSub')}</Text>
      </div>

      <div style={{ position: 'relative', maxWidth: '260px', margin: '0 auto' }}>
        <svg viewBox={`0 0 ${chart.size} ${chart.size}`} width="100%" style={{ display: 'block' }}>
          {chart.segments.map((seg, index) => {
            const isActive = selected === index;
            const dimmed = selected !== null && !isActive;
            return (
              <path
                key={index}
                d={seg.path(isActive ? 6 : 0)}
                fill={seg.color}
                opacity={dimmed ? 0.32 : 1}
                stroke={isActive ? 'rgba(255,255,255,0.85)' : 'none'}
                strokeWidth={isActive ? 1.5 : 0}
                onClick={() => toggle(index)}
                style={{ cursor: 'pointer', transition: 'opacity 0.2s' }}
              />
            );
          })}
        </svg>

        {/* Центр бублика: сводка или выбранный продукт */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            pointerEvents: 'none',
            padding: '0 26%',
          }}
        >
          {active ? (
            <>
              <span
                style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  color: active.color,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  lineHeight: 1.25,
                }}
              >
                {active.name}
              </span>
              <span style={{ fontSize: '22px', fontWeight: 800, color: '#fff', marginTop: '2px' }}>
                {Math.round(active.grams)} {t('report.grams')}
              </span>
              <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>{active.pct}%</span>
            </>
          ) : (
            <>
              <span style={{ fontSize: '22px', fontWeight: 800, color: '#fff' }}>
                {Math.round(chart.total)} {t('report.grams')}
              </span>
              <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>
                {t('report.topProductsTotal', { count: chart.segments.length })}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Легенда: тап по строке = тап по сегменту */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 12px', marginTop: '12px' }}>
        {chart.segments.map((seg, index) => {
          const isActive = selected === index;
          const dimmed = selected !== null && !isActive;
          return (
            <button
              key={index}
              type="button"
              onClick={() => toggle(index)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '7px',
                minWidth: 0,
                padding: '5px 8px',
                borderRadius: '10px',
                border: 'none',
                background: isActive ? 'rgba(255,255,255,0.08)' : 'transparent',
                color: 'rgba(255,255,255,0.88)',
                opacity: dimmed ? 0.45 : 1,
                fontSize: '13px',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'opacity 0.2s, background 0.2s',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: seg.color, flexShrink: 0 }} />
              <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {seg.name}
              </span>
              <span style={{ fontWeight: 700, color: 'rgba(255,255,255,0.7)', flexShrink: 0 }}>
                {Math.round(seg.grams)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
