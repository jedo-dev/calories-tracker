import { useEffect, useState } from 'react';
import { apiClient } from '../api/client';
import { t } from '../i18n';
import { useTheme } from '../theme/useTheme';
import { glassCardStyle, pageBackground } from '../theme/styles';
import Loader from '../ui/Loader';

interface DayPoint {
  date: string;
  users?: number;
  count?: number;
}

interface Summary {
  days: number;
  totalUsers: number;
  dauToday: number;
  wau: number;
  mau: number;
  dau: DayPoint[];
  registrations: DayPoint[];
  retention: { d1: number | null; d1Eligible: number; w1: number | null; w1Eligible: number };
  topEvents: Array<{ name: string; count: number; users: number }>;
}

// Простая столбиковая диаграмма на div-ах — без графических библиотек
function Bars({ points, value }: { points: DayPoint[]; value: (p: DayPoint) => number }) {
  const max = Math.max(1, ...points.map(value));
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '2px', height: '90px', marginTop: '10px' }}>
      {points.map((p) => (
        <div
          key={p.date}
          title={`${p.date}: ${value(p)}`}
          style={{
            flex: 1,
            minWidth: '2px',
            height: `${Math.max(2, (100 * value(p)) / max)}%`,
            borderRadius: '3px 3px 0 0',
            background: value(p) > 0 ? 'rgba(83, 212, 107, 0.75)' : 'rgba(160, 200, 220, 0.15)',
          }}
        />
      ))}
    </div>
  );
}

export function AdminAnalyticsPage() {
  const theme = useTheme();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [error, setError] = useState(false);
  const [days, setDays] = useState(30);

  useEffect(() => {
    setSummary(null);
    setError(false);
    apiClient
      .get(`/analytics/summary?days=${days}`)
      .then((res) => setSummary(res.data))
      .catch(() => setError(true));
  }, [days]);

  const cardTitle: React.CSSProperties = {
    fontSize: '11px',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: theme.palette.textMuted,
    fontWeight: 700,
  };
  const bigNumber: React.CSSProperties = {
    fontSize: '28px',
    fontWeight: 800,
    color: theme.palette.text,
    marginTop: '4px',
  };

  if (error) {
    return (
      <div style={{ minHeight: '100vh', padding: '16px', background: pageBackground(theme.palette.bg) }}>
        <div style={{ ...glassCardStyle, color: '#ff8a8a', fontSize: '14px' }}>
          {t('analytics.loadFailed')}
        </div>
      </div>
    );
  }
  if (!summary) return <Loader />;

  const statCard = (label: string, value: number) => (
    <div style={{ ...glassCardStyle, flex: 1, minWidth: '140px' }}>
      <div style={cardTitle}>{label}</div>
      <div style={bigNumber}>{value}</div>
    </div>
  );

  return (
    <div
      style={{
        minHeight: '100vh',
        maxWidth: '520px',
        margin: '0 auto',
        padding: '12px',
        paddingBottom: '100px',
        background: pageBackground(theme.palette.bg),
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '6px 0 14px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 800, color: theme.palette.text, margin: 0, flex: 1 }}>
          📈 {t('analytics.title')}
        </h1>
        {[30, 90].map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => setDays(d)}
            style={{
              background: days === d ? 'rgba(83, 212, 107, 0.2)' : 'rgba(160, 200, 220, 0.1)',
              border: `1px solid ${days === d ? 'rgba(83, 212, 107, 0.5)' : 'rgba(160, 200, 220, 0.25)'}`,
              color: days === d ? '#7BD98A' : theme.palette.textMuted,
              borderRadius: '10px',
              padding: '6px 10px',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            {t(d === 30 ? 'analytics.period30' : 'analytics.period90')}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '10px' }}>
        {statCard(t('analytics.totalUsers'), summary.totalUsers)}
        {statCard(t('analytics.dauToday'), summary.dauToday)}
        {statCard(t('analytics.wau'), summary.wau)}
        {statCard(t('analytics.mau'), summary.mau)}
      </div>

      <div style={{ ...glassCardStyle, marginBottom: '10px' }}>
        <div style={cardTitle}>{t('analytics.dauChart')}</div>
        <Bars points={summary.dau} value={(p) => p.users || 0} />
      </div>

      <div style={{ ...glassCardStyle, marginBottom: '10px' }}>
        <div style={cardTitle}>{t('analytics.registrationsChart')}</div>
        <Bars points={summary.registrations} value={(p) => p.count || 0} />
      </div>

      <div style={{ ...glassCardStyle, marginBottom: '10px' }}>
        <div style={cardTitle}>{t('analytics.retention')}</div>
        {summary.retention.d1 == null && summary.retention.w1 == null ? (
          <div style={{ color: theme.palette.textMuted, fontSize: '13px', marginTop: '8px' }}>
            {t('analytics.noData')}
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '20px', marginTop: '10px' }}>
            {summary.retention.d1 != null && (
              <div>
                <div style={bigNumber}>{summary.retention.d1}%</div>
                <div style={{ fontSize: '12px', color: theme.palette.textMuted }}>
                  {t('analytics.retentionD1')}{' '}
                  {t('analytics.retentionOf', { n: summary.retention.d1Eligible })}
                </div>
              </div>
            )}
            {summary.retention.w1 != null && (
              <div>
                <div style={bigNumber}>{summary.retention.w1}%</div>
                <div style={{ fontSize: '12px', color: theme.palette.textMuted }}>
                  {t('analytics.retentionW1')}{' '}
                  {t('analytics.retentionOf', { n: summary.retention.w1Eligible })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div style={glassCardStyle}>
        <div style={{ ...cardTitle, marginBottom: '8px' }}>{t('analytics.topEvents')}</div>
        {summary.topEvents.length === 0 && (
          <div style={{ color: theme.palette.textMuted, fontSize: '13px' }}>{t('analytics.noData')}</div>
        )}
        {summary.topEvents.map((e) => {
          const max = summary.topEvents[0]?.count || 1;
          return (
            <div key={e.name} style={{ padding: '6px 0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', fontSize: '13px' }}>
                <span style={{ color: theme.palette.text, fontWeight: 600, wordBreak: 'break-all' }}>
                  {e.name}
                </span>
                <span style={{ color: theme.palette.textMuted, whiteSpace: 'nowrap' }}>
                  {e.count} {t('analytics.eventsCount')} · {e.users} {t('analytics.usersCount')}
                </span>
              </div>
              <div
                style={{
                  height: '5px',
                  borderRadius: '3px',
                  marginTop: '4px',
                  width: `${Math.max(3, (100 * e.count) / max)}%`,
                  background: 'rgba(83, 212, 107, 0.6)',
                }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
