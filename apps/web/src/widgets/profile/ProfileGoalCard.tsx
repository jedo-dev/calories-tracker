import { t } from "../../i18n";
import { useTheme } from "../../theme/useTheme";
import { Card } from "../../ui/Card";
import { Text } from "../../ui/Text";

interface ProfileGoalCardProps {
  currentWeight?: number;
  startWeight?: number;
  targetWeight?: number;
}

export function ProfileGoalCard({
  currentWeight,
  startWeight,
  targetWeight
}: ProfileGoalCardProps) {
  const theme = useTheme();

  const hasAll =
    startWeight != null && currentWeight != null && targetWeight != null;

  // Доля пройденного пути старт → цель (одинаково работает и для похудения,
  // и для набора: знак в числителе и знаменателе сокращается).
  const fraction = (() => {
    if (!hasAll) return 0;
    const total = startWeight! - targetWeight!;
    if (total === 0) return 1;
    return Math.max(0, Math.min(1, (startWeight! - currentWeight!) / total));
  })();

  // Отступ под радиус кружка, чтобы крайние точки не вылезали за трек.
  const EDGE = 11;
  const currentLeft = `calc(${EDGE}px + ${fraction} * (100% - ${EDGE * 2}px))`;

  const Dot = ({ active }: { active?: boolean }) => (
    <div
      style={{
        width: "22px",
        height: "22px",
        borderRadius: "50%",
        border: `3px solid ${active ? theme.palette.primary : "rgba(196, 205, 216, 0.85)"}`,
        background: active ? theme.palette.primary : "#0e1c27",
        boxShadow: active ? "0 0 0 5px rgba(83, 212, 107, 0.18)" : "none",
        boxSizing: "border-box"
      }}
    />
  );

  return (
    <Card
      style={{
        marginBottom: "12px",
        borderRadius: "22px",
        background:
          "linear-gradient(180deg, rgba(17, 49, 69, 0.94), rgba(10, 32, 46, 0.94))",
        border: "1px solid rgba(160, 200, 220, 0.18)"
      }}
    >
      <Text
        variant="h2"
        bold
        style={{ display: "block", marginBottom: "10px", fontSize: "18px" }}
      >
        {t("profile.goalTitle")}
      </Text>

      {/* Плавающий бейдж «Сейчас» — движется вместе с точкой */}
      <div style={{ position: "relative", height: "44px" }}>
        <div
          style={{
            position: "absolute",
            left: currentLeft,
            transform: "translateX(-50%)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            transition: "left 600ms cubic-bezier(0.22, 0.9, 0.24, 1)",
            whiteSpace: "nowrap"
          }}
        >
          <Text variant="small" muted style={{ fontSize: "12px" }}>
            {t("profile.current")}
          </Text>
          <Text bold style={{ fontSize: "20px", color: theme.palette.primary }}>
            {currentWeight ?? "—"}
          </Text>
        </div>
      </div>

      {/* Трек с заполнением и точками */}
      <div style={{ position: "relative", height: "22px" }}>
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            left: `${EDGE}px`,
            right: `${EDGE}px`,
            top: "8px",
            height: "6px",
            borderRadius: "999px",
            background: "rgba(196, 205, 216, 0.26)"
          }}
        />
        {/* пройденная часть старт → сейчас */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            left: `${EDGE}px`,
            width: `calc(${fraction} * (100% - ${EDGE * 2}px))`,
            top: "8px",
            height: "6px",
            borderRadius: "999px",
            background:
              "linear-gradient(90deg, rgba(83,212,107,0.5) 0%, #58D45D 100%)",
            transition: "width 600ms cubic-bezier(0.22, 0.9, 0.24, 1)"
          }}
        />

        {/* старт */}
        <div style={{ position: "absolute", left: 0, top: 0 }}>
          <Dot />
        </div>
        {/* цель */}
        <div style={{ position: "absolute", right: 0, top: 0 }}>
          <Dot />
        </div>
        {/* сейчас (движется) */}
        <div
          style={{
            position: "absolute",
            left: currentLeft,
            top: 0,
            transform: "translateX(-50%)",
            transition: "left 600ms cubic-bezier(0.22, 0.9, 0.24, 1)"
          }}
        >
          <Dot active />
        </div>
      </div>

      {/* Подписи краёв */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: "10px"
        }}
      >
        <div style={{ textAlign: "left" }}>
          <Text variant="small" muted style={{ display: "block", fontSize: "13px" }}>
            {t("profile.start")}
          </Text>
          <Text bold style={{ fontSize: "20px" }}>
            {startWeight ?? "—"}
          </Text>
        </div>
        <div style={{ textAlign: "right" }}>
          <Text variant="small" muted style={{ display: "block", fontSize: "13px" }}>
            {t("profile.target")}
          </Text>
          <Text bold style={{ fontSize: "20px" }}>
            {targetWeight ?? "—"}
          </Text>
        </div>
      </div>
    </Card>
  );
}
