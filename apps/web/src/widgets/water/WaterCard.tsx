import { useRef, useState } from "react";
import { t } from "../../i18n";
import { useTheme } from "../../theme/useTheme";
import { Button } from "../../ui/Button";
import { Card } from "../../ui/Card";
import { Icon } from "../../ui/Icon";
import { Text } from "../../ui/Text";

// Кадры морфинга — ровно из присланного SVG (цвет #8ed1fc).
// Задняя волна (гребень ~150), fill-opacity 0.53.
const BACK_FRAMES = [
  "M 0,600 L 0,150 C 126.92857142857144,171.92857142857144 253.8571428571429,193.85714285714286 383,210 C 512.1428571428571,226.14285714285714 643.5000000000001,236.5 753,211 C 862.4999999999999,185.5 950.1428571428571,124.14285714285714 1061,108 C 1171.857142857143,91.85714285714286 1305.9285714285716,120.92857142857143 1440,150 L 1440,600 L 0,600 Z",
  "M 0,600 L 0,150 C 160.8571428571429,178.03571428571428 321.7142857142858,206.07142857142858 422,212 C 522.2857142857142,217.92857142857142 561.9999999999998,201.74999999999997 679,203 C 796.0000000000002,204.25000000000003 990.2857142857144,222.92857142857144 1130,217 C 1269.7142857142856,211.07142857142856 1354.8571428571427,180.53571428571428 1440,150 L 1440,600 L 0,600 Z",
  "M 0,600 L 0,150 C 93.32142857142858,161.85714285714286 186.64285714285717,173.71428571428572 309,180 C 431.35714285714283,186.28571428571428 582.7499999999999,187 710,185 C 837.2500000000001,183 940.3571428571429,178.2857142857143 1058,172 C 1175.642857142857,165.7142857142857 1307.8214285714284,157.85714285714283 1440,150 L 1440,600 L 0,600 Z",
  "M 0,600 L 0,150 C 101.67857142857142,183.21428571428572 203.35714285714283,216.42857142857142 336,217 C 468.64285714285717,217.57142857142858 632.2500000000001,185.5 763,156 C 893.7499999999999,126.5 991.6428571428571,99.57142857142857 1099,99 C 1206.357142857143,98.42857142857143 1323.1785714285716,124.21428571428572 1440,150 L 1440,600 L 0,600 Z",
];
// Передняя волна (гребень ~350), fill-opacity 1.
const FRONT_FRAMES = [
  "M 0,600 L 0,350 C 94.82142857142858,364.3571428571429 189.64285714285717,378.7142857142857 321,361 C 452.35714285714283,343.2857142857143 620.2499999999999,293.5 757,303 C 893.7500000000001,312.5 999.3571428571429,381.2857142857143 1108,399 C 1216.642857142857,416.7142857142857 1328.3214285714284,383.3571428571429 1440,350 L 1440,600 L 0,600 Z",
  "M 0,600 L 0,350 C 129.10714285714286,365.0357142857143 258.2142857142857,380.07142857142856 375,365 C 491.7857142857143,349.92857142857144 596.2500000000001,304.75 714,288 C 831.7499999999999,271.25 962.7857142857142,282.92857142857144 1086,298 C 1209.2142857142858,313.07142857142856 1324.607142857143,331.5357142857143 1440,350 L 1440,600 L 0,600 Z",
  "M 0,600 L 0,350 C 146.85714285714283,314.17857142857144 293.71428571428567,278.35714285714283 419,296 C 544.2857142857143,313.64285714285717 648.0000000000001,384.75 759,382 C 869.9999999999999,379.25 988.2857142857142,302.64285714285717 1103,285 C 1217.7142857142858,267.35714285714283 1328.857142857143,308.67857142857144 1440,350 L 1440,600 L 0,600 Z",
  "M 0,600 L 0,350 C 111.07142857142858,328.82142857142856 222.14285714285717,307.64285714285717 329,313 C 435.85714285714283,318.35714285714283 538.4999999999999,350.25 666,349 C 793.5000000000001,347.75 945.8571428571429,313.35714285714283 1079,308 C 1212.142857142857,302.64285714285717 1326.0714285714284,326.32142857142856 1440,350 L 1440,600 L 0,600 Z",
];

// Замыкаем цикл (…→0-й кадр) для бесшовного повтора SMIL.
const smilValues = (frames: string[]) => [...frames, frames[0]].join(";");
const BACK_VALUES = smilValues(BACK_FRAMES);
const FRONT_VALUES = smilValues(FRONT_FRAMES);
const KEY_TIMES = "0;0.25;0.5;0.75;1";

