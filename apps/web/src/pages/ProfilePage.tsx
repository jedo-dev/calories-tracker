import { type FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiClient } from "../api/client";
import { t } from "../i18n";
import { useTheme } from "../theme/useTheme";
import Loader from "../ui/Loader";
import { ProfileAchievements } from "../widgets/profile/ProfileAchievements";
import { ProfileBodyCard } from "../widgets/profile/ProfileBodyCard";
import { ProfileGoalCard } from "../widgets/profile/ProfileGoalCard";
import { ProfileHeader } from "../widgets/profile/ProfileHeader";
import type {
  AchievementState,
  LeagueState,
  ProfileData
} from "../widgets/profile/types";

export function ProfilePage() {
  const navigate = useNavigate();
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingBody, setEditingBody] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [prediction, setPrediction] = useState<any>(null);
  const [league, setLeague] = useState<LeagueState | null>(null);
  const [streakDays, setStreakDays] = useState(0);
  const [achievements, setAchievements] = useState<AchievementState[]>([]);
  const [formData, setFormData] = useState<ProfileData>({ goal: "maintain" });
  console.log(`prediction`, prediction);
  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    setEditingBody(false);
    setError(null);

    try {
      const [profileRes, predictionRes, socialRes, leagueRes, achievementsRes] =
        await Promise.all([
          apiClient.get("/profile"),
          apiClient
            .get("/weight/prediction")
            .catch(() => ({ data: { available: false } })),
          apiClient.get("/social/me").catch(() => null),
          apiClient.get("/leaderboard/week/friends").catch(() => null),
          apiClient.get("/achievements").catch(() => null)
        ]);

      if (profileRes.data.profile) {
        setFormData({
          weightKg: profileRes.data.profile.weightKg,
          heightCm: profileRes.data.profile.heightCm,
          age: profileRes.data.profile.age,
          gender: profileRes.data.profile.gender,
          activityLevel: profileRes.data.profile.activityLevel,
          goal: profileRes.data.profile.goal || "maintain",
          startWeightKg: profileRes.data.profile.startWeightKg,
          targetWeightKg: profileRes.data.profile.targetWeightKg,
          targetDate: profileRes.data.profile.targetDate
        });
      }

      setUser(profileRes.data.user);
      setPrediction(predictionRes.data);
      setStreakDays(socialRes?.data?.stats?.currentStreak || 0);
      if (leagueRes?.data?.me) setLeague(leagueRes.data.me);
      if (achievementsRes?.data) {
        setAchievements(
          achievementsRes.data.map((achievement: any) => ({
            key: achievement.key,
            unlocked: !!achievement.unlocked
          }))
        );
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message || err.message || t("profile.loadFailed")
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      await apiClient.patch("/profile", formData);
      setEditingBody(false);
      navigate("/today");
    } catch (err: any) {
      setError(
        err.response?.data?.message || err.message || t("profile.saveFailed")
      );
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: keyof ProfileData, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value === "" ? undefined : value
    }));
  };

  const displayName = user?.displayName || user?.username || "User";
  const username = user?.username ? `@${user.username}` : null;
  const goalProgress = (() => {
    const start = formData.startWeightKg;
    const current = formData.weightKg;
    const target = formData.targetWeightKg;

    if (start == null || current == null || target == null) return null;

    if (Math.abs(start - target) === 0) return { remaining: 0 };

    return { remaining: Math.max(0, Math.abs(current - target)) };
  })();

  if (loading) return <Loader />;

  return (
    <div
      style={{
        minHeight: "calc(100vh - 64px)",
        maxWidth: "520px",
        margin: "0 auto",
        padding: "12px 12px 12px",
        background: `
          radial-gradient(circle at top, rgba(83, 212, 107, 0.18), transparent 34%),
          radial-gradient(circle at 20% 25%, rgba(60, 140, 255, 0.12), transparent 24%),
          linear-gradient(180deg, #07111d 0%, ${theme.palette.bg} 28%, #081523 100%)
        `
      }}
    >
      <ProfileHeader
        displayName={displayName}
        username={username}
        league={league}
        streakDays={streakDays}
        editingBody={editingBody}
        onToggleEdit={() => setEditingBody((prev) => !prev)}
      />

      {error && (
        <div
          style={{ marginBottom: "10px", color: "#ff8a8a", fontSize: "14px" }}
        >
          {error}
        </div>
      )}

      {!editingBody && (
        <ProfileAchievements
          achievements={achievements}
          onAllClick={() => navigate("/achievements")}
          limit={4}
          compact
        />
      )}

      {!editingBody && (
        <ProfileGoalCard
          currentWeight={formData.weightKg}
          startWeight={formData.startWeightKg}
          targetWeight={formData.targetWeightKg}
          remainingWeight={goalProgress?.remaining ?? null}
        />
      )}

      <ProfileBodyCard
        formData={formData}
        editing={editingBody}
        saving={saving}
        onSubmit={handleSubmit}
        onChange={handleChange}
      />
    </div>
  );
}
