import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { apiClient } from '../api/client';
import { useDebounce } from '../hooks/useDebounce';
import { useTelegramAuth } from '../hooks/useTelegramAuth';
import { t } from '../i18n';
import { useTheme } from '../theme/useTheme';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Text } from '../ui/Text';

interface Product {
  _id: string;
  name: string;
  kcalPer100g: number;
  proteinPer100g: number;
  fatPer100g: number;
  carbPer100g: number;
}

interface Entry {
  _id: string;
  date: string;
  time?: string;
  mealType: string;
  productId?: string;
  productName: string;
  grams: number;
  kcalPer100g?: number;
  proteinPer100g?: number;
  fatPer100g?: number;
  carbPer100g?: number;
}

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function AddEntryPage() {
  const { loading: loadingUser, error: errorUser } = useTelegramAuth();

  const navigate = useNavigate();
  const theme = useTheme();
  const { id } = useParams();
  const isEdit = !!id;

  const [date, setDate] = useState(formatDate(new Date()));
  const [time, setTime] = useState('');
  const [mealType, setMealType] = useState('other');
  const [productSearch, setProductSearch] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [grams, setGrams] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debouncedSearch = useDebounce(productSearch, 300);

  useEffect(() => {
    const tg = (window as any).Telegram?.WebApp;
    if (tg && tg.BackButton) {
      tg.BackButton.show();
      tg.BackButton.onClick(() => {
        navigate(-1);
      });
      return () => {
        tg.BackButton.hide();
      };
    }
  }, [navigate]);

  useEffect(() => {
    if (isEdit) {
      loadEntry();
    }
  }, [id]);

  const loadEntry = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const response = await apiClient.get(`/entries/${id}`);
      const entry: Entry = response.data;
      setDate(entry.date);
      setTime(entry.time || '');
      setMealType(entry.mealType);
      setGrams(entry.grams.toString());
      if (entry.productId) {
        setSelectedProduct({
          _id: typeof entry.productId === 'string' ? entry.productId : entry.productId,
          name: entry.productName,
          kcalPer100g: entry.kcalPer100g || 0,
          proteinPer100g: entry.proteinPer100g || 0,
          fatPer100g: entry.fatPer100g || 0,
          carbPer100g: entry.carbPer100g || 0,
        } as Product);
      }
      setProductSearch(entry.productName);
    } catch (err: any) {
      setError(err.response?.data?.message || t('entry.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (debouncedSearch.trim() && debouncedSearch.length >= 2) {
      searchProducts();
    } else {
      setProducts([]);
    }
  }, [debouncedSearch]);

  const searchProducts = async () => {
    try {
      const response = await apiClient.get('/products', {
        params: { search: debouncedSearch, limit: 20 },
      });
      setProducts(response.data);
    } catch (err: any) {
      console.error('Failed to search products', err);
    }
  };

  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product);
    setProductSearch(product.name);
    setProducts([]);
  };

  const handleSave = async () => {
    if (!selectedProduct) {
      alert(t('entry.noProductSelected'));
      return;
    }
    if (!grams || parseFloat(grams) <= 0) {
      alert(t('entry.invalidGrams'));
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const data = {
        date,
        ...(time && { time }),
        mealType,
        productId: selectedProduct._id,
        grams: parseFloat(grams),
      };

      if (isEdit) {
        await apiClient.patch(`/entries/${id}`, data);
      } else {
        await apiClient.post('/entries', data);
      }

      navigate('/today');
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || t('entry.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  if (loading || loadingUser) {
    return (
      <div style={{ padding: theme.spacing.lg, textAlign: 'center' }}>
        <Text>{t('common.loading')}</Text>
      </div>
    );
  }

  return (
    <div style={{ padding: theme.spacing.lg, maxWidth: '600px', margin: '0 auto', minHeight: '100vh', backgroundColor: theme.palette.bg }}>
      <Text variant="h1" style={{ marginBottom: theme.spacing.lg }}>
        {isEdit ? t('entry.edit') : t('entry.add')}
      </Text>

      {error || errorUser && (
        <Card style={{ marginBottom: theme.spacing.md, backgroundColor: theme.palette.danger + '20' }}>
          <Text style={{ color: theme.palette.danger }}>
            {t('common.error')}: {error || errorUser}
          </Text>
        </Card>
      )}

      <div style={{ marginBottom: theme.spacing.md }}>
        <Input
          type="date"
          label={t('entry.date')}
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </div>

      <div style={{ marginBottom: theme.spacing.md }}>
        <Input
          type="time"
          label={t('entry.time')}
          value={time}
          onChange={(e) => setTime(e.target.value)}
        />
      </div>

      <div style={{ marginBottom: theme.spacing.md }}>
        <label style={{ display: 'block', marginBottom: theme.spacing.xs, fontWeight: '600', color: theme.palette.text, fontSize: theme.typography.body.fontSize }}>
          {t('entry.mealType')}
        </label>
        <select
          value={mealType}
          onChange={(e) => setMealType(e.target.value)}
          style={{
            width: '100%',
            padding: theme.spacing.sm,
            fontSize: theme.typography.body.fontSize,
            backgroundColor: theme.palette.bg,
            color: theme.palette.text,
            border: `1px solid ${theme.palette.border}`,
            borderRadius: theme.radius.sm,
            boxSizing: 'border-box',
          }}
        >
          <option value="other">{t('mealType.other')}</option>
          <option value="breakfast">{t('mealType.breakfast')}</option>
          <option value="lunch">{t('mealType.lunch')}</option>
          <option value="dinner">{t('mealType.dinner')}</option>
          <option value="snack">{t('mealType.snack')}</option>
        </select>
      </div>

      <div style={{ marginBottom: theme.spacing.md }}>
        <Input
          type="text"
          label={t('entry.product')}
          placeholder={t('entry.productSearch')}
          value={productSearch}
          onChange={(e) => setProductSearch(e.target.value)}
        />
        {products.length > 0 && (
          <Card
            style={{
              marginTop: theme.spacing.sm,
              maxHeight: '200px',
              overflowY: 'auto',
              padding: 0,
            }}
          >
            {products.map((product) => (
              <div
                key={product._id}
                onClick={() => handleProductSelect(product)}
                style={{
                  padding: theme.spacing.sm,
                  cursor: 'pointer',
                  borderBottom: `1px solid ${theme.palette.border}`,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = theme.palette.surface;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <Text bold>{product.name}</Text>
                <Text variant="small" muted>
                  {t('products.calories', { value: product.kcalPer100g })} · {t('totals.macros', {
                    protein: product.proteinPer100g.toFixed(1),
                    fat: product.fatPer100g.toFixed(1),
                    carb: product.carbPer100g.toFixed(1),
                  })}
                </Text>
              </div>
            ))}
          </Card>
        )}
        {selectedProduct && (
          <Card
            style={{
              marginTop: theme.spacing.sm,
              backgroundColor: theme.palette.primary + '20',
            }}
          >
            <Text variant="small">
              {t('entry.selected', { name: selectedProduct.name })}
            </Text>
          </Card>
        )}
      </div>

      <div style={{ marginBottom: theme.spacing.lg }}>
        <Input
          type="number"
          step="0.01"
          min="0.01"
          label={t('entry.grams')}
          placeholder={t('entry.gramsPlaceholder')}
          value={grams}
          onChange={(e) => setGrams(e.target.value)}
        />
      </div>

      <div style={{ display: 'flex', gap: theme.spacing.md }}>
        <Button variant="secondary" onClick={() => navigate(-1)} style={{ flex: 1 }}>
          {t('common.cancel')}
        </Button>
        <Button onClick={handleSave} disabled={saving} style={{ flex: 1 }}>
          {saving ? t('common.saving') : t('common.save')}
        </Button>
      </div>
    </div>
  );
}

