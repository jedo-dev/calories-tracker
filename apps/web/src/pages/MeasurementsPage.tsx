import { useEffect, useState } from 'react';
import { apiClient } from '../api/client';
import emptyMeasurements from '../assets/03_empty_states/empty_measurements.jpg';
import DeleteIcon from '../assets/DeleteIcon';
import { t } from '../i18n';
import { useTheme } from '../theme/useTheme';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { EmptyState } from '../ui/EmptyState';
import { Input } from '../ui/Input';
import Loader from '../ui/Loader';
import { Text } from '../ui/Text';

interface Measurement {
  _id: string;
  date: string;
  waistCm?: number;
  hipsCm?: number;
  chestCm?: number;
  bicepCm?: number;
  thighCm?: number;
}

export function MeasurementsPage() {
  const theme = useTheme();
  const [history, setHistory] = useState<Measurement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const now = new Date();
  const [date, setDate] = useState(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`);
  const [form, setForm] = useState({ waistCm: '', hipsCm: '', chestCm: '', bicepCm: '', thighCm: '' });

  const load = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/measurements', { params: { limit: 90 } });
      setHistory(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    const data: any = { date };
    if (form.waistCm) data.waistCm = parseFloat(form.waistCm);
    if (form.hipsCm) data.hipsCm = parseFloat(form.hipsCm);
    if (form.chestCm) data.chestCm = parseFloat(form.chestCm);
    if (form.bicepCm) data.bicepCm = parseFloat(form.bicepCm);
    if (form.thighCm) data.thighCm = parseFloat(form.thighCm);
    try {
      await apiClient.post('/measurements', data);
      setForm({ waistCm: '', hipsCm: '', chestCm: '', bicepCm: '', thighCm: '' });
      setShowForm(false);
      await load();
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить запись замеров?')) return;
    try {
      await apiClient.delete(`/measurements/${id}`);
      await load();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete');
    }
  };

  const fields = [
    { key: 'waistCm', label: t('measurement.waist') },
    { key: 'hipsCm', label: t('measurement.hips') },
    { key: 'chestCm', label: t('measurement.chest') },
    { key: 'bicepCm', label: t('measurement.bicep') },
    { key: 'thighCm', label: t('measurement.thigh') },
  ];

  if (loading) return <Loader />;

  return (
    <div style={{ padding: theme.spacing.lg, maxWidth: '600px', margin: '0 auto', minHeight: 'calc(100vh - 64px)', backgroundColor: theme.palette.bg }}>
      <Text variant="h1" style={{ marginBottom: theme.spacing.lg }}>📏 {t('measurement.title')}</Text>

      <Button onClick={() => setShowForm(!showForm)} style={{ marginBottom: theme.spacing.lg }}>
        {showForm ? t('common.cancel') : t('measurement.save')}
      </Button>

      {showForm && (
        <Card style={{ marginBottom: theme.spacing.lg, border: `2px solid ${theme.palette.primary}` }}>
          <Input label={t('measurement.date')} type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{ marginBottom: theme.spacing.sm }} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: theme.spacing.sm }}>
            {fields.map(f => (
              <Input
                key={f.key}
                label={f.label}
                type="number"
                value={(form as any)[f.key]}
                onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                placeholder="см"
                step="0.1"
              />
            ))}
          </div>
          <Button onClick={handleSave} style={{ marginTop: theme.spacing.md }}>{t('common.save')}</Button>
        </Card>
      )}

      {history.length === 0 ? (
        <EmptyState
          image={emptyMeasurements}
          title={t('measurement.noHistory')}
        />
      ) : (
        history.map((m) => (
          <Card key={m._id} style={{ marginBottom: theme.spacing.sm }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.xs }}>
              <Text variant="small" muted>{m.date}</Text>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDelete(m._id)}
                style={{ padding: '6px', minWidth: '32px', minHeight: '32px' }}
                aria-label="Удалить"
              >
                <DeleteIcon />
              </Button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: theme.spacing.sm }}>
              {fields.map(f => {
                const val = (m as any)[f.key];
                if (!val) return null;
                return (
                  <div key={f.key} style={{ textAlign: 'center' }}>
                    <Text variant="small" muted>{f.label.split(' ')[0]}</Text>
                    <Text bold>{val}</Text>
                  </div>
                );
              })}
            </div>
          </Card>
        ))
      )}
    </div>
  );
}
