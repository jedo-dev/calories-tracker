import { useEffect, useState } from "react";
import { glassCardStyle, pageBackground } from '../theme/styles';
import { useNavigate, useSearchParams } from "react-router-dom";
import { apiClient } from "../api/client";
import DayChanger from "../features/TodayComponents/DayChanger";
import FoodList, { MealGroup } from "../features/TodayComponents/FoodList";
import { t, toISODate } from '../i18n';
import Loader from "../ui/Loader";
import { useTheme } from "../theme/useTheme";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { ConfirmSheet } from "../ui/ConfirmSheet";
import { Text } from "../ui/Text";
import { showToast } from "../ui/Toast";
import { DashboardSlider, DashboardData } from "../widgets/today/DashboardSlider";
import { MealGroupSheet } from "../widgets/today/MealGroupSheet";
import { WaterCard } from "../widgets/water/WaterCard";
// import { OnboardingChallengeCard } from "../widgets/today/OnboardingChallengeCard";
import { calcWaterGoalMl } from "../widgets/water/waterGoal";
import { getCompletedScenarios, isTourActive, startTour, tourEvent } from "../tour/tour";

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

interface SocialStats {
  user: {
    id: string;
    username?: string;
    displayName: string;
    avatarEmoji: string;
    createdAt: Date;
  };
  stats?: {
    currentStreak: number;
    bestStreak: number;
  };
}

type WaterState = {
  totalMl: number;
};

