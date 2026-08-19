import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../api/client';
import { t } from '../i18n';
import { pageBackground } from '../theme/styles';
import { useTheme } from '../theme/useTheme';
import { Text } from '../ui/Text';
import { PageHeader } from '../ui/PageHeader';
import { showToast } from '../ui/Toast';
import {
  CameraIcon,
  FoxHeroScene,
  FoxIcon,
  RuleCalendarIcon,
  RuleFlameIcon,
  SegmentBar,
  SparkIcon,
  StepCameraIcon,
  StepDiaryIcon,
  StepScanIcon,
  TicketIcon,
  heroCardStyle,
  nextResetLabel,
} from '../widgets/ai/aiArt';
import type { AiQuotaState } from '../widgets/profile/AiQuotaCard';

// Ошибки промокода с бэка → человеческие сообщения
const PROMO_ERRORS: Record<string, string> = {
  PROMO_NOT_FOUND: 'Такой промокод не найден',
  PROMO_EXPIRED: 'Срок действия промокода истёк',
  PROMO_ALREADY_USED: 'Вы уже активировали этот промокод',
  PROMO_LIMIT_REACHED: 'Лимит активаций промокода исчерпан',
};

const CARD: React.CSSProperties = {
  background: '#122A3E',
  border: '1px solid rgba(253,236,220,.10)',
  borderRadius: '22px',
  padding: '16px',
};

const RULE_TEXT: React.CSSProperties = { fontSize: '13.5px', lineHeight: 1.4, color: '#CBD9E4' };

