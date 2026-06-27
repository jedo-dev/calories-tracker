import { useTheme } from '../../theme/useTheme';
import { Card } from '../../ui/Card';
import { Text } from '../../ui/Text';
import { t } from '../../i18n';
import { ACHIEVEMENT_ITEMS } from './constants';
import type { AchievementState } from '../profile/types';

interface AchievementsGalleryProps {
  achievements: AchievementState[];
}

function isUnlocked(achievements: AchievementState[], key: string) {
  const found = achievements.find((item) => item.key === key);
  return found ? found.unlocked : key === '7day_streak';
}

function resolveText(value: string, fallback: string) {
  return value === fallback ? fallback : value;
}

export function AchievementsGallery({ achievements }: AchievementsGalleryProps) {
  const theme = useTheme();

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '10px' }}>
      {ACHIEVEMENT_ITEMS.map((item) => {
        const unlocked = isUnlocked(achievements, item.key);
        const nameKey = `achievements.${item.key}_name`;
        const shortKey = `achievements.${item.key}_short`;
        const descKey = `achievements.${item.key}_desc`;
        const name = resolveText(t(nameKey), nameKey);
        const short = resolveText(t(shortKey), shortKey);
        const desc = resolveText(t(descKey), descKey);

        return (
          <Card
            key={item.key}
            style={{
              borderRadius: '20px',
              background: 'linear-gradient(180deg, rgba(17, 49, 69, 0.92), rgba(10, 32, 46, 0.92))',
              border: '1px solid rgba(160, 200, 220, 0.16)',
              padding: '12px',
              opacity: unlocked ? 1 : 0.72,
              filter: unlocked ? 'none' : 'grayscale(85%)',
            }}
          >
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '18px',
                  border: `2px solid ${unlocked ? theme.palette.primary : 'rgba(148, 163, 184, 0.35)'}`,
                  background: 'rgba(255,255,255,0.04)',
                  padding: '7px',
                  flexShrink: 0,
                }}
              >
                <img
                  src={item.image}
                  alt={item.key}
                  style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '12px' }}
                />
              </div>

              <div style={{ minWidth: 0, flex: 1 }}>
                <Text variant="h2" bold style={{ display: 'block', fontSize: '16px', lineHeight: '1.1', marginBottom: '4px' }}>
                  {name === nameKey ? short : name}
                </Text>
                <Text variant="small" muted style={{ display: 'block', fontSize: '12px', lineHeight: '1.25' }}>
                  {desc === descKey ? short : desc}
                </Text>
                <Text
                  variant="small"
                  style={{
                    display: 'inline-block',
                    marginTop: '8px',
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '5px 10px',
                    borderRadius: '999px',
                    background: unlocked ? 'rgba(83, 212, 107, 0.14)' : 'rgba(148, 163, 184, 0.10)',
                    color: unlocked ? theme.palette.primary : theme.palette.textMuted,
                    border: `1px solid ${unlocked ? 'rgba(83, 212, 107, 0.42)' : 'rgba(148, 163, 184, 0.18)'}`,
                  }}
                >
                  {unlocked ? t('achievements.unlocked') : t('achievements.locked')}
                </Text>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
