import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../api/client';
import emptyTemplates from '../assets/03_empty_states/empty_templates.jpg';
import { useDebounce } from '../hooks/useDebounce';
import { t } from '../i18n';
import { useTheme } from '../theme/useTheme';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { EmptyState } from '../ui/EmptyState';
import { Input } from '../ui/Input';
import Loader from '../ui/Loader';
import { Text } from '../ui/Text';

interface Product { _id: string; name: string; kcalPer100g: number; }
interface TemplateItem { productId?: string; productName: string; grams: number; kcal: number; }
interface Template { _id: string; name: string; items: TemplateItem[]; totalKcal: number; }

export function TemplatesPage() {
  const theme = useTheme();
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);

  // Create form state
  const [showCreate, setShowCreate] = useState(false);
  const [tplName, setTplName] = useState('');
  const [search, setSearch] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [items, setItems] = useState<TemplateItem[]>([]);
  const [grams, setGrams] = useState('');

  const debouncedSearch = useDebounce(search, 300);

  const load = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/templates');
      setTemplates(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (debouncedSearch.trim().length >= 2) {
      apiClient.get('/products', { params: { search: debouncedSearch, limit: 10 } })
        .then(r => setProducts(r.data))
        .catch(() => setProducts([]));
    } else {
      setProducts([]);
    }
  }, [debouncedSearch]);

  const handleAddProduct = (p: Product) => {
    const g = grams ? parseFloat(grams) : 100;
    const kcal = Math.round((p.kcalPer100g * g) / 100);
    setItems([...items, { productId: p._id, productName: p.name, grams: g, kcal }]);
    setSearch('');
    setGrams('');
    setProducts([]);
  };

  const handleRemoveItem = (idx: number) => {
    setItems(items.filter((_, i) => i !== idx));
  };

  const handleSave = async () => {
    if (!tplName.trim() || items.length === 0) return;
    try {
      await apiClient.post('/templates', { name: tplName, items });
      setTplName('');
      setItems([]);
      setShowCreate(false);
      await load();
    } catch (err) { console.error(err); }
  };

  const handleApply = async (tpl: Template) => {
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    try {
      for (const item of tpl.items) {
        if (item.productId) {
          await apiClient.post('/entries', {
            date: today,
            mealType: 'other',
            productId: item.productId,
            grams: item.grams,
          });
        }
      }
      navigate('/today');
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить шаблон?')) return;
    try {
      await apiClient.delete(`/templates/${id}`);
      await load();
    } catch (err) { console.error(err); }
  };

  if (loading) return <Loader />;

  return (
    <div style={{ padding: theme.spacing.lg, maxWidth: '600px', margin: '0 auto', minHeight: '100vh', paddingBottom: '100px', backgroundColor: theme.palette.bg }}>
      <Text variant="h1" style={{ marginBottom: theme.spacing.lg }}> {t('template.title')}</Text>

      <Button onClick={() => setShowCreate(!showCreate)} style={{ marginBottom: theme.spacing.lg }}>
        {showCreate ? t('common.cancel') : `+ ${t('template.save')}`}
      </Button>

      {/* Create form */}
      {showCreate && (
        <Card style={{ marginBottom: theme.spacing.lg, border: `2px solid ${theme.palette.primary}` }}>
          <Text variant="h2" style={{ marginBottom: theme.spacing.md }}>{t('template.save')}</Text>

          <Input
            label={t('template.name')}
            value={tplName}
            onChange={(e) => setTplName(e.target.value)}
            placeholder="Завтрак / Обед / Перекус..."
            style={{ marginBottom: theme.spacing.md }}
          />

          <div style={{ display: 'flex', gap: theme.spacing.sm, marginBottom: theme.spacing.sm }}>
            <Input
              type="text"
              placeholder={t('entry.productSearch')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ flex: 2 }}
            />
            <Input
              type="number"
              placeholder={t('entry.grams')}
              value={grams}
              onChange={(e) => setGrams(e.target.value)}
              min="1"
              style={{ flex: 1 }}
            />
          </div>

          {/* Search results */}
          {products.length > 0 && (
            <Card style={{ padding: 0, marginBottom: theme.spacing.sm, maxHeight: '150px', overflowY: 'auto' }}>
              {products.map(p => (
                <div
                  key={p._id}
                  onClick={() => handleAddProduct(p)}
                  style={{ padding: theme.spacing.sm, cursor: 'pointer', borderBottom: `1px solid ${theme.palette.border}` }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.palette.surface}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <Text variant="small">{p.name} — {p.kcalPer100g} ккал/100г</Text>
                </div>
              ))}
            </Card>
          )}

          {/* Added items */}
          {items.length > 0 && (
            <div style={{ marginBottom: theme.spacing.md }}>
              {items.map((item, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: `${theme.spacing.xs} 0`, borderBottom: `1px solid ${theme.palette.border}` }}>
                  <Text variant="small">{item.productName} — {item.grams}г</Text>
                  <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm }}>
                    <Text variant="small" muted>{item.kcal} ккал</Text>
                    <button onClick={() => handleRemoveItem(i)} style={{ background: 'none', border: 'none', color: theme.palette.danger, cursor: 'pointer', fontSize: '16px' }}>✕</button>
                  </div>
                </div>
              ))}
              <div style={{ textAlign: 'right', marginTop: theme.spacing.sm }}>
                <Text bold style={{ color: theme.palette.primary }}>Итого: {items.reduce((s, i) => s + i.kcal, 0)} ккал</Text>
              </div>
            </div>
          )}

          <Button onClick={handleSave} disabled={!tplName.trim() || items.length === 0}>
            {t('common.save')}
          </Button>
        </Card>
      )}

      {/* Templates list */}
      {templates.length === 0 ? (
        <EmptyState
          image={emptyTemplates}
          title={t('template.noTemplates')}
        />
      ) : (
        templates.map((tpl) => (
          <Card key={tpl._id} style={{ marginBottom: theme.spacing.md }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.sm }}>
              <Text bold style={{ fontSize: '16px' }}>{tpl.name}</Text>
              <Text bold style={{ color: theme.palette.primary }}>{tpl.totalKcal} ккал</Text>
            </div>
            <div style={{ marginBottom: theme.spacing.sm }}>
              {tpl.items.map((item, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: `${theme.spacing.xs} 0` }}>
                  <Text variant="small">{item.productName}</Text>
                    <Text variant="small" muted>{item.grams}г · {Math.round(item.kcal)} ккал</Text>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: theme.spacing.sm }}>
              <Button size="sm" onClick={() => handleApply(tpl)} style={{ flex: 1 }}>
                {t('template.apply')}
              </Button>
              <Button variant="danger" size="sm" onClick={() => handleDelete(tpl._id)} style={{ width: 'auto', minWidth: '40px' }}>
                ✕
              </Button>
            </div>
          </Card>
        ))
      )}
    </div>
  );
}
