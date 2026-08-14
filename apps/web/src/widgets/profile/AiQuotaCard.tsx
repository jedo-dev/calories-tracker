import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../../api/client';
import { t } from '../../i18n';
import { useTheme } from '../../theme/useTheme';
import { FoxCardArt, SegmentBar, heroCardStyle, nextResetLabel } from '../ai/aiArt';

export interface AiQuotaState {
  monthlyLimit: number;
  usedThisMonth: number;
  bonusTokens: number;
  remaining: number;
  premium?: boolean;
}

// Карточка лимита AI-распознаваний в профиле (вариант B из мокапа):
// лис со сканером справа, крупный остаток, полоска сегментов, чипы снизу.
export function AiQuotaCard() {
  const theme = useTheme();
  const navigate = useNavigate();
  const [quota, setQuota] = useState<AiQuotaState | null>(null);

  useEffect(() => {
    apiClient
      .get('/ai/quota')
      .then((res) => setQuota(res.data))
      .catch(() => setQuota(null));
  }, []);

  if (!quota) return null;

  const freeLeft = Math.max(0, quota.monthlyLimit - quota.usedThisMonth);

  return (
    <div style={{ ...heroCardStyle, paddingBottom: '16px', marginBottom: theme.spacing.md }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontSize: '11px',
              letterSpacing: '0.10em',
              textTransform: 'uppercase',
              color: '#B9AEFF',
              fontWeight: 700,
            }}
          >
            {t('aiQuota.title')}
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '7px', margin: '6px 0 2px' }}>
            <span style={{ fontSize: '38px', fontWeight: 800, lineHeight: 1, letterSpacing: '-1px', color: theme.palette.text }}>
              {freeLeft}
            </span>
            <span style={{ fontSize: '14px', color: theme.palette.textMuted }}>
              {t('aiQuota.cardOf', { limit: quota.monthlyLimit })}
            </span>
          </div>
        </div>
        <div style={{ position: 'relative', width: '112px', height: '84px', flex: '0 0 112px' }}>
          <FoxCardArt />
        </div>
      </div>

      <SegmentBar total={quota.monthlyLimit} filled={freeLeft} />

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '13px', flexWrap: 'wrap' }}>
        {/* Подписчику дата обнуления не важна — лимит и так «безлимитный»,
            чип «обновится 1 сентября» только путал */}
        {quota.premium ? (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(255,214,102,.14)',
              border: '1px solid rgba(255,214,102,.4)',
              color: '#FFD666',
              borderRadius: '999px',
              padding: '5px 11px',
              fontSize: '12px',
              fontWeight: 700,
            }}
          >
            ✨ {t('aiQuota.plusChip')}
          </span>
        ) : (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(139,123,247,.16)',
              border: '1px solid rgba(139,123,247,.35)',
              color: '#C9C0FF',
              borderRadius: '999px',
              padding: '5px 11px',
              fontSize: '12px',
              fontWeight: 600,
            }}
          >
            {t('aiQuota.resetChip', { date: nextResetLabel() })}
          </span>
        )}
        {quota.bonusTokens > 0 && (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(76,181,88,.14)',
              border: '1px solid rgba(76,181,88,.4)',
              color: '#7BD98A',
              borderRadius: '999px',
              padding: '5px 11px',
              fontSize: '12px',
              fontWeight: 600,
            }}
          >
            +{quota.bonusTokens} {t('aiQuota.bonusChip')}
          </span>
        )}
        {!quota.premium && (
        <button
          type="button"
          onClick={() => navigate('/ai-limits')}
          style={{
            marginLeft: 'auto',
            background: 'rgba(139,123,247,.18)',
            border: '1px solid rgba(139,123,247,.4)',
            color: '#C9C0FF',
            borderRadius: '12px',
            padding: '9px 13px',
            fontSize: '13px',
            fontWeight: 700,
            whiteSpace: 'nowrap',
            cursor: 'pointer',
            outline: 'none',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          {t('aiQuota.details')}
        </button>
        )}
      </div>
    </div>
  );
}
