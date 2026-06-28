import { useTheme } from '../../theme/useTheme';
import { Text } from '../../ui/Text';
import { t } from '../../i18n';
import { ACHIEVEMENT_ITEMS } from '../achievements/constants';
import type { AchievementState } from './types';

interface ProfileAchievementsProps {
  achievements: AchievementState[];
  onAllClick: () => void;
  limit?: number;
  compact?: boolean;
}

export function ProfileAchievements({ achievements, onAllClick, limit = 4, compact = false }: ProfileAchievementsProps) {
  const theme = useTheme();
  const visibleItems = ACHIEVEMENT_ITEMS.slice(0, limit);
  const badgeSize = compact ? '60px' : '100%';
  const badgePadding = compact ? '6px' : '7px';
  const badgeGap = compact ? '6px' : '8px';
  const titleSize = compact ? '10px' : '11px';

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '8px' }}>
        <Text variant="h2" bold style={{ fontSize: '20px' }}>
          {t('profile.achievements')} 
        </Text>
        <button
          type="button"
          onClick={onAllClick}
          style={{
            border: 'none',
            background: 'transparent',
            color: theme.palette.primary,
            fontWeight: 700,
            fontSize: '16px',
            cursor: 'pointer',
            padding: 0,
          }}
        >
          {t('common.all')}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${visibleItems.length}, minmax(0, 1fr))`, gap: badgeGap, marginBottom: '12px' }}>
        {visibleItems.map((item) => {
          const unlocked = achievements.find((a) => a.key === item.key)?.unlocked ?? item.key === '7day_streak';
          return (
            <div key={item.key} style={{ textAlign: 'center', minWidth: 0 }}>
              <div
                style={{
                  width: badgeSize,
                  height: badgeSize,
                  borderRadius: '50%',
                  margin: '0 auto',
                  border: `2px solid ${unlocked ? theme.palette.primary : 'rgba(148, 163, 184, 0.45)'}`,
                  background: 'rgba(255,255,255,0.04)',
                  display: 'grid',
                  placeItems: 'center',
                  padding: badgePadding,
                  opacity: unlocked ? 1 : 0.72,
                  filter: unlocked ? 'none' : 'grayscale(85%)',
                }}
              >
                <img src={item.image} alt={item.key} style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '50%' }} />
              </div>
              <Text variant="small" muted style={{ display: 'block', marginTop: compact ? '4px' : '6px', fontSize: titleSize, lineHeight: '1.1', whiteSpace: 'pre-line' }}>
                {t(`achievements.${item.key}_short`)}
              </Text>
            </div>
          );
        })}
      </div>
    </>
  );
}
