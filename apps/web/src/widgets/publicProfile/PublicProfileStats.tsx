import type { ReactNode } from 'react';
import { t } from '../../i18n';
import { useTheme } from '../../theme/useTheme';
import { Text } from '../../ui/Text';
import { Icon } from '../../ui/Icon';
import { publicCardStyle, PublicProfile } from './types';

export function PublicProfileStats({ profile }: { profile: PublicProfile }) {
  const theme = useTheme();

  const stat = (value: ReactNode, label: string, accent = false) => (
    <div
      style={{
        textAlign: 'center',
        padding: '10px 6px',
        borderRadius: '14px',
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      <span
        style={{
          fontSize: '20px',
          fontWeight: 800,
          color: accent ? theme.palette.primary : theme.palette.text,
          display: 'block',
        }}
      >
        {value}
      </span>
      <Text variant="small" muted style={{ fontSize: '10px' }}>{label}</Text>
    </div>
  );

  return (
    <div style={publicCardStyle}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
        {stat(profile.xpWeek, t('publicProfile.xpWeek'), true)}
        {stat(profile.xpTotal, t('publicProfile.xpTotal'))}
        {stat(<><Icon name="fire" size={18} style={{ marginRight: 4 }} />{profile.currentStreak}</>, t('publicProfile.streak'))}
        {stat(<><Icon name="trophy" size={18} style={{ marginRight: 4 }} />{profile.bestStreak}</>, t('publicProfile.bestStreak'))}
      </div>
    </div>
  );
}
