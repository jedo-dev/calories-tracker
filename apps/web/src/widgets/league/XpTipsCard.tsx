import { t } from '../../i18n';
import { Text } from '../../ui/Text';
import { leagueCardStyle } from './types';

const TIPS: { icon: string; key: string }[] = [
  { icon: '🍽️', key: 'league.xpTip1' },
  { icon: '📝', key: 'league.xpTip2' },
  { icon: '🏋️', key: 'league.xpTip3' },
  { icon: '💧', key: 'league.xpTip4' },
];

export function XpTipsCard() {
  return (
    <div style={leagueCardStyle}>
      <Text variant="h2" bold style={{ display: 'block', fontSize: '16px', marginBottom: '10px' }}>
        ⚡ {t('league.howToGetXp')}
      </Text>
      {TIPS.map((tip, i) => (
        <div
          key={tip.key}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '7px 0',
            borderBottom: i < TIPS.length - 1 ? '1px solid rgba(255,255,255,0.07)' : 'none',
          }}
        >
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '10px',
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '15px',
              flexShrink: 0,
            }}
          >
            {tip.icon}
          </div>
          <Text variant="small" style={{ lineHeight: 1.3 }}>{t(tip.key)}</Text>
        </div>
      ))}
    </div>
  );
}
