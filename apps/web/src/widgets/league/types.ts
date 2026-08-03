export interface LeaderboardItem {
  rank: number;
  user: {
    id: string;
    displayName: string;
    username?: string;
    avatarEmoji: string;
  };
  xpWeek: number;
}

export interface League {
  name: string;
  color: string;
  minXP: number;
  maxXP: number;
}

export interface LeaderboardMe {
  rank: number;
  xpWeek: number;
  xpTotal: number;
  league: League;
  nextLeagueXP: number | null;
  progress: number;
}

export interface LeaderboardResponse {
  weekKey: string;
  me?: LeaderboardMe;
  items: LeaderboardItem[];
}

export const leagueCardStyle: React.CSSProperties = {
  borderRadius: '22px',
  background: 'linear-gradient(180deg, rgba(17, 49, 69, 0.96), rgba(10, 32, 46, 0.96))',
  border: '1px solid rgba(160, 200, 220, 0.18)',
  boxShadow: '0 22px 44px rgba(0, 0, 0, 0.28)',
  padding: '14px',
  marginBottom: '12px',
};
