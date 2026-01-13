import { t } from '../i18n';
import { useTheme } from '../theme/useTheme';
import { Text } from './Text';

interface DashboardRingProps {
  consumed: {
    kcal: number;
    protein: number;
    fat: number;
    carb: number;
  };
  targets: {
    kcalTarget: number;
    proteinTargetG: number;
    fatTargetG: number;
    carbTargetG: number;
  };
  progress: {
    kcalPct: number;
    proteinPct: number;
    fatPct: number;
    carbPct: number;
  };
}

export function DashboardRing({ consumed, targets, progress }: DashboardRingProps) {
  const theme = useTheme();

  const size = 280;
  const center = size / 2;
  const radius = 100;
  const strokeWidth = 12;
  const innerRadius = radius - strokeWidth / 2;


  const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

  const polarToCartesian = (cx: number, cy: number, r: number, angleDeg: number) => {
    const rad = ((angleDeg - 90) * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  };

  /**
   * Рисует дугу по стартовому углу и длине дуги (sweep) в градусах.
   * sweepAngle > 0 — по часовой (clockwise)
   */
  const describeArc = (cx: number, cy: number, r: number, startAngle: number, sweepAngle: number) => {
    const sweep = clamp(sweepAngle, 0, 359.999); // 360 SVG не любит
    if (sweep <= 0.001) return '';

    const endAngle = startAngle + sweep;

    const start = polarToCartesian(cx, cy, r, startAngle);
    const end = polarToCartesian(cx, cy, r, endAngle);

    const largeArcFlag = sweep > 180 ? 1 : 0;
    const sweepFlag = 1; // 1 = clockwise, 0 = counter-clockwise

    return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} ${sweepFlag} ${end.x} ${end.y}`;
  };


  // Calculate arc paths for each macro
  const getArcPath = (percentage: number, startAngle: number, endAngle: number, radius: number) => {
    const start = polarToCartesian(center, center, radius, endAngle);
    const end = polarToCartesian(center, center, radius, startAngle);
    const largeArcFlag = percentage > 0.5 ? 1 : 0;
    return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`;
  };



  // Angles for each ring (protein, fat, carb)
  const proteinStart = 0;
  const proteinEnd = 120;
  const fatStart = 120;
  const fatEnd = 240;
  const carbStart = 240;
  const carbEnd = 360;

  const proteinProgress = Math.min(progress.proteinPct, 1);
  const fatProgress = Math.min(progress.fatPct, 1);
  const carbProgress = Math.min(progress.carbPct, 1);

  const proteinAngle = proteinStart + (proteinEnd - proteinStart) * proteinProgress;
  console.log('proteinAngle', proteinAngle);
  const fatAngle = fatStart + (fatEnd - fatStart) * fatProgress;
  const carbAngle = carbStart + (carbEnd - carbStart) * carbProgress;

  // Colors from theme
  const proteinColor = theme.palette.success;
  const fatColor = theme.palette.secondary;
  const carbColor = theme.palette.success;
  const bgColor = theme.palette.border;

  const proteinSweep = (proteinEnd - proteinStart) * Math.min(progress.proteinPct, 1);
  const fatSweep = (fatEnd - fatStart) * Math.min(progress.fatPct, 1);
  const carbSweep = (carbEnd - carbStart) * Math.min(progress.carbPct, 1);


  return (
    <div style={{ position: 'relative', width: size, height: size, margin: '0 auto' }}>
      <svg width={size} height={size}>
        {/* Background circles */}
        <circle
          cx={center}
          cy={center}
          r={innerRadius}
          fill="none"
          stroke={bgColor}
          strokeWidth={strokeWidth}
          opacity={0.2}
        />
        <circle
          cx={center}
          cy={center}
          r={innerRadius - strokeWidth - 4}
          fill="none"
          stroke={bgColor}
          strokeWidth={strokeWidth}
          opacity={0.2}
        />
        <circle
          cx={center}
          cy={center}
          r={innerRadius - strokeWidth * 2 - 8}
          fill="none"
          stroke={bgColor}
          strokeWidth={strokeWidth}
          opacity={0.2}
        />
        <path
          d={describeArc(center, center, innerRadius, proteinStart, proteinSweep)}
          fill="none"
          stroke={proteinColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />

        <path
          d={describeArc(center, center, innerRadius - strokeWidth - 2, fatStart, fatSweep)}
          fill="none"
          stroke={fatColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />

        <path
          d={describeArc(center, center, innerRadius - strokeWidth * 2 - 8, carbStart, carbSweep)}
          fill="none"
          stroke={carbColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />

      </svg>

      {/* Center content */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
        }}
      >
        <Text variant="h1" bold style={{ fontSize: '32px', marginBottom: theme.spacing.xs }}>
          {Math.round(consumed.kcal)}
        </Text>
        <Text variant="small" muted>
          {t('dashboard.of')} {targets.kcalTarget} ккал
        </Text>
      </div>

      {/* Legend */}
      <div
        style={{
          position: 'absolute',
          bottom: theme.spacing.md,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'space-around',
          fontSize: '12px',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: proteinColor, fontWeight: 'bold', marginBottom: theme.spacing.xs }}>
            {t('dashboard.protein')}
          </div>
          <Text variant="small" muted>
            {consumed.protein.toFixed(0)}/{targets.proteinTargetG}г
          </Text>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: fatColor, fontWeight: 'bold', marginBottom: theme.spacing.xs }}>
            {t('dashboard.fat')}
          </div>
          <Text variant="small" muted>
            {consumed.fat.toFixed(0)}/{targets.fatTargetG}г
          </Text>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: carbColor, fontWeight: 'bold', marginBottom: theme.spacing.xs }}>
            {t('dashboard.carb')}
          </div>
          <Text variant="small" muted>
            {consumed.carb.toFixed(0)}/{targets.carbTargetG}г
          </Text>
        </div>
      </div>
    </div>
  );
}