export function TodayPage() {
  const navigate = useNavigate();
  const theme = useTheme();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryDate = searchParams.get("date");
  const date = queryDate || toISODate(new Date());

  const setDate = (newDate: string) => {
    setSearchParams({ date: newDate });
  };

  const [entries, setEntries] = useState<Entry[]>([]);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [deleteEntryId, setDeleteEntryId] = useState<string | null>(null);
  const [waterGoal, setWaterGoal] = useState(2000);
  const [socialStats, setSocialStats] = useState<SocialStats | null>(null);
  const [water, setWater] = useState<WaterState>({ totalMl: 0 });
  const [selectedGroup, setSelectedGroup] = useState<MealGroup | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [entriesRes, dashboardRes, socialRes, waterRes, weightRes] =
        await Promise.all([
          apiClient.get(`/entries?date=${date}`),
          apiClient.get(`/dashboard/day?date=${date}`),
          apiClient.get("/social/me"),
          apiClient.get("/water", { params: { date } }),
          apiClient.get("/weight/latest").catch(() => ({ data: null }))
        ]);

      setEntries(entriesRes.data);
      setDashboard(dashboardRes.data);
      setSocialStats(socialRes.data);
      setWater(waterRes.data);
      setWaterGoal(calcWaterGoalMl(weightRes?.data?.weightKg));
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

  // Новичку без нормы калорий один раз предлагаем тур по заполнению профиля.
  // Тур ненавязчивый: первый же шаг содержит «Пропустить».
  useEffect(() => {
    if (loading || dashboard?.targets || !isToday) return;
    if (isTourActive()) return;
    if (getCompletedScenarios().includes("fill-profile")) return;
    if (localStorage.getItem("tour_profile_offered")) return;
    localStorage.setItem("tour_profile_offered", "1");
    startTour("fill-profile");
  }, [loading, dashboard]);

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
    try {
      await apiClient.delete(`/entries/${id}`);
      // Локальное обновление вместо полного reload дня (4 запроса + Loader
      // схлопывал весь экран). Дашборд обновляем тихо, без спиннера.
      setEntries((prev) => prev.filter((entry) => entry._id !== id));
      apiClient
        .get(`/dashboard/day?date=${date}`)
        .then((res) => setDashboard(res.data))
        .catch(() => {});
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
      tourEvent("entry_deleted");
    } catch (err: any) {
      showToast(err.response?.data?.message || t("today.deleteFailed"));
    } finally {
      setDeleteEntryId(null);
    }
  };

  // Прошлые (и любые не сегодняшние) дни — только просмотр: без добавления
  // записей, воды и редактирования
  const isToday = date === toISODate(new Date());

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
        paddingTop: `calc(${theme.spacing.lg} + env(safe-area-inset-top, 0px))`,
        maxWidth: "600px",
        margin: "0 auto",
        paddingBottom: "120px",
        background: pageBackground(theme.palette.bg)
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

      {/* Челлендж новичка показываем только на сегодняшнем дне */}
      {/* {socialStats?.stats && isToday && (
        <OnboardingChallengeCard
          currentStreak={socialStats.stats.currentStreak}
          bestStreak={socialStats.stats.bestStreak}
          hasEntriesToday={entries.length > 0}
        />
      )} */}

      {dashboard?.targets && dashboard.progress && (
        // div-обёртка: Card не пробрасывает data-атрибуты, а якорь нужен туру
        <div data-tour="today-dashboard">
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
        </div>
      )}

      {dashboard?.targets && !dashboard.progress && (
        <Card style={{ marginBottom: theme.spacing.md }}>
          <Text variant="h2" bold style={{ marginBottom: theme.spacing.sm }}>
            {t("today.totals")}
          </Text>
          <Text muted>{t("common.loading")}</Text>
        </Card>
      )}

      <WaterCard totalMl={water.totalMl} goal={waterGoal} onAdd={handleAddWater} readOnly={!isToday} />

      {/* Стиль главной CTA — как у «+ Еда» в листе быстрых действий */}
      {isToday && (
      <button
        type="button"
        data-tour="today-add-entry"
        onClick={() => navigate("/entry/new")}
        style={{
          width: "100%",
          minHeight: "54px",
          borderRadius: "16px",
          border: "none",
          background: "linear-gradient(180deg, rgba(83, 212, 107, 1), rgba(60, 170, 82, 1))",
          color: "#07210f",
          fontSize: "15px",
          fontWeight: 700,
          cursor: "pointer",
          boxShadow: "0 14px 26px rgba(83, 212, 107, 0.22)",
          outline: "none",
          WebkitTapHighlightColor: "transparent",
          marginBottom: theme.spacing.md
        }}
      >
        {t("today.addEntry")}
      </button>
      )}

      {!dashboard?.targets && (
        <Card style={{ ...glassCardStyle, marginBottom: theme.spacing.md }}>
          <Text variant="h2" bold style={{ marginBottom: theme.spacing.sm }}>
            {t("dashboard.fillProfile")}
          </Text>
          <Text
            variant="small"
            muted
            style={{ display: "block", marginBottom: theme.spacing.md }}
          >
            {t("dashboard.fillProfileDesc")}
          </Text>
          <Button
            variant="ghost"
            size="sm"
            data-tour="today-open-profile"
            onClick={() => navigate("/profile?edit=1")}
            style={{
              width: "auto",
              minWidth: "180px",
              borderColor: "rgba(88, 212, 93, 0.8)",
              color: theme.palette.primary,
              backgroundColor: "rgba(88, 212, 93, 0.06)"
            }}
          >
            {t("dashboard.openProfile")}
          </Button>
        </Card>
      )}

      <div data-tour="today-food-list">
        <FoodList
          entries={entries}
          onMealClick={(group) => {
            setSelectedGroup(group);
            tourEvent("meal_opened");
          }}
        />
      </div>

      {selectedGroup && (
        <MealGroupSheet
          group={selectedGroup}
          readOnly={!isToday}
          onClose={() => setSelectedGroup(null)}
          onEditEntry={(id) => navigate(`/entry/${id}`)}
          onDeleteEntry={(id) => {
            // Закрываем шит приёма пищи, чтобы подтверждение удаления
            // не наслаивалось на него вторым модальным окном
            setSelectedGroup(null);
            setDeleteEntryId(id);
          }}
        />
      )}

      <ConfirmSheet
        isOpen={deleteEntryId !== null}
        title={t("today.deleteConfirm")}
        confirmLabel={t("common.delete")}
        danger
        onConfirm={() => deleteEntryId && handleDeleteEntry(deleteEntryId)}
        onClose={() => setDeleteEntryId(null)}
      />
    </div>
  );
}
