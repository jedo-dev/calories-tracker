export interface FriendUser {
  id: string;
  username?: string;
  displayName: string;
  avatarEmoji: string;
  isFollowing?: boolean;
  xpWeek?: number;
  currentStreak?: number;
  league?: { name: string; color: string };
}

export type FriendsTab = 'search' | 'following' | 'followers';