// Волна из присланного SVG, поднимается по мере заполнения (0..1).
// Форма пути морфится через SMIL (кроссбраузерно). splash — ускорение при доливе.
function WaterWave({ pct, splash }: { pct: number; splash?: boolean }) {
  const clamped = Math.max(0, Math.min(1, pct));
  const dur = splash ? "2s" : "4s";

  return (
    <div
      aria-hidden="true"
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        height: `${clamped * 100}%`,
        transition: "height 900ms cubic-bezier(0.22, 0.9, 0.24, 1)",
        pointerEvents: "none",
        zIndex: 0,
      }}
    >
      {/* Кроп сверху (viewBox с y=90), чтобы гребень стоял у поверхности воды. */}
      <svg
        key={splash ? "s" : "n"}
        viewBox="0 90 1440 510"
        preserveAspectRatio="none"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
      >
        <path fill="#8ed1fc" fillOpacity={0.53} d={BACK_FRAMES[0]}>
          <animate attributeName="d" values={BACK_VALUES} keyTimes={KEY_TIMES} dur={dur} repeatCount="indefinite" />
        </path>
        <path fill="#22a4f561" fillOpacity={1} d={FRONT_FRAMES[0]}>
          <animate attributeName="d" values={FRONT_VALUES} keyTimes={KEY_TIMES} dur={dur} repeatCount="indefinite" />
        </path>
      </svg>
    </div>
  );
}

// Капля из набора (assets/pack). Незаполненные — приглушены прозрачностью,
// без перекраски (иконка многоцветная).
function WaterDrop({ filled }: { filled: boolean }) {
  return (
    <span style={{ opacity: filled ? 1 : 0.25, transition: "opacity 300ms ease" }}>
      <Icon name="water" size={26} />
    </span>
  );
}

interface WaterCardProps {
  totalMl: number;
  goal?: number;
  onAdd: (amountMl: number) => void;
  /** Просмотр прошлых дней: воду задним числом не доливаем */
  readOnly?: boolean;
}

export function WaterCard({ totalMl, goal = 2000, onAdd, readOnly = false }: WaterCardProps) {
  const theme = useTheme();
  const [splash, setSplash] = useState(false);
  const splashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const pct = Math.max(0, Math.min(1, totalMl / goal));
  const reached = totalMl >= goal;
  const drops = 8;
  const filledDrops = Math.max(0, Math.min(drops, Math.round(pct * drops)));

  const add = (amountMl: number) => {
    setSplash(true);
    if (splashTimer.current) clearTimeout(splashTimer.current);
    splashTimer.current = setTimeout(() => setSplash(false), 1300);
    onAdd(amountMl);
  };

  const ghostButtonStyle = {
    flex: 1,
    borderColor: "rgba(88, 212, 93, 0.8)",
    color: theme.palette.primary,
    backgroundColor: "rgba(88, 212, 93, 0.06)",
  } as const;

  return (
    <Card
      style={{
        position: "relative",
        overflow: "hidden",
        marginBottom: theme.spacing.md,
        background: "linear-gradient(180deg, rgba(23, 62, 83, 0.96) 0%, rgba(15, 39, 56, 0.98) 100%)",
        border: "none",
        borderRadius: "24px",
      }}
    >
      {/* Волна заливает весь блок (в т.ч. за кнопками), без внутренней рамки. */}
      <WaterWave pct={pct} splash={splash} />

      <div style={{ position: "relative", zIndex: 1 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: theme.spacing.sm,
          }}
        >
          <Text bold style={{ fontSize: "18px" }}>
            {t('water.title')}
          </Text>
          <Text variant="small" muted>
            <span style={{ color: theme.palette.primary, fontSize: "22px", fontWeight: 700 }}>{totalMl}</span>{" "}
            / {goal} мл
          </Text>
        </div>

        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: theme.spacing.md }}>
          {Array.from({ length: drops }).map((_, index) => (
            <WaterDrop key={index} filled={index < filledDrops} />
          ))}
        </div>

        {readOnly ? null : reached ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: theme.spacing.sm,
              minHeight: "40px",
            }}
          >
            <Icon name="water" size={22} />
            <Text bold style={{ color: theme.palette.primary, fontSize: "15px" }}>
              {t('water.goalReached')}
            </Text>
          </div>
        ) : (
          <div style={{ display: "flex", gap: theme.spacing.sm }}>
            <Button variant="ghost" size="sm" onClick={() => add(250)} style={ghostButtonStyle}>
              +250 мл
            </Button>
            <Button variant="ghost" size="sm" onClick={() => add(500)} style={ghostButtonStyle}>
              +500 мл
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}
