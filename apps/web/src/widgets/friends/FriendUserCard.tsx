import { t } from '../../i18n';
import { useTheme } from '../../theme/useTheme';
import { Text } from '../../ui/Text';
import { Avatar } from '../../ui/Avatar';
import { Icon } from '../../ui/Icon';
import rankBronze from '../../assets/07_achievements/rank_bronze.jpg';
import rankSilver from '../../assets/07_achievements/rank_silver.jpg';
import rankGold from '../../assets/07_achievements/rank_gold.jpg';
import rankDiamond from '../../assets/07_achievements/rank_diamond.jpg';
import type { FriendUser } from './types';

const LEAGUE_IMAGES: Record<string, string> = {
  Bronze: rankBronze,
  Silver: rankSilver,
  Gold: rankGold,
  Diamond: rankDiamond,
};

interface FriendUserCardProps {
  user: FriendUser;
  // 'toggle' shows follow/unfollow depending on user.isFollowing; 'unfollow' always shows unfollow
  action: 'toggle' | 'unfollow';
  busy?: boolean;
  onOpen: () => void;
  onFollow: () => void;
  onUnfollow: () => void;
}

export function FriendUserCard({ user, action, busy, onOpen, onFollow, onUnfollow }: FriendUserCardProps) {
  const theme = useTheme();
  const leagueImg = user.league ? LEAGUE_IMAGES[user.league.name] || rankBronze : null;
  const showUnfollow = action === 'unfollow' || user.isFollowing;

  return (
    <div
      onClick={onOpen}
      style={{
        marginBottom: '10px',
        borderRadius: '22px',
        background: 'linear-gradient(180deg, rgba(17, 49, 69, 0.96), rgba(10, 32, 46, 0.96))',
        border: '1px solid rgba(160, 200, 220, 0.18)',
        boxShadow: '0 22px 44px rgba(0, 0, 0, 0.28)',
        padding: '12px 14px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
      }}
    >
      <Avatar
        emoji={user.avatarEmoji}
        size={52}
        borderWidth={3}
        borderColor={user.league?.color || theme.palette.primary}
      />

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Text bold style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user.displayName}
          </Text>
          {leagueImg && (
            <img
              src={leagueImg}
              alt={user.league!.name}
              loading="lazy"
              style={{ width: '18px', height: '18px', objectFit: 'contain', flexShrink: 0, borderRadius: '5px' }}
            />
          )}
        </div>
        {user.username && (
          <Text variant="small" muted style={{ display: 'block', fontSize: '12px' }}>
            @{user.username}
          </Text>
        )}
        <div style={{ display: 'flex', gap: '6px', marginTop: '6px', flexWrap: 'wrap' }}>
          {user.xpWeek !== undefined && (
            <span
              style={{
                fontSize: '10px',
                padding: '3px 8px',
                borderRadius: '10px',
                background: 'rgba(96,165,250,0.16)',
                color: '#7cb8ff',
                fontWeight: 700,
              }}
            >
              <Icon name="xp-bolt" size={12} style={{ marginRight: 3 }} /> {t('friends.xpWeek', { xp: user.xpWeek })}
            </span>
          )}
          {user.currentStreak !== undefined && user.currentStreak > 0 && (
            <span
              style={{
                fontSize: '10px',
                padding: '3px 8px',
                borderRadius: '10px',
                background: 'rgba(255,196,87,0.14)',
                color: '#ffc457',
                fontWeight: 700,
              }}
            >
              <Icon name="fire" size={12} style={{ marginRight: 3 }} /> {t('friends.streak', { count: user.currentStreak })}
            </span>
          )}
        </div>
      </div>

      <button
        type="button"
        disabled={busy}
        onClick={(e) => {
          e.stopPropagation();
          showUnfollow ? onUnfollow() : onFollow();
        }}
        style={{
          flexShrink: 0,
          padding: '9px 14px',
          borderRadius: '13px',
          border: showUnfollow ? '1px solid rgba(160, 200, 220, 0.28)' : 'none',
          background: showUnfollow
            ? 'rgba(255,255,255,0.06)'
            : 'linear-gradient(180deg, rgba(83, 212, 107, 1), rgba(60, 170, 82, 1))',
          color: showUnfollow ? theme.palette.textMuted : '#07210f',
          fontSize: '12px',
          fontWeight: 700,
          cursor: 'pointer',
          boxShadow: showUnfollow ? 'none' : '0 10px 20px rgba(83, 212, 107, 0.2)',
          opacity: busy ? 0.5 : 1,
          fontFamily: 'inherit',
          whiteSpace: 'nowrap',
        }}
      >
        {showUnfollow ? t('friends.unfollow') : t('friends.follow')}
      </button>
    </div>
  );
}
