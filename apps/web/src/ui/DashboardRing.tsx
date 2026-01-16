import { t } from '../i18n';
import { useTheme } from '../theme/useTheme';
import { Text } from './Text';

interface DashboardRingProps {
  consumed: { kcal: number; protein: number; fat: number; carb: number };
  targets: { kcalTarget: number; proteinTargetG: number; fatTargetG: number; carbTargetG: number };
  progress: { kcalPct: number; proteinPct: number; fatPct: number; carbPct: number };
}

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

const polarToCartesian = (cx: number, cy: number, r: number, angleDeg: number) => {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
};

/**
 * Дуга по часовой стрелке: startAngle + sweepAngle
 * sweepAngle в градусах (0..360). 360 не рисуем (SVG баг).
 */
const describeArc = (cx: number, cy: number, r: number, startAngle: number, sweepAngle: number) => {
  const sweep = clamp(sweepAngle, 0, 359.999);
  if (sweep <= 0.001) return '';

  const endAngle = startAngle + sweep;
  const start = polarToCartesian(cx, cy, r, startAngle);
  const end = polarToCartesian(cx, cy, r, endAngle);

  const largeArcFlag = sweep > 180 ? 1 : 0;
  const sweepFlag = 1; // clockwise

  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} ${sweepFlag} ${end.x} ${end.y}`;
};

type ArcTrackProgress = {
  key: string;
  r: number;
  color: string;
  pct: number; // 0..1
  start: number;
  sweep: number;
};

export function DashboardRing({ consumed, targets, progress }: DashboardRingProps) {
  const theme = useTheme();

  const size = 320;
  const asize = 220;
  const cx = size / 2;
  const cy = size / 2;

  const stroke = 12;

  // ===== Геометрия “спидометра” =====
  // Хочешь ровно полукруг? Поставь ARC_SWEEP = 180.
  const ARC_START = -90; // где начинается дуга (градусы)
  const ARC_SWEEP = 180; // длина дуги (градусы)
  // Это дает дугу снизу-слева → вниз → снизу-справа, похожую на референс.

  const gapDeg = 6; // зазор между сегментами

  // Радиусы: внешний — калории, внутри — макросы
  const rKcal = 118;
  const rP = 98;
  const rF = 78;
  const rC = 58;

  // Цвета из темы
  const trackColor = theme.palette.border;
  const trackOpacity = 0.22;

  const kcalColor = theme.palette.success;
  const proteinColor = theme.palette.success ?? theme.palette.primary;
  const fatColor = theme.palette.success ?? theme.palette.textMuted;
  const carbColor = theme.palette.success; // если есть отдельный цвет — подставь

  // ===== Сектора для макросов внутри общего диапазона =====
  // Делим ARC_SWEEP на 3 сектора и оставляем gap между ними.
  const sectorSize = ARC_SWEEP / 3;
  const usableSector = sectorSize - gapDeg;

  const pStart = ARC_START + gapDeg / 2;
  const fStart = ARC_START + sectorSize + gapDeg / 2;
  const cStart = ARC_START + sectorSize * 2 + gapDeg / 2;

  const pSweep = usableSector * clamp(progress.proteinPct, 0, 1);
  const fSweep = usableSector * clamp(progress.fatPct, 0, 1);
  const cSweep = usableSector * clamp(progress.carbPct, 0, 1);

  // Калории — полный диапазон ARC_SWEEP (track + progress)
  const kcalSweep = ARC_SWEEP * clamp(progress.kcalPct, 0, 1);

  const arcs: ArcTrackProgress[] = [
    // kcal outer ring
    { key: 'kcal', r: rKcal, color: kcalColor, pct: clamp(progress.kcalPct, 0, 1), start: ARC_START, sweep: kcalSweep },

    // macros
    { key: 'protein', r: rP, color: proteinColor, pct: clamp(progress.proteinPct, 0, 1), start: pStart, sweep: pSweep },
    { key: 'fat', r: rF, color: fatColor, pct: clamp(progress.fatPct, 0, 1), start: fStart, sweep: fSweep },
    { key: 'carb', r: rC, color: carbColor, pct: clamp(progress.carbPct, 0, 1), start: cStart, sweep: cSweep },
  ];

  return (
    <div style={{ position: 'relative', width: size, height: size / 2, margin: '0 auto' }}>
      <svg width={size} height={160} style={{ transform: 'translate(0, -53px)' }}>
        {/* TRACKS (норма) */}
        {/* kcal track */}
        <path
          d={describeArc(cx, cy, rKcal, ARC_START, ARC_SWEEP)}
          fill="none"
          stroke={trackColor}
          strokeWidth={stroke}
          strokeLinecap="round"
          opacity={trackOpacity}
        />
        {/* macro tracks (по секторам) */}
        <path
          d={describeArc(cx, cy, rP, pStart, usableSector)}
          fill="none"
          stroke={trackColor}
          strokeWidth={stroke}
          strokeLinecap="round"
          opacity={trackOpacity}
        />
        <path
          d={describeArc(cx, cy, rF, fStart, usableSector)}
          fill="none"
          stroke={trackColor}
          strokeWidth={stroke}
          strokeLinecap="round"
          opacity={trackOpacity}
        />
        <path
          d={describeArc(cx, cy, rC, cStart, usableSector)}
          fill="none"
          stroke={trackColor}
          strokeWidth={stroke}
          strokeLinecap="round"
          opacity={trackOpacity}
        />

        {/* PROGRESS */}
        {arcs.map((a) => (
          <path
            key={a.key}
            d={describeArc(cx, cy, a.r, a.start, a.sweep)}
            fill="none"
            stroke={a.color}
            strokeWidth={stroke}
            strokeLinecap="round"
          />
        ))}
      </svg>

      {/* Center content */}
      <div
        style={{
          position: 'absolute',
          top: '55%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
          width: '76%',
        }}
      >
        <Text variant="h1" bold style={{ fontSize: '26px', marginBottom: theme.spacing.xs, color: theme.palette.secondaryText }}>
          {Math.round(consumed.kcal)}
        </Text>
        <br />
        <Text variant="small" muted>
          {t('dashboard.of')}  {Math.round(targets.kcalTarget)} {t('dashboard.kcal')}
        </Text>
      </div>

      {/* Macro legend */}
      <div
        style={{
          position: 'absolute',
          bottom: '-4px',
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'space-around',
          gap: theme.spacing.sm,
        }}
      >
        <div style={{ textAlign: 'center', minWidth: 90 }}>
          <div style={{ color: proteinColor, fontWeight: 700, marginBottom: theme.spacing.xs }}>{t('dashboard.protein')}</div>
          <Text variant="small" muted>
            {Math.round(consumed.protein)}/{Math.round(targets.proteinTargetG)}г
          </Text>
        </div>
        <div style={{ textAlign: 'center', minWidth: 90 }}>
          <div style={{ color: fatColor, fontWeight: 700, marginBottom: theme.spacing.xs }}>{t('dashboard.fat')}</div>
          <Text variant="small" muted>
            {Math.round(consumed.fat)}/{Math.round(targets.fatTargetG)}г
          </Text>
        </div>
        <div style={{ textAlign: 'center', minWidth: 90 }}>
          <div style={{ color: carbColor, fontWeight: 700, marginBottom: theme.spacing.xs }}>{t('dashboard.carb')}</div>
          <Text variant="small" muted>
            {Math.round(consumed.carb)}/{Math.round(targets.carbTargetG)}г
          </Text>
        </div>
      </div>
    </div>
  );
}
