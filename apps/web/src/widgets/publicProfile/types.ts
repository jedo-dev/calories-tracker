export interface PublicProfile {
  id: string;
  username?: string;
  displayName: string;
  avatarEmoji: string;
  isPublicProfile: boolean;
  league: { name: string; color: string };
  xpTotal: number;
  xpWeek: number;
  currentStreak: number;
  bestStreak: number;
  isFollowing: boolean;
  isSelf: boolean;
  recentEvents: PublicProfileEvent[];
}

export interface PublicProfileEvent {
  id: string;
  type: string;
  date: string;
  payload: Record<string, any>;
  createdAt: string;
}

export interface PublicAchievement {
  key: string;
  imageKey: string;
  unlocked: boolean;
  unlockedAt: string | null;
}

export interface MyStats {
  xpWeek: number;
  xpTotal: number;
  currentStreak: number;
  bestStreak: number;
}

export const publicCardStyle: React.CSSProperties = {
  borderRadius: '22px',
  background: 'linear-gradient(180deg, rgba(17, 49, 69, 0.96), rgba(10, 32, 46, 0.96))',
  border: '1px solid rgba(160, 200, 220, 0.18)',
  boxShadow: '0 22px 44px rgba(0, 0, 0, 0.28)',
  padding: '14px',
  marginBottom: '12px',
};
