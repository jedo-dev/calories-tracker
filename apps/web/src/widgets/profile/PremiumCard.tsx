import { useEffect, useState } from 'react';
import { apiClient } from '../../api/client';
import { t, formatDate } from '../../i18n';
import { useTheme } from '../../theme/useTheme';
import { glassCardStyle } from '../../theme/styles';
import { track } from '../../utils/analytics';

interface BillingStatus {
  premium: boolean;
  premiumUntil: string | null;
  plans: Array<{ id: string; title: string; priceRub: number; days: number }>;
}

// Карточка подписки Plus в профиле. Платёжного провайдера пока нет:
// кнопки тарифов работают как fake door (событие premium_interest в аналитике
// меряет готовность платить), реальная активация — по коду.
export function PremiumCard() {
  const theme = useTheme();
  const [status, setStatus] = useState<BillingStatus | null>(null);
  const [showCode, setShowCode] = useState(false);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    apiClient
      .get('/billing/status')
      .then((res) => setStatus(res.data))
      .catch(() => setStatus(null));
  }, []);

  if (!status) return null;

  const onPlanClick = (planId: string) => {
    track('premium_interest', { plan: planId });
    setMessage(t('premium.buyComingSoon'));
    setShowCode(true);
  };

  const redeem = async () => {
    if (busy || !code.trim()) return;
    setBusy(true);
    setMessage(null);
    try {
      const res = await apiClient.post('/billing/redeem', { code });
      setStatus({ ...status, premium: res.data.premium, premiumUntil: res.data.premiumUntil });
      setMessage(t('premium.redeemed', { days: res.data.addedDays }));
      setCode('');
      setShowCode(false);
      track('premium_code_redeemed');
    } catch (err: any) {
      setMessage(err.response?.data?.message || t('premium.redeemFailed'));
    } finally {
      setBusy(false);
    }
  };

  const gold = '255, 214, 102';

  return (
    <div
      style={{
        ...glassCardStyle,
        marginBottom: theme.spacing.md,
        border: `1px solid rgba(${gold}, 0.35)`,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '18px' }}>✨</span>
        <span style={{ fontSize: '15px', fontWeight: 800, color: `rgb(${gold})` }}>
          {t('premium.title')}
        </span>
      </div>

      {status.premium && status.premiumUntil ? (
        <div style={{ fontSize: '13px', color: '#7BD98A', fontWeight: 600, marginTop: '8px' }}>
          ✓ {t('premium.activeUntil', { date: formatDate(status.premiumUntil.slice(0, 10)) })}
        </div>
      ) : (
        <>
          <ul
            style={{
              margin: '10px 0',
              paddingLeft: '18px',
              fontSize: '13px',
              color: theme.palette.text,
              lineHeight: 1.7,
            }}
          >
            <li>{t('premium.benefit1')}</li>
            <li>{t('premium.benefit2')}</li>
            <li>{t('premium.benefit3')}</li>
          </ul>

          <div style={{ display: 'flex', gap: '8px' }}>
            {status.plans.map((plan) => (
              <button
                key={plan.id}
                type="button"
                onClick={() => onPlanClick(plan.id)}
                style={{
                  flex: 1,
                  background: `rgba(${gold}, 0.12)`,
                  border: `1px solid rgba(${gold}, 0.4)`,
                  color: `rgb(${gold})`,
                  borderRadius: '12px',
                  padding: '10px 8px',
                  fontSize: '13px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  outline: 'none',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                {t(plan.id === 'year' ? 'premium.perYear' : 'premium.perMonth', {
                  price: plan.priceRub,
                })}
                {plan.id === 'year' && (
                  <div style={{ fontSize: '10px', fontWeight: 600, marginTop: '2px' }}>
                    {t('premium.yearDiscount')}
                  </div>
                )}
              </button>
            ))}
          </div>

          {!showCode && (
            <button
              type="button"
              onClick={() => setShowCode(true)}
              style={{
                marginTop: '10px',
                background: 'transparent',
                border: 'none',
                color: theme.palette.textMuted,
                fontSize: '12px',
                textDecoration: 'underline',
                cursor: 'pointer',
                padding: 0,
              }}
            >
              {t('premium.haveCode')}
            </button>
          )}
        </>
      )}

      {message && (
        <div style={{ fontSize: '13px', color: '#ffcf8a', marginTop: '10px' }}>{message}</div>
      )}

      {showCode && !status.premium && (
        <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder={t('premium.codePlaceholder')}
            style={{
              flex: 1,
              minWidth: 0,
              background: 'rgba(160, 200, 220, 0.1)',
              border: '1px solid rgba(160, 200, 220, 0.3)',
              borderRadius: '10px',
              color: theme.palette.text,
              padding: '9px 11px',
              fontSize: '13px',
              outline: 'none',
            }}
          />
          <button
            type="button"
            onClick={redeem}
            disabled={busy || !code.trim()}
            style={{
              background: `rgba(${gold}, 0.14)`,
              border: `1px solid rgba(${gold}, 0.4)`,
              color: `rgb(${gold})`,
              borderRadius: '10px',
              padding: '9px 12px',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              opacity: busy || !code.trim() ? 0.5 : 1,
              whiteSpace: 'nowrap',
            }}
          >
            {t('premium.redeem')}
          </button>
        </div>
      )}
    </div>
  );
}
