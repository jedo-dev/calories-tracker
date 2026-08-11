import { useEffect, useRef, useState } from "react";
import { t } from "../../i18n";
import { useTheme } from "../../theme/useTheme";
import { DashboardRing } from "../../ui/DashboardRing";
import { Text } from "../../ui/Text";

export interface DashboardData {
  date: string;
  consumed: { kcal: number; protein: number; fat: number; carb: number };
  targets: {
    kcalTarget: number;
    proteinTargetG: number;
    fatTargetG: number;
    carbTargetG: number;
  } | null;
  progress: {
    kcalPct: number;
    proteinPct: number;
    fatPct: number;
    carbPct: number;
  } | null;
}

function MacroBar({
  label,
  value,
  target,
  pct
}: {
  label: string;
  value: number;
  target: number;
  pct: number;
}) {
  const theme = useTheme();

  return (
    <div style={{ display: "grid", gap: "6px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: theme.spacing.sm,
          alignItems: "baseline"
        }}
      >
        <Text style={{ fontSize: "15px", fontWeight: 500 }}>{label}</Text>
        <Text
          style={{
            fontSize: "15px",
            fontWeight: 600,
            color: theme.palette.text
          }}
        >
          {Math.round(value)}{" "}
          <span style={{ color: theme.palette.textMuted }}>
            / {Math.round(target)} г
          </span>
        </Text>
      </div>
      <div
        style={{
          height: "10px",
          borderRadius: "999px",
          backgroundColor: "rgba(255,255,255,0.08)",
          overflow: "hidden"
        }}
      >
        <div
          style={{
            width: `${Math.max(8, Math.min(100, pct * 100))}%`,
            height: "100%",
            borderRadius: "999px",
            background: "linear-gradient(90deg, #58D45D 0%, #79E26C 100%)"
          }}
        />
      </div>
    </div>
  );
}

function CalorieCircle({
  consumed,
  target,
  pct
}: {
  consumed: number;
  target: number;
  pct: number;
}) {
  const theme = useTheme();

  const size = 116;
  const stroke = 10;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const filled = Math.max(0, Math.min(1, pct));

  const color =
    pct > 1.1 ? theme.palette.danger : pct > 0.9 ? "#FFA500" : "#58D45D";

  return (
    <div
      style={{
        position: "relative",
        width: size,
        height: size,
        flexShrink: 0
      }}
    >
      <svg width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${c * filled} ${c}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center"
        }}
      >
        <Text bold style={{ fontSize: "22px", lineHeight: 1.1 }}>
          {Math.round(consumed)}
        </Text>
        <Text variant="small" muted style={{ fontSize: "12px" }}>
          {t("dashboard.of")} {Math.round(target)}
        </Text>
        <Text variant="small" muted style={{ fontSize: "12px" }}>
          {t("dashboard.kcal")}
        </Text>
      </div>
    </div>
  );
}

// Свайп-слайдер дашборда дня: кольцо КБЖУ ↔ круг калорий с макро-барами.
export function DashboardSlider({
  dashboard
}: {
  dashboard: DashboardData & {
    targets: NonNullable<DashboardData["targets"]>;
    progress: NonNullable<DashboardData["progress"]>;
  };
}) {
  const theme = useTheme();
  const sliderRef = useRef<HTMLDivElement>(null);
  const [slideIndex, setSlideIndex] = useState(0);
  const slidesCount = 2;

  useEffect(() => {
    const container = sliderRef.current;
    if (!container) return;

    const handleScroll = () => {
      const index = Math.round(container.scrollLeft / container.clientWidth);
      setSlideIndex(Math.max(0, Math.min(slidesCount - 1, index)));
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSlide = (index: number) => {
    const container = sliderRef.current;
    if (!container) return;
    container.scrollTo({
      left: index * container.clientWidth,
      behavior: "smooth"
    });
  };

  return (
    <div style={{ display: "grid", gap: theme.spacing.sm }}>
      <div
        ref={sliderRef}
        className="onboarding-slider"
        style={{
          display: "flex",
          overflowX: "auto",
          overflowY: "hidden",
          scrollSnapType: "x mandatory",
          WebkitOverflowScrolling: "touch",
          scrollbarWidth: "none"
        }}
      >
        <div
          style={{
            minWidth: "100%",
            flexShrink: 0,
            scrollSnapAlign: "start",
            display: "flex",
            justifyContent: "center",
            marginTop: theme.spacing.lg
          }}
        >
          <div
            style={{
              position: "relative",
              width: "320px",
              height: "180px"
            }}
          >
            <DashboardRing
              consumed={dashboard.consumed}
              targets={dashboard.targets}
              progress={dashboard.progress}
            />
          </div>
        </div>

        <div
          style={{
            minWidth: "100%",
            flexShrink: 0,
            scrollSnapAlign: "start",
            display: "flex",
            alignItems: "center",
            gap: theme.spacing.md
          }}
        >
          <CalorieCircle
            consumed={dashboard.consumed.kcal}
            target={dashboard.targets.kcalTarget}
            pct={dashboard.progress.kcalPct}
          />
          <div style={{ display: "grid", gap: theme.spacing.md, flex: 1 }}>
            <MacroBar
              label={t("dashboard.protein")}
              value={dashboard.consumed.protein}
              target={dashboard.targets.proteinTargetG}
              pct={dashboard.progress.proteinPct}
            />
            <MacroBar
              label={t("dashboard.fat")}
              value={dashboard.consumed.fat}
              target={dashboard.targets.fatTargetG}
              pct={dashboard.progress.fatPct}
            />
            <MacroBar
              label={t("dashboard.carb")}
              value={dashboard.consumed.carb}
              target={dashboard.targets.carbTargetG}
              pct={dashboard.progress.carbPct}
            />
          </div>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: theme.spacing.sm
        }}
      >
        {Array.from({ length: slidesCount }).map((_, index) => (
          <button
            key={index}
            onClick={() => scrollToSlide(index)}
            aria-label={`Слайд ${index + 1}`}
            style={{
              width: slideIndex === index ? "24px" : "8px",
              height: "8px",
              borderRadius: "4px",
              backgroundColor:
                slideIndex === index
                  ? theme.palette.primary
                  : theme.palette.border,
              border: "none",
              cursor: "pointer",
              transition: "all 0.3s",
              padding: 0
            }}
          />
        ))}
      </div>
    </div>
  );
}
