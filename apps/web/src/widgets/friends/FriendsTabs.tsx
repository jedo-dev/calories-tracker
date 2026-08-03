import { t } from '../../i18n';
import { useTheme } from '../../theme/useTheme';
import type { FriendsTab } from './types';

interface FriendsTabsProps {
  tab: FriendsTab;
  onChange: (tab: FriendsTab) => void;
  followingCount: number | null;
  followersCount: number | null;
}

export function FriendsTabs({ tab, onChange, followingCount, followersCount }: FriendsTabsProps) {
  const theme = useTheme();

  const items: { key: FriendsTab; label: string }[] = [
    { key: 'search', label: t('friends.search') },
    { key: 'following', label: followingCount != null ? `${t('friends.following')} · ${followingCount}` : t('friends.following') },
    { key: 'followers', label: followersCount != null ? `${t('friends.followers')} · ${followersCount}` : t('friends.followers') },
  ];

  return (
    <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', overflowX: 'auto', scrollbarWidth: 'none' }}>
      {items.map((item) => {
        const active = tab === item.key;
        return (
          <button
            key={item.key}
            type="button"
            onClick={() => onChange(item.key)}
            style={{
              padding: '8px 12px',
              borderRadius: '12px',
              border: `1px solid ${active ? theme.palette.primary : 'rgba(255,255,255,0.12)'}`,
              background: active
                ? `linear-gradient(180deg, ${theme.palette.primary}33, ${theme.palette.primary}1f)`
                : 'rgba(255,255,255,0.06)',
              color: active ? theme.palette.primary : theme.palette.textMuted,
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              flexShrink: 0,
              fontFamily: 'inherit',
            }}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
