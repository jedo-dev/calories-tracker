import { t } from '../../i18n';
import { useTheme } from '../../theme/useTheme';
import { Text } from '../../ui/Text';
import { publicCardStyle, MyStats, PublicProfile } from './types';

interface VersusCardProps {
  profile: PublicProfile;
  myStats: MyStats;
}

// New block: side-by-side weekly comparison against the viewed user.
export function VersusCard({ profile, myStats }: VersusCardProps) {
  const theme = useTheme();

  const rows: { label: string; mine: number; theirs: number }[] = [
    { label: t('publicProfile.xpWeek'), mine: myStats.xpWeek, theirs: profile.xpWeek },
    { label: t('publicProfile.streak'), mine: myStats.currentStreak, theirs: profile.currentStreak },
  ];

  const verdict =
    myStats.xpWeek === profile.xpWeek
      ? t('publicProfile.versusDraw')
      : myStats.xpWeek > profile.xpWeek
        ? t('publicProfile.versusWin')
        : t('publicProfile.versusLose');

  const bar = (value: number, max: number, color: string, alignRight: boolean) => (
    <div style={{ flex: 1, height: '8px', borderRadius: '4px', background: 'rgba(255,255,255,0.07)', overflow: 'hidden', display: 'flex', justifyContent: alignRight ? 'flex-end' : 'flex-start' }}>
      <div
        style={{
          width: `${max > 0 ? Math.max(4, (value / max) * 100) : 4}%`,
          height: '100%',
          borderRadius: '4px',
          background: color,
          transition: 'width 0.4s ease',
        }}
      />
    </div>
  );

  return (
    <div style={publicCardStyle}>
      <Text variant="h2" bold style={{ display: 'block', fontSize: '16px', marginBottom: '10px' }}>
        ⚔️ {t('publicProfile.versusTitle', { name: profile.displayName })}
      </Text>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
        <Text variant="small" bold style={{ color: theme.palette.primary }}>{t('publicProfile.versusYou')}</Text>
        <Text variant="small" bold style={{ color: '#7cb8ff' }}>{profile.displayName}</Text>
      </div>

      {rows.map((row) => {
        const max = Math.max(row.mine, row.theirs, 1);
        return (
          <div key={row.label} style={{ marginBottom: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ fontSize: '12px', fontWeight: 800, color: theme.palette.text, minWidth: '32px' }}>{row.mine}</span>
              <Text variant="small" muted style={{ fontSize: '11px' }}>{row.label}</Text>
              <span style={{ fontSize: '12px', fontWeight: 800, color: theme.palette.text, minWidth: '32px', textAlign: 'right' }}>{row.theirs}</span>
            </div>
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              {bar(row.mine, max, `linear-gradient(90deg, #3caa52, ${theme.palette.primary})`, true)}
              {bar(row.theirs, max, 'linear-gradient(90deg, #7cb8ff, #4c8fdd)', false)}
            </div>
          </div>
        );
      })}

      <Text variant="small" muted style={{ display: 'block', textAlign: 'center', marginTop: '4px' }}>
        {verdict}
      </Text>
    </div>
  );
}
