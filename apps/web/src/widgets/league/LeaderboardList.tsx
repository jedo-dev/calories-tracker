import { t } from '../../i18n';
import { useTheme } from '../../theme/useTheme';
import { Text } from '../../ui/Text';
import { Avatar } from '../../ui/Avatar';
import { leagueCardStyle, LeaderboardItem } from './types';

const MEDALS: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };

interface LeaderboardListProps {
  items: LeaderboardItem[];
  myUserId: string | null;
  onOpenUser: (userId: string) => void;
}

export function LeaderboardList({ items, myUserId, onOpenUser }: LeaderboardListProps) {
  const theme = useTheme();

  return (
    <>
      {items.map((item) => {
        const isMe = !!myUserId && item.user.id === myUserId;
        const medal = MEDALS[item.rank];
        return (
          <div
            key={item.user.id}
            onClick={() => onOpenUser(item.user.id)}
            style={{
              ...leagueCardStyle,
              padding: '10px 14px',
              marginBottom: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              border: isMe ? `1px solid ${theme.palette.primary}` : (leagueCardStyle.border as string),
              boxShadow: isMe ? '0 18px 34px rgba(83, 212, 107, 0.14)' : (leagueCardStyle.boxShadow as string),
            }}
          >
            <div
              style={{
                width: '34px',
                textAlign: 'center',
                fontSize: medal ? '20px' : '13px',
                fontWeight: 800,
                color: theme.palette.textMuted,
                flexShrink: 0,
              }}
            >
              {medal || `#${item.rank}`}
            </div>
            <Avatar
              emoji={item.user.avatarEmoji}
              size={42}
              borderWidth={2.5}
              borderColor={isMe ? theme.palette.primary : 'rgba(160, 200, 220, 0.35)'}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Text bold style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {item.user.displayName}
                </Text>
                {isMe && (
                  <span
                    style={{
                      fontSize: '10px',
                      padding: '2px 7px',
                      borderRadius: '9px',
                      background: `${theme.palette.primary}22`,
                      color: theme.palette.primary,
                      fontWeight: 800,
                      flexShrink: 0,
                    }}
                  >
                    {t('league.me')}
                  </span>
                )}
              </div>
              {item.user.username && (
                <Text variant="small" muted style={{ display: 'block', fontSize: '11px' }}>
                  @{item.user.username}
                </Text>
              )}
            </div>
            <span style={{ fontSize: '15px', fontWeight: 800, color: theme.palette.primary, whiteSpace: 'nowrap', flexShrink: 0 }}>
              {item.xpWeek} <span style={{ fontSize: '10px', color: theme.palette.textMuted, fontWeight: 600 }}>XP</span>
            </span>
          </div>
        );
      })}
    </>
  );
}
