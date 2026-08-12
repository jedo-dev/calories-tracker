import { IconBook, IconDownload } from '../../ui/navIcons';
import { t } from '../../i18n';
import { useTheme } from '../../theme/useTheme';
import { Text } from '../../ui/Text';
import { Avatar } from '../../ui/Avatar';
import { Icon, EmojiIcon } from '../../ui/Icon';

export interface FeedItem {
  id: string;
  type:
    | 'log_day'
    | 'streak_milestone'
    | 'xp_gain'
    | 'follow'
    | 'workout_completed'
    | 'water_goal'
    | 'achievement_earned'
    | 'recipe_published';
  date: string;
  user: {
    id: string;
    displayName: string;
    avatarEmoji: string;
  };
  payload: Record<string, any>;
  reactions: Record<string, string[]>;
  createdAt: string;
}

export const REACTION_EMOJIS = ['🔥', '💪', '👏'];

const EVENT_ICONS: Record<string, string> = {
  log_day: '📗',
  xp_gain: '⚡',
  streak_milestone: '🔥',
  follow: '➕',
  workout_completed: '🏋️',
  water_goal: '💧',
  achievement_earned: '🏆',
  recipe_published: '🍽️',
};

function getAchievementName(key: string): string {
  return t(`achievements.${key}_name`) || key;
}

function getEventText(item: FeedItem): string {
  switch (item.type) {
    case 'log_day':
      return `${t('feed.logDay')} (+${item.payload.xp || 10} XP)`;
    case 'xp_gain':
      return `${t('feed.xpGain')} (+${item.payload.xp || 2} XP)`;
    case 'streak_milestone':
      return `${t('feed.streakMilestone')} ${item.payload.streak || 0} ${t('feed.days')} 🔥`;
    case 'follow':
      return t('feed.followEvent');
    case 'workout_completed':
      return `${t('feed.workoutCompleted')} — ${item.payload.workoutName || ''}`;
    case 'water_goal':
      return t('feed.waterGoal');
    case 'achievement_earned':
      return `${t('feed.achievementEarned')} — ${getAchievementName(item.payload.achievementKey)}`;
    case 'recipe_published':
      return `${t('feed.recipePublished')} «${item.payload.recipeName || ''}»`;
    default:
      return '';
  }
}

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = Math.floor((now - then) / 1000);
  if (diff < 60) return t('feed.justNow');
  if (diff < 3600) return t('feed.minutesAgo', { n: Math.floor(diff / 60) });
  if (diff < 86400) return t('feed.hoursAgo', { n: Math.floor(diff / 3600) });
  return t('feed.daysAgo', { n: Math.floor(diff / 86400) });
}

interface FeedEventCardProps {
  item: FeedItem;
  myUserId: string | null;
  onOpenUser: () => void;
  onReact: (emoji: string) => void;
  onOpenRecipe: (recipeId: string) => void;
  onAddRecipeToDiary: (payload: Record<string, any>) => void;
}

