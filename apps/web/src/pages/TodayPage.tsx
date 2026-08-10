import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { apiClient } from "../api/client";
import DeleteIcon from "../assets/DeleteIcon";
import EditIcon from "../assets/EditIcon";
import DayChanger from "../features/TodayComponents/DayChanger";
import FoodList, { MealGroup } from "../features/TodayComponents/FoodList";
import { t } from "../i18n";
import Loader from "../ui/Loader";
import { useTheme } from "../theme/useTheme";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { DashboardRing } from "../ui/DashboardRing";
import { Text } from "../ui/Text";
import { WaterCard } from "../widgets/water/WaterCard";

export interface Entry {
  _id: string;
  productId?: string;
  productName: string;
  grams: number;
  kcal: number;
  kcalPer100g?: number;
  protein: number;
  fat: number;
  carb: number;
  time?: string;
  mealType: string;
}

interface DashboardData {
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

interface SocialStats {
  user: {
    id: string;
    username?: string;
    displayName: string;
    avatarEmoji: string;
    createdAt: Date;
  };
}

type WaterState = {
  totalMl: number;
};

const MEAL_LABELS: Record<string, string> = {
  breakfast: "Завтрак",
  lunch: "Обед",
  dinner: "Ужин",
  snack: "Перекус",
  other: "Другие записи"
};

function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
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
          из {Math.round(target)}
        </Text>
        <Text variant="small" muted style={{ fontSize: "12px" }}>
          ккал
        </Text>
      </div>
    </div>
  );
}

