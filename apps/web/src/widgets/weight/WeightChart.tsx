import { useMemo, useRef, useState } from "react";
import { formatDateHuman } from "../../i18n";
import { useTheme } from "../../theme/useTheme";

export interface WeightEntry {
  _id: string;
  date: string;
  weightKg: number;
}

interface ChartPoint {
  x: number;
  y: number;
  entry: WeightEntry;
}

// Catmull-Rom → cubic bezier path through all points
function smoothPath(pts: { x: number; y: number }[]): string {
  if (pts.length < 2) return "";
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] || p2;
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2.x} ${p2.y}`;
  }
  return d;
}

// Плавный график веса за период с ховером/тач-скраббингом.
export function WeightChart({ entries }: { entries: WeightEntry[] }) {
  const theme = useTheme();
  const [hover, setHover] = useState<ChartPoint | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const W = 480;
  const H = 180;
  const PAD_L = 34;
  const PAD_R = 12;
  const PAD_T = 14;
  const PAD_B = 22;

  const { points, gridLines, path, areaPath } = useMemo(() => {
    const minW = Math.min(...entries.map((e) => e.weightKg));
    const maxW = Math.max(...entries.map((e) => e.weightKg));
    const pad = Math.max(0.5, (maxW - minW) * 0.15);
    const lo = minW - pad;
    const hi = maxW + pad;

    const t0 = Date.parse(entries[0].date);
    const t1 = Date.parse(entries[entries.length - 1].date);
    const span = Math.max(1, t1 - t0);

    const points: ChartPoint[] = entries.map((e) => ({
      x: PAD_L + ((Date.parse(e.date) - t0) / span) * (W - PAD_L - PAD_R),
      y: PAD_T + (1 - (e.weightKg - lo) / (hi - lo)) * (H - PAD_T - PAD_B),
      entry: e
    }));

    const gridLines = [
      lo + (hi - lo) * 0.15,
      (lo + hi) / 2,
      hi - (hi - lo) * 0.15
    ].map((v) => ({
      y: PAD_T + (1 - (v - lo) / (hi - lo)) * (H - PAD_T - PAD_B),
      label: v.toFixed(1)
    }));

    const path = smoothPath(points);
    const last = points[points.length - 1];
    const first = points[0];
    const areaPath = `${path} L ${last.x} ${H - PAD_B} L ${first.x} ${H - PAD_B} Z`;

    return { points, gridLines, path, areaPath };
  }, [entries]);

  const handleMove = (clientX: number) => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * W;
    let nearest = points[0];
    for (const p of points) {
      if (Math.abs(p.x - x) < Math.abs(nearest.x - x)) nearest = p;
    }
    setHover(nearest);
  };

  return (
    <div style={{ position: "relative" }}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        style={{ width: "100%", display: "block", touchAction: "pan-y" }}
        onMouseMove={(e) => handleMove(e.clientX)}
        onMouseLeave={() => setHover(null)}
        onTouchStart={(e) => handleMove(e.touches[0].clientX)}
        onTouchMove={(e) => handleMove(e.touches[0].clientX)}
        onTouchEnd={() => setHover(null)}
      >
        <defs>
          <linearGradient id="weight-area" x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="0%"
              stopColor={theme.palette.primary}
              stopOpacity="0.28"
            />
            <stop
              offset="100%"
              stopColor={theme.palette.primary}
              stopOpacity="0"
            />
          </linearGradient>
        </defs>

        {gridLines.map((g, i) => (
          <g key={i}>
            <line
              x1={PAD_L}
              x2={W - PAD_R}
              y1={g.y}
              y2={g.y}
              stroke="rgba(255,255,255,0.08)"
              strokeWidth="1"
            />
            <text
              x={PAD_L - 6}
              y={g.y + 3}
              textAnchor="end"
              fontSize="9"
              fill={theme.palette.textMuted}
            >
              {g.label}
            </text>
          </g>
        ))}

        <path d={areaPath} fill="url(#weight-area)" />
        <path
          d={path}
          fill="none"
          stroke={theme.palette.primary}
          strokeWidth="2"
          strokeLinecap="round"
        />

        {/* end point always marked */}
        <circle
          cx={points[points.length - 1].x}
          cy={points[points.length - 1].y}
          r="3.5"
          fill={theme.palette.primary}
          stroke="rgba(10,32,46,1)"
          strokeWidth="2"
        />

        {hover && (
          <g>
            <line
              x1={hover.x}
              x2={hover.x}
              y1={PAD_T}
              y2={H - PAD_B}
              stroke="rgba(255,255,255,0.25)"
              strokeWidth="1"
              strokeDasharray="3 3"
            />
            <circle
              cx={hover.x}
              cy={hover.y}
              r="4"
              fill={theme.palette.primary}
              stroke="#fff"
              strokeWidth="1.5"
            />
          </g>
        )}

        <text x={PAD_L} y={H - 6} fontSize="9" fill={theme.palette.textMuted}>
          {formatDateHuman(entries[0].date)}
        </text>
        <text
          x={W - PAD_R}
          y={H - 6}
          textAnchor="end"
          fontSize="9"
          fill={theme.palette.textMuted}
        >
          {formatDateHuman(entries[entries.length - 1].date)}
        </text>
      </svg>

      {hover && (
        <div
          style={{
            position: "absolute",
            left: `${(hover.x / W) * 100}%`,
            top: 0,
            transform: `translateX(${hover.x > W * 0.75 ? "-100%" : "8px"})`,
            background: "rgba(3, 18, 28, 0.95)",
            border: "1px solid rgba(160, 200, 220, 0.25)",
            borderRadius: "10px",
            padding: "5px 9px",
            pointerEvents: "none",
            whiteSpace: "nowrap",
            zIndex: 5
          }}
        >
          <span style={{ fontSize: "11px", color: theme.palette.textMuted }}>
            {formatDateHuman(hover.entry.date)} ·{" "}
          </span>
          <span
            style={{
              fontSize: "12px",
              fontWeight: 700,
              color: theme.palette.text
            }}
          >
            {hover.entry.weightKg} кг
          </span>
        </div>
      )}
    </div>
  );
}
