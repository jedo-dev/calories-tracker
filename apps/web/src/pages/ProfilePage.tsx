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

function localToday(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

export function ProfilePage() {
  const navigate = useNavigate();
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingBody, setEditingBody] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [, setPrediction] = useState<any>(null);
  const [league, setLeague] = useState<LeagueState | null>(null);
  const [streakDays, setStreakDays] = useState(0);
  const [achievements, setAchievements] = useState<AchievementState[]>([]);
  const [hasWeightLog, setHasWeightLog] = useState(true);
  const [formData, setFormData] = useState<ProfileData>({ goal: "maintain" });
  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    setEditingBody(false);
    setError(null);

    try {
      const [
        profileRes,
        predictionRes,
        socialRes,
        leagueRes,
        achievementsRes,
        weightRes
      ] = await Promise.all([
        apiClient.get("/profile"),
        apiClient
          .get("/weight/prediction")
          .catch(() => ({ data: { available: false } })),
        apiClient.get("/social/me").catch(() => null),
        apiClient.get("/leaderboard/week/friends").catch(() => null),
        apiClient.get("/achievements").catch(() => null),
        apiClient.get("/weight/latest").catch(() => ({ data: null }))
      ]);

      // Текущий вес берём из журнала веса (/weight), а не из поля профиля.
      // Пустой журнал приходит как 200 с пустым телом → data == "".
      const latestWeight = weightRes?.data?.weightKg ?? null;
      setHasWeightLog(latestWeight != null);

      const loadedAvatar = profileRes.data.user?.avatarEmoji || "🦊";
      if (profileRes.data.profile) {
        setFormData({
          avatarEmoji: loadedAvatar,
          weightKg: latestWeight ?? profileRes.data.profile.weightKg,
          heightCm: profileRes.data.profile.heightCm,
          age: profileRes.data.profile.age,
          gender: profileRes.data.profile.gender,
          activityLevel: profileRes.data.profile.activityLevel,
          goal: profileRes.data.profile.goal || "maintain",
          startWeightKg: profileRes.data.profile.startWeightKg,
          targetWeightKg: profileRes.data.profile.targetWeightKg,
          targetDate: profileRes.data.profile.targetDate
        });
      } else {
        setFormData((prev) => ({ ...prev, avatarEmoji: loadedAvatar }));
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
      const payload: ProfileData = { ...formData };

      // Первичная инициализация веса: записи в журнале ещё нет, но пользователь
      // ввёл вес → заводим стартовый вес и создаём запись в /weight на сегодня.
      if (!hasWeightLog && payload.weightKg != null) {
        if (payload.startWeightKg == null) payload.startWeightKg = payload.weightKg;
        await apiClient
          .post("/weight", { date: localToday(), weightKg: payload.weightKg })
          .catch(() => null);
        setHasWeightLog(true);
      }

      await apiClient.patch("/profile", payload);
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

  if (loading) return <Loader />;

  return (
    <div
      style={{
        minHeight: "100vh",
        maxWidth: "520px",
        margin: "0 auto",
        padding: "12px",
        paddingBottom: "100px",
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
        avatarEmoji={formData.avatarEmoji || user?.avatarEmoji || "🦊"}
        league={league}
        streakDays={streakDays}
        editingBody={editingBody}
        onToggleEdit={() => setEditingBody((prev) => !prev)}
        onAvatarChange={(emoji) => handleChange("avatarEmoji", emoji)}
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
        />
      )}

      <ProfileBodyCard
        formData={formData}
        editing={editingBody}
        saving={saving}
        showWeightField={!hasWeightLog}
        onSubmit={handleSubmit}
        onChange={handleChange}
      />
    </div>
  );
}