function DashboardSlider({
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
              label="Белки"
              value={dashboard.consumed.protein}
              target={dashboard.targets.proteinTargetG}
              pct={dashboard.progress.proteinPct}
            />
            <MacroBar
              label="Жиры"
              value={dashboard.consumed.fat}
              target={dashboard.targets.fatTargetG}
              pct={dashboard.progress.fatPct}
            />
            <MacroBar
              label="Углеводы"
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

export function TodayPage() {
  const navigate = useNavigate();
  const theme = useTheme();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryDate = searchParams.get("date");
  const date = queryDate || formatDate(new Date());

  const setDate = (newDate: string) => {
    setSearchParams({ date: newDate });
  };

  const [entries, setEntries] = useState<Entry[]>([]);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [socialStats, setSocialStats] = useState<SocialStats | null>(null);
  const [water, setWater] = useState<WaterState>({ totalMl: 0 });
  const [selectedGroup, setSelectedGroup] = useState<MealGroup | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [entriesRes, dashboardRes, socialRes, waterRes] = await Promise.all(
        [
          apiClient.get(`/entries?date=${date}`),
          apiClient.get(`/dashboard/day?date=${date}`),
          apiClient.get("/social/me"),
          apiClient.get("/water", { params: { date } })
        ]
      );

      setEntries(entriesRes.data);
      setDashboard(dashboardRes.data);
      setSocialStats(socialRes.data);
      setWater(waterRes.data);
    } catch (err: any) {
      setError(
        err.response?.data?.message || err.message || t("dashboard.loadFailed")
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [date]);

  const handleAddWater = async (amountMl: number) => {
    try {
      await apiClient.post("/water", { date, amountMl });
      const res = await apiClient.get("/water", { params: { date } });
      setWater(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteEntry = async (id: string) => {
    if (!confirm(t("today.deleteConfirm"))) return;
    try {
      await apiClient.delete(`/entries/${id}`);
      await loadData();
      setSelectedGroup((current) =>
        current
          ? {
              ...current,
              entries: current.entries.filter((entry) => entry._id !== id),
              totalKcal: current.entries
                .filter((entry) => entry._id !== id)
                .reduce((sum, entry) => sum + entry.kcal, 0)
            }
          : current
      );
    } catch (err: any) {
      alert(err.response?.data?.message || t("today.deleteFailed"));
    }
  };

  if (loading) return <Loader />;
  if (error) {
    return (
      <div style={{ padding: theme.spacing.lg }}>
        <Text variant="h2" style={{ color: theme.palette.danger }}>
          {t("common.error")}: {error}
        </Text>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100dvh",
        padding: theme.spacing.lg,
        maxWidth: "600px",
        margin: "0 auto",
        paddingBottom: "120px",
        background: `
          radial-gradient(circle at top, rgba(83, 212, 107, 0.18), transparent 34%),
          radial-gradient(circle at 20% 25%, rgba(60, 140, 255, 0.12), transparent 24%),
          linear-gradient(180deg, #07111d 0%, ${theme.palette.bg} 28%, #081523 100%)
        `
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          marginBottom: theme.spacing.md
        }}
      ></div>

      <DayChanger
        setDate={setDate}
        date={date}
        registrationDate={socialStats?.user.createdAt}
      />

      {dashboard?.targets && dashboard.progress && (
        <Card
          style={{
            marginBottom: theme.spacing.md,
            background:
              "linear-gradient(180deg, rgba(18, 56, 79, 0.96) 0%, rgba(12, 37, 54, 0.98) 100%)",
            border: "1px solid rgba(146, 188, 221, 0.22)",
            borderRadius: "24px",
            boxShadow: "0 18px 36px rgba(0, 0, 0, 0.28)"
          }}
        >
          <DashboardSlider
            dashboard={{
              ...dashboard,
              targets: dashboard.targets,
              progress: dashboard.progress
            }}
          />
        </Card>
      )}

      {dashboard?.targets && !dashboard.progress && (
        <Card style={{ marginBottom: theme.spacing.md }}>
          <Text variant="h2" bold style={{ marginBottom: theme.spacing.sm }}>
            {t("today.totals")}
          </Text>
          <Text muted>{t("common.loading")}</Text>
        </Card>
      )}

      <WaterCard totalMl={water.totalMl} onAdd={handleAddWater} />

      <Button
        onClick={() => navigate("/entry/new")}
        style={{
          marginBottom: theme.spacing.md,
          minHeight: "58px",
          borderRadius: "18px",
          fontSize: "18px",
          boxShadow: "0 14px 28px rgba(81, 210, 105, 0.18)"
        }}
      >
        + Добавить запись
      </Button>

      {!dashboard?.targets && (
        <Card
          style={{
            marginBottom: theme.spacing.md,
            backgroundColor: theme.palette.primary + "18",
            border: `1px solid ${theme.palette.primary}`
          }}
        >
          <Text variant="h2" style={{ marginBottom: theme.spacing.sm }}>
            Заполни профиль
          </Text>
          <Text
            variant="small"
            muted
            style={{ display: "block", marginBottom: theme.spacing.md }}
          >
            Нужны вес, рост и цель, чтобы рассчитать норму и показать круг
            прогресса.
          </Text>
          <Button
            onClick={() => navigate("/profile")}
            style={{ width: "auto", minWidth: "180px" }}
          >
            Открыть профиль
          </Button>
        </Card>
      )}

      {dashboard && !dashboard.targets && (
        <Card style={{ marginBottom: theme.spacing.md }}>
          <Text variant="h2" bold style={{ marginBottom: theme.spacing.sm }}>
            {t("totals.kcal", { value: dashboard.consumed.kcal.toFixed(0) })}
          </Text>
          <Text muted>
            {t("totals.macros", {
              protein: dashboard.consumed.protein.toFixed(1),
              fat: dashboard.consumed.fat.toFixed(1),
              carb: dashboard.consumed.carb.toFixed(1),
              kcal: dashboard.consumed.kcal.toFixed(0)
            })}
          </Text>
        </Card>
      )}

      <FoodList
        entries={entries}
        onMealClick={(group) => setSelectedGroup(group)}
      />

      {selectedGroup && (
        <div
          onClick={() => setSelectedGroup(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.55)",
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
            padding: theme.spacing.sm,
            zIndex: 40
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "min(600px, 100%)",
              maxHeight: "78vh",
              overflow: "hidden",
              borderRadius: "28px",
              padding: 0,
              background:
                "linear-gradient(180deg, rgba(18, 52, 72, 0.98) 0%, rgba(9, 28, 42, 1) 100%)",
              border: "1px solid rgba(146, 188, 221, 0.18)",
              boxShadow: "0 -18px 50px rgba(0,0,0,0.45)",
              transform: "translateY(-60px)"
            }}
          >
            <div
              style={{
                padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                borderBottom: "1px solid rgba(255,255,255,0.08)"
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: theme.spacing.sm
                }}
              >
                <div>
                  <Text variant="h2" bold style={{ display: "block" }}>
                    {MEAL_LABELS[selectedGroup.mealType] ||
                      selectedGroup.mealType}
                  </Text>
                  <Text
                    variant="small"
                    muted
                    style={{ display: "block", marginTop: "2px" }}
                  >
                    {selectedGroup.entries.length} записей
                  </Text>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedGroup(null)}
                  style={{
                    width: "auto",
                    minWidth: "40px",
                    minHeight: "40px",
                    padding: 0
                  }}
                >
                  ×
                </Button>
              </div>
            </div>

            <div style={{ overflowY: "auto", maxHeight: "calc(78vh - 76px)" }}>
              {selectedGroup.entries.map((entry, index) => (
                <div
                  key={entry._id}
                  style={{
                    padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                    borderTop:
                      index === 0 ? "none" : "1px solid rgba(255,255,255,0.08)"
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: theme.spacing.sm,
                      alignItems: "flex-start"
                    }}
                  >
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <Text bold style={{ display: "block", fontSize: "17px" }}>
                        {entry.productName}
                      </Text>
                      <Text
                        variant="small"
                        muted
                        style={{ display: "block", marginTop: "3px" }}
                      >
                        {entry.grams} г · {entry.kcal.toFixed(0)} ккал
                      </Text>
                      <Text
                        variant="small"
                        muted
                        style={{ display: "block", marginTop: "2px" }}
                      >
                        Б: {entry.protein.toFixed(1)} · Ж:{" "}
                        {entry.fat.toFixed(1)} · У: {entry.carb.toFixed(1)}
                      </Text>
                    </div>

                    <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/entry/${entry._id}`)}
                        style={{
                          width: "auto",
                          minWidth: "44px",
                          minHeight: "44px",
                          padding: "0 10px"
                        }}
                        aria-label="Редактировать"
                      >
                        <EditIcon />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteEntry(entry._id)}
                        style={{
                          width: "auto",
                          minWidth: "44px",
                          minHeight: "44px",
                          padding: "0 10px"
                        }}
                        aria-label="Удалить"
                      >
                        <DeleteIcon />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
