import { useEffect, useState } from 'react';
import { apiClient } from '../api/client';
import { useDebounce } from '../hooks/useDebounce';
import emptyProducts from '../assets/03_empty_states/empty_products.jpg';
import DeleteIcon from '../assets/DeleteIcon';
import EditIcon from '../assets/EditIcon';
import { t } from '../i18n';
import { useTheme } from '../theme/useTheme';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { EmptyState } from '../ui/EmptyState';
import { ConfirmSheet } from '../ui/ConfirmSheet';
import { Input } from '../ui/Input';
import { Text } from '../ui/Text';
import { showToast } from '../ui/Toast';

interface Product {
  _id: string;
  name: string;
  brand?: string;
  kcalPer100g: number;
  proteinPer100g: number;
  fatPer100g: number;
  carbPer100g: number;
  createdBy?: string;
}

export function ProductsPage() {
  const theme = useTheme();
  const [search, setSearch] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: '', kcalPer100g: '', proteinPer100g: '', fatPer100g: '', carbPer100g: '' });
  const [myUserId, setMyUserId] = useState<string | null>(null);

  const debouncedSearch = useDebounce(search, 300);

  useEffect(() => {
    apiClient.get('/social/me').then((res) => setMyUserId(res.data.user.id)).catch(() => {});
  }, []);

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

  useEffect(() => {
    fetchProducts();
  }, [debouncedSearch]);

  const handleEdit = (product: Product) => {
    setEditingId(product._id);
    setEditForm({
      name: product.name,
      kcalPer100g: product.kcalPer100g.toString(),
      proteinPer100g: product.proteinPer100g.toString(),
      fatPer100g: product.fatPer100g.toString(),
      carbPer100g: product.carbPer100g.toString(),
    });
  };

  const handleSaveEdit = async (id: string) => {
    try {
      await apiClient.patch(`/products/${id}`, {
        name: editForm.name,
        kcalPer100g: parseFloat(editForm.kcalPer100g) || 0,
        proteinPer100g: parseFloat(editForm.proteinPer100g) || 0,
        fatPer100g: parseFloat(editForm.fatPer100g) || 0,
        carbPer100g: parseFloat(editForm.carbPer100g) || 0,
      });
      setEditingId(null);
      await fetchProducts();
    } catch (err: any) {
      showToast(err.response?.data?.message || t('products.updateFailed'));
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await apiClient.delete(`/products/${id}`);
      await fetchProducts();
    } catch (err: any) {
      showToast(err.response?.data?.message || t('products.deleteFailed'));
    } finally {
      setDeleteId(null);
    }
  };

  const canEdit = (product: Product) => {
    return myUserId && product.createdBy && product.createdBy === myUserId;
  };

  return (
    <div style={{ padding: theme.spacing.lg, maxWidth: '600px', margin: '0 auto', minHeight: '100vh', backgroundColor: theme.palette.bg, paddingBottom: '100px' }}>
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
        <EmptyState
          image={emptyProducts}
          title="Начните вводить название продукта"
          description="Например: курица, рис, яблоко"
        />
      )}

      {!loading && !error && debouncedSearch.trim() && products.length === 0 && (
        <EmptyState
          image={emptyProducts}
          title={t('products.noProductsFound')}
        />
      )}

      {!loading && !error && products.length > 0 && (
        <div>
          {products.map((product) => (
            <Card key={product._id} style={{ marginBottom: theme.spacing.sm }}>
              {editingId === product._id ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.sm }}>
                  <Input
                    label="Название"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: theme.spacing.xs }}>
                    <Input label="Ккал" type="number" value={editForm.kcalPer100g} onChange={(e) => setEditForm({ ...editForm, kcalPer100g: e.target.value })} />
                    <Input label="Б" type="number" value={editForm.proteinPer100g} onChange={(e) => setEditForm({ ...editForm, proteinPer100g: e.target.value })} />
                    <Input label="Ж" type="number" value={editForm.fatPer100g} onChange={(e) => setEditForm({ ...editForm, fatPer100g: e.target.value })} />
                    <Input label="У" type="number" value={editForm.carbPer100g} onChange={(e) => setEditForm({ ...editForm, carbPer100g: e.target.value })} />
                  </div>
                  <div style={{ display: 'flex', gap: theme.spacing.sm }}>
                    <Button size="sm" onClick={() => handleSaveEdit(product._id)} style={{ flex: 1 }}>{t('common.save')}</Button>
                    <Button variant="ghost" size="sm" onClick={() => setEditingId(null)} style={{ flex: 1 }}>{t('common.cancel')}</Button>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ flex: 1 }}>
                    <Text bold style={{ display: 'block' }}>{product.name}</Text>
                    {product.brand && <Text variant="small" muted style={{ display: 'block', fontSize: '11px' }}>{product.brand}</Text>}
                    <Text variant="small" muted style={{ display: 'block', marginTop: '2px' }}>
                      {t('totals.macros', {
                        kcal: product.kcalPer100g.toFixed(0),
                        protein: product.proteinPer100g.toFixed(1),
                        fat: product.fatPer100g.toFixed(1),
                        carb: product.carbPer100g.toFixed(1),
                      })}
                    </Text>
                  </div>
                  {canEdit(product) && (
                    <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(product)} style={{ padding: '8px', minWidth: '36px', minHeight: '36px' }} aria-label="Редактировать">
                        <EditIcon />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setDeleteId(product._id)} style={{ padding: '8px', minWidth: '36px', minHeight: '36px' }} aria-label="Удалить">
                        <DeleteIcon />
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      <ConfirmSheet
        isOpen={deleteId !== null}
        title={t('products.deleteConfirm')}
        confirmLabel={t('common.delete')}
        danger
        onConfirm={() => deleteId && handleDelete(deleteId)}
        onClose={() => setDeleteId(null)}
      />
    </div>
  );
}
