import { useEffect, useMemo, useState } from 'react';
import { pageBackground } from '../theme/styles';
import { apiClient } from '../api/client';
import { t } from '../i18n';
import { useTheme } from '../theme/useTheme';
import Loader from '../ui/Loader';
import { Text } from '../ui/Text';
import { ConfirmSheet } from '../ui/ConfirmSheet';
import { MeasurementForm } from '../widgets/measurements/MeasurementForm';
import { CurrentMeasurementsCard } from '../widgets/measurements/CurrentMeasurementsCard';
import { MeasurementHistoryList } from '../widgets/measurements/MeasurementHistoryList';
import { formatDateRu, Measurement } from '../widgets/measurements/shared';

export function MeasurementsPage() {
  const theme = useTheme();
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'overview' | 'history'>('overview');
  const [showForm, setShowForm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Measurement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const BATCH = 90;

  const load = async () => {
    try {
      const res = await apiClient.get('/measurements', { params: { limit: BATCH } });
      const items = Array.isArray(res.data) ? res.data : [];
      setMeasurements(items);
      setHasMore(items.length === BATCH);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Догрузка старых замеров: раньше всё старше 90 записей было недоступно.
  const loadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const res = await apiClient.get('/measurements', {
        params: { limit: BATCH, offset: measurements.length },
      });
      const items = Array.isArray(res.data) ? res.data : [];
      setMeasurements((prev) => [...prev, ...items]);
      setHasMore(items.length === BATCH);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const sorted = useMemo(
    () => [...measurements].sort((a, b) => a.date.localeCompare(b.date)),
    [measurements],
  );
  const latest = sorted[sorted.length - 1];
  const previous = sorted[sorted.length - 2];
  const historyEntries = useMemo(() => [...sorted].reverse(), [sorted]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setError(null);
    try {
      await apiClient.delete(`/measurements/${deleteTarget._id}`);
      setMeasurements((prev) => prev.filter((m) => m._id !== deleteTarget._id));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Не удалось удалить запись');
    } finally {
      setDeleteTarget(null);
    }
  };

  if (loading) return <Loader />;

  const tabButton = (key: 'overview' | 'history', label: string) => {
    const active = tab === key;
    return (
      <button
        type="button"
        onClick={() => setTab(key)}
        style={{
          flex: 1,
          padding: '9px 12px',
          borderRadius: '12px',
          border: `1px solid ${active ? theme.palette.primary : 'rgba(255,255,255,0.12)'}`,
          background: active
            ? `linear-gradient(180deg, ${theme.palette.primary}33, ${theme.palette.primary}1f)`
            : 'rgba(255,255,255,0.06)',
          color: active ? theme.palette.primary : theme.palette.textMuted,
          fontSize: '13px',
          fontWeight: 700,
          cursor: 'pointer',
          fontFamily: 'inherit',
        }}
      >
        {label}
      </button>
    );
  };

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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <Text variant="h2" bold style={{ fontSize: '20px' }}>Замеры тела</Text>
        {!showForm && (
          <button
            type="button"
            onClick={() => {
              setShowForm(true);
              setTab('overview');
            }}
            style={{
              padding: '9px 14px',
              borderRadius: '13px',
              border: 'none',
              background: 'linear-gradient(180deg, rgba(83, 212, 107, 1), rgba(60, 170, 82, 1))',
              color: '#07210f',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 12px 22px rgba(83, 212, 107, 0.22)',
              fontFamily: 'inherit',
            }}
          >
            + Добавить
          </button>
        )}
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
        {tabButton('overview', 'Обзор')}
        {tabButton('history', 'История')}
      </div>

      {error && (
        <Text variant="small" style={{ display: 'block', color: '#ff8a8a', marginBottom: '10px' }}>
          {error}
        </Text>
      )}

      {showForm && (
        <MeasurementForm
          onSaved={() => {
            setShowForm(false);
            setTab('overview');
            setLoading(true);
            load();
          }}
          onCancel={() => setShowForm(false)}
        />
      )}

      {tab === 'overview' ? (
        <>
          {latest && (
            <Text variant="small" muted style={{ display: 'block', marginBottom: '8px' }}>
              Последний замер: {formatDateRu(latest.date)}
            </Text>
          )}
          <CurrentMeasurementsCard latest={latest} previous={previous} />
        </>
      ) : (
        <>
          <MeasurementHistoryList entries={historyEntries} onDelete={setDeleteTarget} />
          {hasMore && (
            <button
              type="button"
              onClick={loadMore}
              disabled={loadingMore}
              style={{
                width: '100%',
                height: '44px',
                borderRadius: '14px',
                border: '1px solid rgba(160, 200, 220, 0.24)',
                background: 'rgba(255,255,255,0.06)',
                color: theme.palette.text,
                fontSize: '13px',
                fontWeight: 700,
                cursor: loadingMore ? 'default' : 'pointer',
                opacity: loadingMore ? 0.6 : 1,
                fontFamily: 'inherit',
              }}
            >
              {loadingMore ? t('common.loading') : t('common.showMore')}
            </button>
          )}
        </>
      )}

      <ConfirmSheet
        isOpen={deleteTarget !== null}
        title="Удалить запись замеров?"
        description={deleteTarget ? `${formatDateRu(deleteTarget.date)}. Запись будет удалена навсегда.` : undefined}
        confirmLabel="Удалить"
        danger
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}
