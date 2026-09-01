export interface ProfileData {
  avatarEmoji?: string;
  weightKg?: number;
  heightCm?: number;
  age?: number;
  gender?: 'male' | 'female';
  activityLevel?: 'low' | 'medium' | 'high' | 'very_high';
  goal?: 'lose' | 'maintain' | 'gain';
  startWeightKg?: number;
  targetWeightKg?: number;
}

export interface LeagueState {
  league: { name: string; color: string };
  rank: number;
  xpTotal: number;
  xpWeek: number;
}

export interface AchievementState {
  key: string;
  unlocked: boolean;
}
