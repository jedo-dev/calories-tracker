import { useEffect, useMemo, useState } from "react";
import { pageBackground } from '../theme/styles';
import { useNavigate } from "react-router-dom";
import { apiClient } from "../api/client";
import { t } from "../i18n";
import { useTheme } from "../theme/useTheme";
import Loader from "../ui/Loader";
import { PageHeader } from "../ui/PageHeader";
import { AchievementsGallery } from "../widgets/achievements/AchievementsGallery";
import type { AchievementState } from "../widgets/profile/types";

export function AchievementsPage() {
  const navigate = useNavigate();
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [achievements, setAchievements] = useState<AchievementState[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await apiClient.get("/achievements");
        if (!mounted) return;
        setAchievements(
          Array.isArray(res.data)
            ? res.data.map((achievement: any) => ({
                key: achievement.key,
                unlocked: !!achievement.unlocked
              }))
            : []
        );
      } catch (err: any) {
        if (!mounted) return;
        setError(
          err.response?.data?.message || err.message || t("profile.loadFailed")
        );
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();

    return () => {
      mounted = false;
    };
  }, []);

  const unlockedCount = useMemo(
    () => achievements.filter((item) => item.unlocked).length,
    [achievements]
  );

  if (loading) return <Loader />;

  return (
    <div
      style={{
        minHeight: "100vh",
        maxWidth: "520px",
        margin: "0 auto",
        padding: "12px 12px 96px",
        background: pageBackground(theme.palette.bg)
      }}
    >
      <PageHeader
        title={t("achievements.title")}
        subtitle={`${unlockedCount}/${Math.max(achievements.length, 6)} ${t("achievements.progress")}`}
        onBack={() => navigate("/profile")}
      />

      {error && (
        <div
          style={{ marginBottom: "10px", color: "#ff8a8a", fontSize: "14px" }}
        >
          {error}
        </div>
      )}

      <AchievementsGallery achievements={achievements} />
    </div>
  );
}
