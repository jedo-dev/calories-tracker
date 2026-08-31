import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { apiClient } from '../api/client';
import { t } from '../i18n';
import { useTheme } from '../theme/useTheme';
import { Text } from '../ui/Text';
import { PageHeader } from '../ui/PageHeader';
import { showToast } from '../ui/Toast';
import { InlineLoader } from '../ui/Loader';
import { glassCardStyle, pageBackground } from '../theme/styles';

const emptyForm = { name: '', brand: '', kcalPer100g: '', proteinPer100g: '', fatPer100g: '', carbPer100g: '' };

const MACRO_FIELDS: { key: keyof typeof emptyForm; label: string }[] = [
  { key: 'kcalPer100g', label: 'Ккал' },
  { key: 'proteinPer100g', label: 'Б (г)' },
  { key: 'fatPer100g', label: 'Ж (г)' },
  { key: 'carbPer100g', label: 'У (г)' },
];

// Создание (/products/new) и редактирование (/products/:id/edit) продукта —
// та же пара роутов, что у рецептов (RecipeEditorPage).
export function ProductEditorPage() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    apiClient
      .get(`/products/${id}`)
      .then((res) => {
        const p = res.data;
        setForm({
          name: p.name || '',
          brand: p.brand || '',
          kcalPer100g: String(p.kcalPer100g ?? ''),
          proteinPer100g: String(p.proteinPer100g ?? ''),
          fatPer100g: String(p.fatPer100g ?? ''),
          carbPer100g: String(p.carbPer100g ?? ''),
        });
      })
      .catch((err) => showToast(err.response?.data?.message || t('products.loadFailed')))
      .finally(() => setLoading(false));
  }, [id]);

  const canSave = form.name.trim() !== '';

  // Формат полей — как в форме замеров (MeasurementForm)
  const inputStyle: React.CSSProperties = {
    width: '100%',
    boxSizing: 'border-box',
    height: '42px',
    padding: '0 12px',
    borderRadius: '13px',
    border: '1px solid rgba(160, 200, 220, 0.18)',
    background: 'rgba(255, 255, 255, 0.06)',
    color: theme.palette.text,
    fontSize: '14px',
    outline: 'none',
    fontFamily: 'inherit',
  };

  const labelStyle: React.CSSProperties = { display: 'block', marginBottom: '4px', fontSize: '11px' };

  const handleSave = async () => {
    if (!canSave || saving) return;
    setSaving(true);
    const payload = {
      name: form.name,
      brand: form.brand.trim() || undefined,
      kcalPer100g: parseFloat(form.kcalPer100g) || 0,
      proteinPer100g: parseFloat(form.proteinPer100g) || 0,
      fatPer100g: parseFloat(form.fatPer100g) || 0,
      carbPer100g: parseFloat(form.carbPer100g) || 0,
    };
    try {
      if (isEdit) {
        await apiClient.patch(`/products/${id}`, payload);
      } else {
        await apiClient.post('/products', payload);
        showToast(t('products.created'));
      }
      navigate('/products');
    } catch (err: any) {
      showToast(err.response?.data?.message || t(isEdit ? 'products.updateFailed' : 'products.createFailed'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ padding: theme.spacing.lg, paddingTop: `calc(${theme.spacing.lg} + env(safe-area-inset-top, 0px))`, maxWidth: '600px', margin: '0 auto', minHeight: '100vh', background: pageBackground(theme.palette.bg), paddingBottom: '100px' }}>
      <PageHeader title={t(isEdit ? 'products.editTitle' : 'products.createTitle')} onBack={() => navigate(-1)} />

      {loading ? (
        <InlineLoader variant="dumbbell" />
      ) : (
        <div style={{ ...glassCardStyle, border: `1px solid ${theme.palette.primary}55` }}>
          <label>
            <Text variant="small" muted style={labelStyle}>{t('products.nameLabel')}</Text>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              style={{ ...inputStyle, marginBottom: '10px' }}
            />
          </label>

          <label>
            <Text variant="small" muted style={labelStyle}>{t('products.brandLabel')}</Text>
            <input
              type="text"
              value={form.brand}
              onChange={(e) => setForm({ ...form, brand: e.target.value })}
              style={{ ...inputStyle, marginBottom: '10px' }}
            />
          </label>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            {MACRO_FIELDS.map((f) => (
              <label key={f.key}>
                <Text variant="small" muted style={labelStyle}>{f.label}</Text>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  placeholder="—"
                  value={form[f.key]}
                  onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                  style={inputStyle}
                />
              </label>
            ))}
          </div>

          <Text variant="small" muted style={{ display: 'block', marginTop: '8px', fontSize: '11px' }}>
            {t('products.per100g')}
          </Text>

          <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
            <button
              type="button"
              onClick={() => navigate(-1)}
              style={{
                flex: 1,
                height: '44px',
                borderRadius: '14px',
                border: '1px solid rgba(160, 200, 220, 0.24)',
                background: 'rgba(255,255,255,0.06)',
                color: theme.palette.text,
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              {t('common.cancel')}
            </button>
            <button
              type="button"
              disabled={!canSave || saving}
              onClick={handleSave}
              style={{
                flex: 2,
                height: '44px',
                borderRadius: '14px',
                border: 'none',
                background: canSave
                  ? 'linear-gradient(180deg, rgba(83, 212, 107, 1), rgba(60, 170, 82, 1))'
                  : 'rgba(255,255,255,0.08)',
                color: canSave ? '#07210f' : theme.palette.textMuted,
                fontSize: '13px',
                fontWeight: 700,
                cursor: canSave ? 'pointer' : 'default',
                boxShadow: canSave ? '0 14px 26px rgba(83, 212, 107, 0.22)' : 'none',
                opacity: saving ? 0.6 : 1,
                fontFamily: 'inherit',
              }}
            >
              {t('common.save')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
