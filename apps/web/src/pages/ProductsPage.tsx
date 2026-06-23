import { useEffect, useState } from 'react';
import { apiClient } from '../api/client';
import { t } from '../i18n';
import { useTheme } from '../theme/useTheme';
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

function useDebounce(value: string, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export function ProductsPage() {
  const theme = useTheme();
  const [search, setSearch] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debouncedSearch = useDebounce(search, 300);

  useEffect(() => {
    const fetchProducts = async () => {
      if (!debouncedSearch.trim()) {
        setProducts([]);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const response = await apiClient.get('/products', {
          params: { search: debouncedSearch, limit: 20 },
        });
        setProducts(response.data);
      } catch (err: any) {
        setError(err.response?.data?.message || err.message || t('products.loadFailed'));
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [debouncedSearch]);

  return (
    <div style={{ padding: theme.spacing.lg, maxWidth: '600px', margin: '0 auto', minHeight: 'calc(100vh - 64px)', backgroundColor: theme.palette.bg, paddingBottom: '80px' }}>
      <Text variant="h1" style={{ marginBottom: theme.spacing.lg }}>🛒 {t('products.title')}</Text>

      <Input
        type="text"
        placeholder={t('products.searchPlaceholder')}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ marginBottom: theme.spacing.lg }}
      />

      {loading && (
        <Card style={{ textAlign: 'center', padding: theme.spacing.lg }}>
          <Text>{t('common.loading')}</Text>
        </Card>
      )}

      {error && (
        <Card style={{ marginBottom: theme.spacing.md }}>
          <Text style={{ color: theme.palette.danger }}>{t('common.error')}: {error}</Text>
        </Card>
      )}

      {!loading && !error && !debouncedSearch.trim() && (
        <Card style={{ textAlign: 'center', padding: theme.spacing.xl }}>
          <div style={{ fontSize: '48px', marginBottom: theme.spacing.md }}>🔍</div>
          <Text muted>Начните вводить название продукта</Text>
          <Text variant="small" muted style={{ marginTop: theme.spacing.sm }}>Например: курица, рис, яблоко</Text>
        </Card>
      )}

      {!loading && !error && debouncedSearch.trim() && products.length === 0 && (
        <Card style={{ textAlign: 'center', padding: theme.spacing.xl }}>
          <div style={{ fontSize: '48px', marginBottom: theme.spacing.md }}>😕</div>
          <Text muted>{t('products.noProductsFound')}</Text>
        </Card>
      )}

      {!loading && !error && products.length > 0 && (
        <div>
          {products.map((product) => (
            <Card key={product._id} style={{ marginBottom: theme.spacing.sm }}>
              <Text bold style={{ marginBottom: theme.spacing.xs }}>{product.name}</Text>
              <Text variant="small" muted>
                {t('totals.macros', {
                  kcal: product.kcalPer100g.toFixed(0),
                  protein: product.proteinPer100g.toFixed(1),
                  fat: product.fatPer100g.toFixed(1),
                  carb: product.carbPer100g.toFixed(1),
                })}
              </Text>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
