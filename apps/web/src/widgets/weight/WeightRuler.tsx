import { useEffect, useRef } from 'react';
import { useTheme } from '../../theme/useTheme';
import { hapticSelectionChanged } from '../../utils/hapticFeedback';

interface WeightRulerProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  /** Шаг деления (кг). По умолчанию 0.1. */
  step?: number;
  /** Сколько кг видно по всей ширине линейки. По умолчанию 3. */
  windowKg?: number;
}

// Дизайн-координаты SVG (viewBox). Линейка тянется на всю ширину контейнера.
const VB_W = 1000;
const VB_H = 96;
const CENTER = VB_W / 2;
const BASE_Y = 30; // верхняя граница штрихов

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const round1 = (v: number) => Math.round(v * 10) / 10;

export function WeightRuler({
  value,
  onChange,
  min = 20,
  max = 300,
  step = 0.1,
  windowKg = 3,
}: WeightRulerProps) {
  const theme = useTheme();
  const wrapRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ startX: number; startValue: number; lastTenth: number } | null>(null);

  const pxPerKgVb = VB_W / windowKg;
  const halfKg = windowKg / 2;

  // Диапазон значений, попадающих в видимое окно (+запас).
  const lo = clamp(value - halfKg - 0.2, min, max);
  const hi = clamp(value + halfKg + 0.2, min, max);

  const ticks: { x: number; kind: 'minor' | 'half' | 'major'; label?: string }[] = [];
  const firstTenth = Math.ceil(lo * 10);
  const lastTenth = Math.floor(hi * 10);
  for (let tenth = firstTenth; tenth <= lastTenth; tenth++) {
    const v = tenth / 10;
    const x = CENTER + (v - value) * pxPerKgVb;
    if (x < -10 || x > VB_W + 10) continue;
    const isMajor = tenth % 10 === 0;
    const isHalf = tenth % 5 === 0;
    ticks.push({
      x,
      kind: isMajor ? 'major' : isHalf ? 'half' : 'minor',
      label: isMajor ? String(v) : undefined,
    });
  }

  const pointerDown = (e: React.PointerEvent) => {
    const width = wrapRef.current?.clientWidth ?? 1;
    (e.target as Element).setPointerCapture?.(e.pointerId);
    drag.current = { startX: e.clientX, startValue: value, lastTenth: Math.round(value * 10) };
    // Сохраняем перевод экранных px в кг для этого жеста.
    (drag.current as any).pxPerKgScreen = width / windowKg;
  };

  const pointerMove = (e: React.PointerEvent) => {
    if (!drag.current) return;
    const pxPerKgScreen = (drag.current as any).pxPerKgScreen as number;
    const deltaX = e.clientX - drag.current.startX;
    // Тянем влево (deltaX<0) → значение растёт.
    let next = drag.current.startValue - deltaX / pxPerKgScreen;
    next = clamp(round1(next), min, max);
    const tenth = Math.round(next * 10);
    if (tenth !== drag.current.lastTenth) {
      drag.current.lastTenth = tenth;
      hapticSelectionChanged();
      onChange(next);
    }
  };

  const endDrag = (e: React.PointerEvent) => {
    if (!drag.current) return;
    (e.target as Element).releasePointerCapture?.(e.pointerId);
    onChange(clamp(round1(value / step) * step, min, max));
    drag.current = null;
  };

  // Колёсико мыши для десктопа.
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const onWheel = (ev: WheelEvent) => {
      ev.preventDefault();
      const dir = ev.deltaY > 0 || ev.deltaX > 0 ? 1 : -1;
      onChange(clamp(round1(value + dir * step), min, max));
      hapticSelectionChanged();
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [value, step, min, max, onChange]);

  return (
    <div
      ref={wrapRef}
      onPointerDown={pointerDown}
      onPointerMove={pointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      role="slider"
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={value}
      style={{
        width: '100%',
        touchAction: 'none',
        userSelect: 'none',
        cursor: 'grab',
        // мягкое затухание штрихов по краям
        WebkitMaskImage:
          'linear-gradient(90deg, transparent 0%, #000 14%, #000 86%, transparent 100%)',
        maskImage: 'linear-gradient(90deg, transparent 0%, #000 14%, #000 86%, transparent 100%)',
      }}
    >
      <svg viewBox={`0 0 ${VB_W} ${VB_H}`} style={{ width: '100%', display: 'block' }}>
        {ticks.map((tk, i) => {
          const h = tk.kind === 'major' ? 34 : tk.kind === 'half' ? 22 : 14;
          const stroke =
            tk.kind === 'major' ? theme.palette.text : theme.palette.textMuted;
          const opacity = tk.kind === 'minor' ? 0.5 : 0.85;
          return (
            <g key={i}>
              <line
                x1={tk.x}
                x2={tk.x}
                y1={BASE_Y}
                y2={BASE_Y + h}
                stroke={stroke}
                strokeOpacity={opacity}
                strokeWidth={tk.kind === 'major' ? 3 : 2}
                strokeLinecap="round"
              />
              {tk.label && (
                <text
                  x={tk.x}
                  y={BASE_Y + h + 18}
                  textAnchor="middle"
                  fontSize="18"
                  fontWeight={700}
                  fill={theme.palette.textMuted}
                >
                  {tk.label}
                </text>
              )}
            </g>
          );
        })}

        {/* Центральный указатель */}
        <g>
          <polygon
            points={`${CENTER - 9},6 ${CENTER + 9},6 ${CENTER},22`}
            fill={theme.palette.primary}
          />
          <line
            x1={CENTER}
            x2={CENTER}
            y1={20}
            y2={BASE_Y + 40}
            stroke={theme.palette.primary}
            strokeWidth={4}
            strokeLinecap="round"
          />
        </g>
      </svg>
    </div>
  );
}
