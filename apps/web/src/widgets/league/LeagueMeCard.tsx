import { t } from '../../i18n';
import { useTheme } from '../../theme/useTheme';
import { Text } from '../../ui/Text';
import rankBronze from '../../assets/07_achievements/rank_bronze.jpg';
import rankSilver from '../../assets/07_achievements/rank_silver.jpg';
import rankGold from '../../assets/07_achievements/rank_gold.jpg';
import rankDiamond from '../../assets/07_achievements/rank_diamond.jpg';
import { leagueCardStyle, LeaderboardMe } from './types';

const LEAGUE_IMAGES: Record<string, string> = {
  Bronze: rankBronze,
  Silver: rankSilver,
  Gold: rankGold,
  Diamond: rankDiamond,
};

export function LeagueMeCard({ me }: { me: LeaderboardMe }) {
  const theme = useTheme();
  const leagueColor = me.league.color || theme.palette.primary;
  const leagueImg = LEAGUE_IMAGES[me.league.name] || rankBronze;

  const stat = (value: string | number, label: string, accent = false) => (
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
    <div style={{ ...leagueCardStyle, overflow: 'hidden' }}>
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '12px' }}>
        <div
          style={{
            width: '76px',
            height: '76px',
            borderRadius: '50%',
            border: `4px solid ${leagueColor}`,
            padding: '5px',
            flexShrink: 0,
            background: 'linear-gradient(180deg, rgba(83,212,107,0.12), rgba(83,212,107,0.04))',
          }}
        >
          <img
            src={leagueImg}
            alt={me.league.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
          />
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <Text variant="small" muted style={{ display: 'block', fontSize: '11px' }}>
            {t('league.currentLeague')}
          </Text>
          <Text variant="h1" bold style={{ display: 'block', fontSize: '22px', lineHeight: 1.1, letterSpacing: '-0.03em', color: leagueColor }}>
            {me.league.name}
          </Text>
          <div
            style={{
              display: 'inline-block',
              marginTop: '6px',
              padding: '6px 10px',
              borderRadius: '12px',
              background: 'linear-gradient(180deg, rgba(83,212,107,0.18), rgba(83,212,107,0.12))',
              border: '1px solid rgba(83,212,107,0.5)',
              color: theme.palette.text,
              fontWeight: 700,
              fontSize: '12px',
            }}
          >
            {t('league.weekLabel')} · #{me.rank}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: me.nextLeagueXP ? '12px' : 0 }}>
        {stat(`#${me.rank}`, t('league.myPlace'))}
        {stat(me.xpWeek, t('league.xpWeek'), true)}
        {stat(me.xpTotal, t('league.xpTotal'))}
      </div>

      {me.nextLeagueXP && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <Text variant="small" muted style={{ fontSize: '11px' }}>{t('league.progressToNext')}</Text>
            <Text variant="small" bold style={{ fontSize: '11px', color: theme.palette.primary }}>{me.progress}%</Text>
          </div>
          <div style={{ height: '8px', borderRadius: '4px', background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
            <div
              style={{
                width: `${Math.min(100, me.progress)}%`,
                height: '100%',
                borderRadius: '4px',
                background: `linear-gradient(90deg, ${leagueColor}, ${theme.palette.primary})`,
                transition: 'width 0.4s ease',
              }}
            />
          </div>
          <Text variant="small" muted style={{ marginTop: '6px', display: 'block', fontSize: '11px' }}>
            {t('league.xpRemaining', { xp: me.nextLeagueXP, remaining: me.nextLeagueXP - me.xpTotal })}
          </Text>
        </div>
      )}
    </div>
  );
}
