import { t } from '../../i18n';
import { useTheme } from '../../theme/useTheme';
import { Text } from '../../ui/Text';
import rankBronze from '../../assets/07_achievements/rank_bronze.jpg';
import rankSilver from '../../assets/07_achievements/rank_silver.jpg';
import rankGold from '../../assets/07_achievements/rank_gold.jpg';
import rankDiamond from '../../assets/07_achievements/rank_diamond.jpg';
import { publicCardStyle, PublicProfile } from './types';

const LEAGUE_IMAGES: Record<string, string> = {
  Bronze: rankBronze,
  Silver: rankSilver,
  Gold: rankGold,
  Diamond: rankDiamond,
};

interface PublicProfileHeaderProps {
  profile: PublicProfile;
  followBusy: boolean;
  onFollow: () => void;
  onUnfollow: () => void;
  onOpenMyProfile: () => void;
}

export function PublicProfileHeader({
  profile,
  followBusy,
  onFollow,
  onUnfollow,
  onOpenMyProfile,
}: PublicProfileHeaderProps) {
  const theme = useTheme();
  const leagueColor = profile.league?.color || theme.palette.primary;
  const rankImage = LEAGUE_IMAGES[profile.league?.name] || rankBronze;

  return (
    <div style={{ ...publicCardStyle, overflow: 'hidden' }}>
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
        <div
          style={{
            width: '92px',
            height: '92px',
            borderRadius: '50%',
            border: `5px solid ${leagueColor}`,
            flexShrink: 0,
            background: 'linear-gradient(180deg, rgba(83,212,107,0.12), rgba(83,212,107,0.04))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '44px',
          }}
        >
          {profile.avatarEmoji || '🦊'}
        </div>

        <div style={{ minWidth: 0, flex: 1 }}>
          <Text variant="h1" bold style={{ display: 'block', fontSize: '19px', lineHeight: 1.1, letterSpacing: '-0.03em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {profile.displayName}
          </Text>
          {profile.username && (
            <Text variant="small" muted style={{ display: 'block', fontSize: '12px', marginTop: '2px' }}>
              @{profile.username}
            </Text>
          )}

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '8px', flexWrap: 'wrap' }}>
            <div
              style={{
                padding: '6px 10px',
                borderRadius: '12px',
                background: `linear-gradient(180deg, ${leagueColor}, rgba(60, 170, 82, 0.95))`,
                color: '#fff',
                fontWeight: 700,
                fontSize: '12px',
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 8px 18px rgba(83,212,107,0.16)',
              }}
            >
              <img src={rankImage} alt="" style={{ width: '16px', height: '16px', objectFit: 'contain', borderRadius: '4px' }} />
              {profile.league?.name || 'Bronze'}
            </div>
            {profile.currentStreak > 0 && (
              <div
                style={{
                  padding: '6px 10px',
                  borderRadius: '12px',
                  background: 'linear-gradient(180deg, rgba(83,212,107,0.18), rgba(83,212,107,0.12))',
                  color: theme.palette.text,
                  border: '1px solid rgba(83,212,107,0.5)',
                  fontWeight: 700,
                  fontSize: '12px',
                  whiteSpace: 'nowrap',
                }}
              >
                🔥 {t('friends.streak', { count: profile.currentStreak })}
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{ marginTop: '12px' }}>
        {profile.isSelf ? (
          <button
            type="button"
            onClick={onOpenMyProfile}
            style={{
              width: '100%',
              height: '46px',
              borderRadius: '16px',
              border: '1px solid rgba(160, 200, 220, 0.24)',
              background: 'rgba(255,255,255,0.06)',
              color: theme.palette.text,
              fontSize: '14px',
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            {t('publicProfile.openMyProfile')}
          </button>
        ) : (
          <button
            type="button"
            disabled={followBusy}
            onClick={profile.isFollowing ? onUnfollow : onFollow}
            style={{
              width: '100%',
              height: '48px',
              borderRadius: '16px',
              border: profile.isFollowing ? '1px solid rgba(160, 200, 220, 0.28)' : 'none',
              background: profile.isFollowing
                ? 'rgba(255,255,255,0.06)'
                : 'linear-gradient(180deg, rgba(83, 212, 107, 1), rgba(60, 170, 82, 1))',
              color: profile.isFollowing ? theme.palette.textMuted : '#07210f',
              fontSize: '14px',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: profile.isFollowing ? 'none' : '0 14px 26px rgba(83, 212, 107, 0.22)',
              opacity: followBusy ? 0.6 : 1,
              fontFamily: 'inherit',
            }}
          >
            {profile.isFollowing ? t('publicProfile.unfollow') : t('publicProfile.follow')}
          </button>
        )}
      </div>
    </div>
  );
}
