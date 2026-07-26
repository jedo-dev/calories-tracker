import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiClient } from "../api/client";
import { t } from "../i18n";
import { useTheme } from "../theme/useTheme";
import Loader from "../ui/Loader";
import { Text } from "../ui/Text";
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
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "12px"
        }}
      >
        <button
          type="button"
          onClick={() => navigate("/profile")}
          style={{
            border: "1px solid rgba(255,255,255,0.1)",
            background: "rgba(255,255,255,0.05)",
            color: theme.palette.text,
            borderRadius: "14px",
            padding: "10px 12px",
            cursor: "pointer",
            fontWeight: 700,
            fontSize: "14px"
          }}
        >
          {"<"}
        </button>
        <div style={{ textAlign: "right" }}>
          <Text
            variant="h1"
            bold
            style={{ display: "block", fontSize: "24px", lineHeight: "1.1" }}
          >
            {t("achievements.title")}
          </Text>
          <Text
            variant="small"
            muted
            style={{ display: "block", fontSize: "12px", marginTop: "2px" }}
          >
            {unlockedCount}/{Math.max(achievements.length, 6)}{" "}
            {t("achievements.progress")}
          </Text>
        </div>
      </div>

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