export function AiLimitsPage() {
  const theme = useTheme();
  const navigate = useNavigate();
  const [quota, setQuota] = useState<AiQuotaState | null>(null);
  const [promoCode, setPromoCode] = useState('');
  const [redeeming, setRedeeming] = useState(false);

  useEffect(() => {
    apiClient
      .get('/ai/quota')
      .then((res) => setQuota(res.data))
      .catch(() => setQuota(null));
  }, []);

  const handleRedeem = async () => {
    const code = promoCode.trim();
    if (!code) return;
    setRedeeming(true);
    try {
      const res = await apiClient.post('/ai/promo', { code });
      setQuota(res.data.quota);
      setPromoCode('');
      showToast(t('aiQuota.promoSuccess', { count: res.data.addedTokens }));
    } catch (err: any) {
      const key = err.response?.data?.message;
      showToast(PROMO_ERRORS[key] || t('aiQuota.promoFailed'));
    } finally {
      setRedeeming(false);
    }
  };

  const freeLeft = quota ? Math.max(0, quota.monthlyLimit - quota.usedThisMonth) : 0;

  return (
    <div
      style={{
        minHeight: '100vh',
        maxWidth: '520px',
        margin: '0 auto',
        padding: '12px',
        paddingTop: 'calc(12px + env(safe-area-inset-top, 0px))',
        paddingBottom: '100px',
        background: pageBackground(theme.palette.bg),
      }}
    >
      <PageHeader
        title={t('aiQuota.pageTitle')}
        onBack={() => navigate(-1)}
        right={<SparkIcon />}
      />

      {/* Герой: сцена с лисом + счётчик + сегменты */}
      <div style={{ ...heroCardStyle, padding: '0 0 18px' }}>
        <div
          style={{
            height: '150px',
            position: 'relative',
            overflow: 'hidden',
            borderRadius: '25px 25px 0 0',
            background: 'radial-gradient(90% 120% at 50% 0%, rgba(139,123,247,.30), transparent 70%)',
          }}
        >
          <FoxHeroScene />
        </div>

        <div style={{ padding: '0 18px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '10px' }}>
            <span style={{ fontSize: '46px', fontWeight: 800, lineHeight: 1, letterSpacing: '-1px' }}>
              {quota ? quota.remaining : '·'}
            </span>
            <span style={{ fontSize: '14px', color: theme.palette.textMuted, marginBottom: '2px' }}>
              {t(quota?.premium ? 'aiQuota.heroOfLine1Premium' : 'aiQuota.heroOfLine1', { limit: quota?.monthlyLimit ?? 10 })}
              <br />
              {t('aiQuota.heroOfLine2')}
            </span>
            <span
              style={{
                marginLeft: 'auto',
                display: 'inline-flex',
                alignItems: 'center',
                background: 'rgba(139,123,247,.16)',
                border: '1px solid rgba(139,123,247,.35)',
                color: '#C9C0FF',
                borderRadius: '999px',
                padding: '5px 11px',
                fontSize: '12px',
                fontWeight: 600,
                whiteSpace: 'nowrap',
              }}
            >
              {t('aiQuota.untilChip', { date: nextResetLabel() })}
            </span>
          </div>
          <SegmentBar total={quota?.monthlyLimit ?? 10} filled={freeLeft} />
          {quota && quota.bonusTokens > 0 && (
            <Text variant="small" style={{ display: 'block', marginTop: '10px', color: '#7BD98A' }}>
              +{quota.bonusTokens} {t('aiQuota.bonusChip')}
            </Text>
          )}
        </div>
      </div>

      {/* Основная кнопка */}
      <button
        type="button"
        onClick={() => navigate('/entry/new')}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '9px',
          width: '100%',
          borderRadius: '16px',
          padding: '15px',
          fontWeight: 700,
          fontSize: '15.5px',
          border: 'none',
          background: 'linear-gradient(135deg, #8B7BF7, #6C5AE0)',
          color: '#fff',
          boxShadow: '0 8px 22px rgba(108,90,224,.38)',
          cursor: 'pointer',
          marginTop: '12px',
          outline: 'none',
          WebkitTapHighlightColor: 'transparent',
        }}
      >
        <CameraIcon />
        {t('aiQuota.recognize')}
      </button>

      {/* Шаги */}
      <h3
        style={{
          font: '700 11px Inter, -apple-system, sans-serif',
          letterSpacing: '0.11em',
          textTransform: 'uppercase',
          color: '#6E8CA3',
          margin: '20px 4px 10px',
        }}
      >
        {t('aiQuota.howTitle')}
      </h3>
      <div style={{ display: 'flex', gap: '10px' }}>
        {[
          { icon: <StepCameraIcon />, text: t('aiQuota.step1') },
          { icon: <StepScanIcon />, text: t('aiQuota.step2') },
          { icon: <StepDiaryIcon />, text: t('aiQuota.step3') },
        ].map((step, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              background: '#16324A',
              border: '1px solid rgba(253,236,220,.10)',
              borderRadius: '18px',
              padding: '12px 11px',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: '20px',
                height: '20px',
                borderRadius: '7px',
                background: 'rgba(139,123,247,.2)',
                color: '#C9C0FF',
                fontSize: '11.5px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 8px',
              }}
            >
              {i + 1}
            </div>
            {step.icon}
            <p style={{ fontSize: '12px', lineHeight: 1.35, color: '#CBD9E4', marginTop: '8px' }}>{step.text}</p>
          </div>
        ))}
      </div>

      {/* Правила */}
      <div style={{ ...CARD, marginTop: '12px' }}>
        <div style={{ display: 'flex', gap: '11px', alignItems: 'flex-start', padding: '11px 0' }}>
          <div
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '12px',
              background: 'rgba(253,236,220,.07)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flex: '0 0 34px',
            }}
          >
            <RuleCalendarIcon />
          </div>
          <p style={RULE_TEXT}>
            <b style={{ color: '#fff', fontWeight: 600 }}>{t(quota?.premium ? 'aiQuota.rule1BoldPremium' : 'aiQuota.rule1Bold', { limit: quota?.monthlyLimit ?? 10 })}</b>{' '}
            {t('aiQuota.rule1Text')}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '11px', alignItems: 'flex-start', padding: '11px 0', borderTop: '1px solid rgba(253,236,220,.10)' }}>
          <div
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '12px',
              background: 'rgba(253,236,220,.07)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flex: '0 0 34px',
            }}
          >
            <RuleFlameIcon />
          </div>
          <p style={RULE_TEXT}>
            <b style={{ color: '#fff', fontWeight: 600 }}>{t('aiQuota.rule2Bold')}</b> {t('aiQuota.rule2Text')}
          </p>
        </div>
      </div>

      {/* Промокод-билет */}
      <div
        style={{
          position: 'relative',
          background: 'linear-gradient(150deg, #1B3350, #132840)',
          border: '1.5px dashed rgba(245,138,60,.45)',
          borderRadius: '22px',
          padding: '16px',
          overflow: 'hidden',
          marginTop: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <TicketIcon />
          <div>
            <Text bold style={{ fontSize: '15.5px', display: 'block' }}>
              {t('aiQuota.promoTitle')}
            </Text>
            <Text variant="small" muted style={{ fontSize: '12.5px' }}>
              {t('aiQuota.promoHint')}
            </Text>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '9px', marginTop: '12px' }}>
          <input
            type="text"
            value={promoCode}
            onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
            placeholder={t('aiQuota.promoPlaceholder')}
            autoCapitalize="characters"
            autoCorrect="off"
            spellCheck={false}
            style={{
              flex: 1,
              minWidth: 0,
              boxSizing: 'border-box',
              background: 'rgba(0,0,0,.28)',
              border: '1px solid rgba(253,236,220,.14)',
              borderRadius: '14px',
              padding: '13px 14px',
              color: '#fff',
              fontWeight: 600,
              fontSize: '14px',
              letterSpacing: '1.5px',
              outline: 'none',
              textTransform: 'uppercase',
            }}
          />
          <button
            type="button"
            onClick={handleRedeem}
            disabled={redeeming || !promoCode.trim()}
            style={{
              background: 'linear-gradient(135deg, #F58A3C, #DE7526)',
              color: '#2A1204',
              border: 'none',
              borderRadius: '14px',
              padding: '0 18px',
              flex: '0 0 auto',
              fontWeight: 700,
              fontSize: '14.5px',
              cursor: redeeming || !promoCode.trim() ? 'default' : 'pointer',
              opacity: redeeming || !promoCode.trim() ? 0.6 : 1,
              outline: 'none',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            {redeeming ? t('aiQuota.promoRedeeming') : t('aiQuota.promoRedeem')}
          </button>
        </div>
      </div>

      {/* Тизер «скоро» */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          background: 'rgba(253,236,220,.05)',
          border: '1px dashed rgba(253,236,220,.16)',
          borderRadius: '20px',
          padding: '14px',
          marginTop: '12px',
        }}
      >
        <FoxIcon />
        <div>
          <Text bold style={{ fontSize: '14px', display: 'block' }}>
            {t('aiQuota.soonTitle')}
          </Text>
          <Text variant="small" muted style={{ fontSize: '12.5px' }}>
            {t('aiQuota.soonText')}
          </Text>
        </div>
      </div>
    </div>
  );
}