export function FeedEventCard({
  item,
  myUserId,
  onOpenUser,
  onReact,
  onOpenRecipe,
  onAddRecipeToDiary,
}: FeedEventCardProps) {
  const theme = useTheme();

  return (
    <div
      style={{
        marginBottom: '10px',
        borderRadius: '22px',
        background: 'linear-gradient(180deg, rgba(17, 49, 69, 0.96), rgba(10, 32, 46, 0.96))',
        border: '1px solid rgba(160, 200, 220, 0.18)',
        boxShadow: '0 22px 44px rgba(0, 0, 0, 0.28)',
        padding: '12px 14px',
      }}
    >
      {/* user row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <button
          type="button"
          onClick={onOpenUser}
          aria-label={item.user.displayName}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            flexShrink: 0,
            padding: 0,
          }}
        >
          <Avatar
            emoji={item.user.avatarEmoji}
            size={44}
            borderWidth={2.5}
            borderColor={theme.palette.primary}
          />
        </button>
        <button
          type="button"
          onClick={onOpenUser}
          style={{
            flex: 1,
            minWidth: 0,
            background: 'none',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
            textAlign: 'left',
            color: theme.palette.text,
            fontFamily: 'inherit',
          }}
        >
          <Text bold style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {item.user.displayName}
          </Text>
        </button>
        <Text variant="small" muted style={{ flexShrink: 0, whiteSpace: 'nowrap', fontSize: '11px' }}>
          {timeAgo(item.createdAt)}
        </Text>
      </div>

      {/* event row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px' }}>
        <div
          style={{
            width: '34px',
            height: '34px',
            borderRadius: '11px',
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '16px',
            flexShrink: 0,
          }}
        >
          <EmojiIcon emoji={EVENT_ICONS[item.type] || '✨'} size={20} />
        </div>
        <Text variant="small" style={{ flex: 1, minWidth: 0, lineHeight: 1.35 }}>
          {getEventText(item)}
        </Text>
      </div>

      {/* recipe preview */}
      {item.type === 'recipe_published' && item.payload.recipeId && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginTop: '10px',
            padding: '8px',
            borderRadius: '14px',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          {item.payload.photoUrl ? (
            <img
              src={item.payload.photoUrl}
              alt={item.payload.recipeName}
              style={{ width: '46px', height: '46px', borderRadius: '12px', objectFit: 'cover', flexShrink: 0, border: '1px solid rgba(255,255,255,0.08)' }}
            />
          ) : (
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '12px',
                background: 'rgba(255,255,255,0.06)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px',
                flexShrink: 0,
              }}
            >
              <Icon name="meal" size={24} />
            </div>
          )}
          <div style={{ display: 'flex', gap: '6px', flex: 1, minWidth: 0 }}>
            <button
              type="button"
              onClick={() => onOpenRecipe(item.payload.recipeId)}
              style={{
                flex: 1,
                height: '36px',
                borderRadius: '12px',
                border: '1px solid rgba(160, 200, 220, 0.24)',
                background: 'rgba(255,255,255,0.06)',
                color: theme.palette.text,
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              <IconBook size={14} style={{ verticalAlign: '-2px', marginRight: '5px' }} />{t('feed.openRecipe')}
            </button>
            <button
              type="button"
              onClick={() => onAddRecipeToDiary(item.payload)}
              style={{
                flex: 1,
                height: '36px',
                borderRadius: '12px',
                border: 'none',
                background: 'linear-gradient(180deg, rgba(83, 212, 107, 1), rgba(60, 170, 82, 1))',
                color: '#07210f',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              <IconDownload size={14} style={{ verticalAlign: '-2px', marginRight: '5px' }} />{t('feed.toDiary')}
            </button>
          </div>
        </div>
      )}

      {/* reactions */}
      <div style={{ display: 'flex', gap: '6px', marginTop: '10px' }}>
        {REACTION_EMOJIS.map((emoji) => {
          const count = (item.reactions[emoji] || []).length;
          const isActive = !!myUserId && (item.reactions[emoji] || []).includes(myUserId);
          return (
            <button
              key={emoji}
              type="button"
              onClick={() => onReact(emoji)}
              aria-pressed={isActive}
              aria-label={`${emoji} ${count > 0 ? count : ''}`}
              style={{
                padding: '6px 11px',
                borderRadius: '12px',
                border: `1px solid ${isActive ? theme.palette.primary : 'rgba(255,255,255,0.12)'}`,
                background: isActive
                  ? `linear-gradient(180deg, ${theme.palette.primary}33, ${theme.palette.primary}1f)`
                  : 'rgba(255,255,255,0.05)',
                color: isActive ? theme.palette.primary : theme.palette.textMuted,
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                fontFamily: 'inherit',
              }}
            >
              <EmojiIcon emoji={emoji} size={18} />
              {count > 0 && <span style={{ fontSize: '11px' }}>{count}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
