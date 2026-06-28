import { useTheme } from "../../theme/useTheme";
import { Text } from "../../ui/Text";

interface KpiCardProps {
  value: string;
  label: string;
  arrow?: "up" | "down" | null;
  tone?: "primary" | "success" | "neutral";
}

function TrendArrow({ direction }: { direction: "up" | "down" }) {
  const d =
    direction === "up"
      ? "M12 20 V7 M7 12 L12 7 L17 12"
      : "M12 4 V17 M7 12 L12 17 L17 12";

  return (
    <svg
      viewBox="0 0 24 24"
      width="10"
      height="10"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d={d}
        fill="none"
        stroke="currentColor"
        strokeWidth="2.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function KpiCard({ value, label, arrow, tone = "neutral" }: KpiCardProps) {
  const theme = useTheme();
  const color =
    tone === "success"
      ? theme.palette.success
      : tone === "primary"
        ? theme.palette.primary
        : theme.palette.text;

  return (
    <div
      style={{
        minHeight: "15px",
        borderRadius: "16px",
        padding: "5px 14px 5px",
        background:
          "linear-gradient(180deg, rgba(18, 50, 73, 0.98), rgba(14, 40, 61, 0.92))",
        border: "1px solid rgba(114, 163, 194, 0.18)",
        boxShadow: "0 12px 28px rgba(0, 0, 0, 0.18)"
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
        <Text
          bold
          style={{
            display: "block",
            fontSize: "22px",
            lineHeight: "0.92",
            letterSpacing: "-0.06em",
            color
          }}
        >
          {value}
        </Text>
        {arrow && (
          <span style={{ color, marginTop: "", flexShrink: 0 }}>
            <TrendArrow direction={arrow} />
          </span>
        )}
      </div>
      <Text
        muted
        style={{
          display: "block",
          marginTop: "4px",
          fontSize: "14px",
          lineHeight: "1.06",
          letterSpacing: "-0.02em"
        }}
      >
        {label}
      </Text>
    </div>
  );
}

interface ReportsKpiGridProps {
  avgKcal: number;
  totalBurned: number;
  workouts: number;
  weightChangeValue: string;
  weightChangeCaption: string;
  weightChangeArrow: "up" | "down" | null;
}

export function ReportsKpiGrid({
  avgKcal,
  totalBurned,
  workouts,
  weightChangeValue,
  weightChangeCaption,
  weightChangeArrow
}: ReportsKpiGridProps) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
        gap: "10px"
      }}
    >
      <KpiCard
        value={String(avgKcal)}
        label="ср. ккал"
        arrow="up"
        tone="success"
      />
      <KpiCard
        value={String(Math.round(totalBurned))}
        label="сожжено"
        arrow="up"
        tone="success"
      />
      <KpiCard
        value={String(workouts)}
        label="тренировки"
        arrow="up"
        tone="primary"
      />
      <KpiCard
        value={weightChangeValue}
        label={weightChangeCaption}
        arrow={weightChangeArrow}
        tone="success"
      />
    </div>
  );
}
