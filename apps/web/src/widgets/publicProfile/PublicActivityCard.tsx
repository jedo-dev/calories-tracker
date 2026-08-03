import { t } from '../../i18n';
import { Text } from '../../ui/Text';
import { publicCardStyle, PublicProfileEvent } from './types';

const EVENT_ICONS: Record<string, string> = {
  log_day: '📗',
  xp_gain: '⚡',
  streak_milestone: '🔥',
  follow: '➕',
  workout_completed: '🏋️',
  water_goal: '💧',
  achievement_earned: '🏆',
};

function getAchievementName(key: string): string {
  return t(`achievements.${key}_name`) || key;
}

function formatEventText(type: string, payload: Record<string, any>): string {
  switch (type) {
    case 'log_day':
      return `${t('feed.logDay')} (+${payload.xp || 10} XP)`;
    case 'xp_gain':
      return `${t('feed.xpGain')} (+${payload.xp || 2} XP)`;
    case 'streak_milestone':
      return `${t('feed.streakMilestone')} ${payload.streak || 0} ${t('feed.days')}`;
    case 'follow':
      return t('feed.followEvent');
    case 'workout_completed':
      return `${t('feed.workoutCompleted')} — ${payload.workoutName || ''}`;
    case 'water_goal':
      return t('feed.waterGoal');
    case 'achievement_earned':
      return `${t('feed.achievementEarned')} — ${getAchievementName(payload.achievementKey)}`;
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

export function PublicActivityCard({ events }: { events: PublicProfileEvent[] }) {
  return (
    <div style={publicCardStyle}>
      <Text variant="h2" bold style={{ display: 'block', fontSize: '16px', marginBottom: '10px' }}>
        {t('publicProfile.recentActivity')}
      </Text>
      {events.length === 0 ? (
        <Text variant="small" muted>{t('publicProfile.noActivity')}</Text>
      ) : (
        events.map((event, i) => {
          const text = formatEventText(event.type, event.payload);
          if (!text) return null;
          return (
            <div
              key={event.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '8px 0',
                borderBottom: i < events.length - 1 ? '1px solid rgba(255,255,255,0.07)' : 'none',
              }}
            >
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
                {EVENT_ICONS[event.type] || '✨'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <Text variant="small" style={{ display: 'block', lineHeight: 1.3 }}>{text}</Text>
                <Text variant="small" muted style={{ fontSize: '11px' }}>{timeAgo(event.createdAt)}</Text>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
