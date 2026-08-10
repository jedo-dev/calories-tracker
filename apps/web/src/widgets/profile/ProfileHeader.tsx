import { useTheme } from '../../theme/useTheme';
import { Text } from '../../ui/Text';
import { Avatar } from '../../ui/Avatar';
import { Icon } from '../../ui/Icon';
import { t } from '../../i18n';
import { AvatarPicker } from './AvatarPicker';
import type { LeagueState } from './types';

interface ProfileHeaderProps {
  displayName: string;
  username: string | null;
  avatarEmoji: string;
  league: LeagueState | null;
  streakDays: number;
  editingBody: boolean;
  onToggleEdit: () => void;
  onAvatarChange: (emoji: string) => void;
}

function formatDays(n: number) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return t('commandCenter.days_one', { count: n });
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return t('commandCenter.days_few', { count: n });
  return t('commandCenter.days_many', { count: n });
}

export function ProfileHeader({
  displayName,
  username,
  avatarEmoji,
  league,
  streakDays,
  editingBody,
  onToggleEdit,
  onAvatarChange,
}: ProfileHeaderProps) {
  const theme = useTheme();
  const leagueName = league?.league?.name || 'Bronze';
  const leagueColor = league?.league?.color || theme.palette.primary;

  return (
    <div
      style={{
        marginBottom: '12px',
        borderRadius: '22px',
        background: 'linear-gradient(180deg, rgba(17, 49, 69, 0.96), rgba(10, 32, 46, 0.96))',
        border: '1px solid rgba(160, 200, 220, 0.18)',
        boxShadow: '0 22px 44px rgba(0, 0, 0, 0.28)',
        padding: '14px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <button
        type="button"
        aria-label={editingBody ? t('common.cancel') : t('common.edit')}
        onClick={onToggleEdit}
        autoFocus
        style={{
          position: 'absolute',
          top: '14px',
          right: '14px',
          width: '36px',
          height: '36px',
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          background: 'rgba(255, 255, 255, 0.06)',
          color: theme.palette.text,
          display: 'grid',
          placeItems: 'center',
          cursor: 'pointer',
          fontSize: '18px',
         
        }}
      >
        {editingBody ? '×' : '✎'}
      </button>

      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', paddingRight: '46px' }}>
        <div
          style={{
            width: '100px',
            height: '100px',
            borderRadius: '50%',
            border: `5px solid ${theme.palette.primary}`,
            padding: '8px',
            flexShrink: 0,
            background: 'linear-gradient(180deg, rgba(83,212,107,0.12), rgba(83,212,107,0.04))',
          }}
        >
          <Avatar emoji={avatarEmoji} size={74} />
        </div>

        <div style={{ minWidth: 0, flex: 1 }}>
          <Text variant="h1" bold style={{ display: 'block', fontSize: '18px', lineHeight: '1.08', letterSpacing: '-0.03em' }}>
            {displayName}
          </Text>
          {username && (
            <Text variant="small" muted style={{ display: 'block', fontSize: '12px', marginTop: '2px' }}>
              {username}
            </Text>
          )}

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '8px', flexWrap: 'nowrap' }}>
            <div
              style={{
                padding: '6px 10px',
                borderRadius: '12px',
                background: `linear-gradient(180deg, ${leagueColor}, rgba(60, 170, 82, 0.95))`,
                color: '#fff',
                fontWeight: 700,
                fontSize: '12px',
                whiteSpace: 'nowrap',
                boxShadow: '0 8px 18px rgba(83,212,107,0.16)',
              }}
            >
              {leagueName}
            </div>
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
              <Icon name="fire" size={13} style={{ marginRight: 3 }} /> {streakDays > 0 ? formatDays(streakDays) : formatDays(2)}
            </div>
          </div>
        </div>
      </div>

      {editingBody && <AvatarPicker value={avatarEmoji} onChange={onAvatarChange} />}
    </div>
  );
}
