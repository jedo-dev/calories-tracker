import { useEffect, useState } from 'react';
import { apiClient } from '../api/client';
import emptyWeight from '../assets/03_empty_states/empty_weight.jpg';
import DeleteIcon from '../assets/DeleteIcon';
import { t } from '../i18n';
import { useTheme } from '../theme/useTheme';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { EmptyState } from '../ui/EmptyState';
import { Input } from '../ui/Input';
import Loader from '../ui/Loader';
import { Text } from '../ui/Text';

interface WeightEntry { _id: string; date: string; weightKg: number }

export function WeightHistoryPage() {
  const theme = useTheme();
  const [history, setHistory] = useState<WeightEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [weightInput, setWeightInput] = useState('');
  const now = new Date();
  const [dateInput, setDateInput] = useState(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`);

  const load = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/weight', { params: { limit: 90 } });
      setHistory(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    if (!weightInput) return;
    try {
      await apiClient.post('/weight', { date: dateInput, weightKg: parseFloat(weightInput) });
      setWeightInput('');
      await load();
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить запись веса?')) return;
    try {
      await apiClient.delete(`/weight/${id}`);
      await load();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete');
    }
  };

  if (loading) return <Loader />;

  const sorted = [...history].sort((a, b) => a.date.localeCompare(b.date));
  const latest = sorted[sorted.length - 1];
  const oldest = sorted[0];
  const diff = latest && oldest && sorted.length > 1 ? latest.weightKg - oldest.weightKg : 0;
  const minW = sorted.length > 0 ? Math.min(...sorted.map(s => s.weightKg)) : 0;
  const maxW = sorted.length > 0 ? Math.max(...sorted.map(s => s.weightKg)) : 0;
  const range = maxW - minW || 1;

  return (
    <div style={{ padding: theme.spacing.lg, maxWidth: '600px', margin: '0 auto', minHeight: 'calc(100vh - 64px)', backgroundColor: theme.palette.bg }}>
      <Text variant="h1" style={{ marginBottom: theme.spacing.lg }}>⚖️ {t('weight.title')}</Text>

      {/* Stats */}
      {latest && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: theme.spacing.sm, marginBottom: theme.spacing.lg }}>
          <Card style={{ textAlign: 'center' }}>
            <Text variant="small" muted style={{ display: 'block' }}>{t('weight.current')}</Text>
            <Text variant="h2" bold style={{ color: theme.palette.primary, display: 'block' }}>{latest.weightKg}</Text>
            <Text variant="small" muted>{t('weight.kg')}</Text>
          </Card>
          <Card style={{ textAlign: 'center' }}>
            <Text variant="small" muted style={{ display: 'block' }}>{t('weight.change')}</Text>
            <Text variant="h2" bold style={{ color: diff <= 0 ? theme.palette.success : theme.palette.danger, display: 'block' }}>
              {diff > 0 ? '+' : ''}{diff.toFixed(1)}
            </Text>
            <Text variant="small" muted>{t('weight.kg')}</Text>
          </Card>
          <Card style={{ textAlign: 'center' }}>
            <Text variant="small" muted style={{ display: 'block' }}>{t('weight.history')}</Text>
            <Text variant="h2" bold style={{ display: 'block' }}>{history.length}</Text>
            <Text variant="small" muted>{t('report.days')}</Text>
          </Card>
        </div>
      )}

      {/* Chart (simple bar chart) */}
      {sorted.length > 1 && (
        <Card style={{ marginBottom: theme.spacing.lg, padding: theme.spacing.md }}>
          <Text variant="h2" style={{ marginBottom: theme.spacing.md }}>{t('weight.history')}</Text>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '2px', height: '120px' }}>
            {sorted.slice(-30).map((entry, i) => {
              const height = ((entry.weightKg - minW) / range) * 100;
              return (
                <div
                  key={entry._id}
                  title={`${entry.date}: ${entry.weightKg}кг`}
                  style={{
                    flex: 1,
                    height: `${Math.max(4, height)}%`,
                    backgroundColor: i === sorted.slice(-30).length - 1 ? theme.palette.primary : theme.palette.border,
                    borderRadius: '2px 2px 0 0',
                    minHeight: '4px',
                  }}
                />
              );
            })}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: theme.spacing.xs }}>
            <Text variant="small" muted>{sorted.slice(-30)[0]?.date.slice(5)}</Text>
            <Text variant="small" muted>{sorted.slice(-30)[sorted.slice(-30).length - 1]?.date.slice(5)}</Text>
          </div>
        </Card>
      )}

      {/* Add weight */}
      <Card style={{ marginBottom: theme.spacing.lg }}>
        <Text variant="h2" style={{ marginBottom: theme.spacing.sm }}>{t('weight.logWeight')}</Text>
        <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.sm, marginBottom: theme.spacing.lg }}>
          <div style={{ display: 'flex', gap: theme.spacing.sm }}>
            <Input type="date" value={dateInput} onChange={(e) => setDateInput(e.target.value)} style={{ flex: 1, minWidth: 0 }} />
            <Input type="number" placeholder={t('weight.kg')} value={weightInput} onChange={(e) => setWeightInput(e.target.value)} step="0.1" min="20" max="300" style={{ flex: 1, minWidth: 0 }} />
          </div>
          <Button onClick={handleSave}>{t('common.save')}</Button>
        </div>
      </Card>

      {/* History table */}
      {history.length === 0 ? (
        <EmptyState
          image={emptyWeight}
          title={t('weight.noHistory')}
        />
      ) : (
        history.map((entry) => (
          <Card key={entry._id} style={{ marginBottom: theme.spacing.xs, padding: theme.spacing.sm }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text variant="small" muted>{entry.date}</Text>
              <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm }}>
                <Text bold>{entry.weightKg} {t('weight.kg')}</Text>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(entry._id)}
                  style={{ padding: '6px', minWidth: '32px', minHeight: '32px' }}
                  aria-label="Удалить"
                >
                  <DeleteIcon />
                </Button>
              </div>
            </div>
          </Card>
        ))
      )}
    </div>
  );
}
