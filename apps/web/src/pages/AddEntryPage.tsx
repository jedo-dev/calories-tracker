import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { apiClient } from '../api/client';
import { RecentProducts } from '../features/TodayComponents/RecentProducts';
import { useDebounce } from '../hooks/useDebounce';
import { t } from '../i18n';
import { useTheme } from '../theme/useTheme';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Text } from '../ui/Text';

interface Product {
  _id: string;
  name: string;
  brand?: string;
  barcode?: string;
  kcalPer100g: number;
  proteinPer100g: number;
  fatPer100g: number;
  carbPer100g: number;
  source?: string;
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

  // Barcode state
  const [barcodeInput, setBarcodeInput] = useState('');
  const [barcodeSearching, setBarcodeSearching] = useState(false);
  const [barcodeNotFound, setBarcodeNotFound] = useState(false);
  const [notFoundBarcode, setNotFoundBarcode] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    brand: '',
    kcalPer100g: '',
    proteinPer100g: '',
    fatPer100g: '',
    carbPer100g: '',
  });

  const debouncedSearch = useDebounce(productSearch, 300);

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

  const handleBarcodeSearch = async () => {
    if (!barcodeInput.trim()) return;
    setBarcodeSearching(true);
    setBarcodeNotFound(false);
    setNotFoundBarcode('');
    setError(null);

    try {
      const response = await apiClient.get(`/products/barcode/${barcodeInput.trim()}`);
      const data = response.data;

      if (data.found) {
        setSelectedProduct({
          _id: data._id,
          name: data.name,
          brand: data.brand,
          barcode: data.barcode,
          kcalPer100g: data.kcalPer100g,
          proteinPer100g: data.proteinPer100g,
          fatPer100g: data.fatPer100g,
          carbPer100g: data.carbPer100g,
        });
        setBarcodeInput('');
        setBarcodeNotFound(false);
      } else {
        setBarcodeNotFound(true);
        setNotFoundBarcode(barcodeInput);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка поиска по штрихкоду');
    } finally {
      setBarcodeSearching(false);
    }
  };

  const handleCreateFromBarcode = async () => {
    if (!newProduct.name || !newProduct.kcalPer100g) {
      setError('Заполните название и калорийность');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const response = await apiClient.post('/products', {
        name: newProduct.name,
        brand: newProduct.brand || undefined,
        barcode: notFoundBarcode,
        kcalPer100g: parseFloat(newProduct.kcalPer100g),
        proteinPer100g: newProduct.proteinPer100g ? parseFloat(newProduct.proteinPer100g) : 0,
        fatPer100g: newProduct.fatPer100g ? parseFloat(newProduct.fatPer100g) : 0,
        carbPer100g: newProduct.carbPer100g ? parseFloat(newProduct.carbPer100g) : 0,
      });

      setSelectedProduct(response.data);
      setShowCreateForm(false);
      setBarcodeNotFound(false);
      setBarcodeInput('');
      setNewProduct({ name: '', brand: '', kcalPer100g: '', proteinPer100g: '', fatPer100g: '', carbPer100g: '' });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка создания продукта');
    } finally {
      setSaving(false);
    }
  };

  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product);
    setProductSearch('');
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

  if (loading) {
    return (
      <div style={{ padding: theme.spacing.lg, textAlign: 'center' }}>
        <Text>{t('common.loading')}</Text>
      </div>
    );
  }

  return (
    <div style={{ padding: theme.spacing.lg, maxWidth: '600px', margin: '0 auto', minHeight: '100vh', paddingBottom: '100px', backgroundColor: theme.palette.bg }}>
      <Text variant="h1" style={{ marginBottom: theme.spacing.lg }}>
        {isEdit ? t('entry.edit') : t('entry.add')}
      </Text>

      {error && (
        <Card style={{ marginBottom: theme.spacing.md, backgroundColor: theme.palette.danger + '20' }}>
          <Text style={{ color: theme.palette.danger }}>
            {t('common.error')}: {error}
          </Text>
        </Card>
      )}

      {!isEdit && (
        <Card
          style={{
            marginBottom: theme.spacing.md,
            background: 'linear-gradient(180deg, rgba(22, 58, 77, 0.96) 0%, rgba(12, 34, 49, 0.98) 100%)',
            border: '1px solid rgba(146, 188, 221, 0.16)',
            borderRadius: '24px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: theme.spacing.md, alignItems: 'flex-start', marginBottom: theme.spacing.sm }}>
            <div>
              <Text bold style={{ fontSize: '18px', display: 'block' }}>
                Быстрое добавление
              </Text>
              <Text variant="small" muted style={{ display: 'block', marginTop: '2px' }}>
                Нажми на продукт, чтобы сразу добавить его в дневник
              </Text>
            </div>
          </div>
          <RecentProducts date={date} onAdded={() => void 0} compact />
        </Card>
      )}

      {/* Barcode Scanner Section */}
      <Card style={{ marginBottom: theme.spacing.md }}>
        <Text variant="h2" style={{ marginBottom: theme.spacing.sm }}>📷 Штрихкод</Text>
        <div style={{ display: 'flex', gap: theme.spacing.sm }}>
          <Input
            type="text"
            placeholder="Введите штрихкод"
            value={barcodeInput}
            onChange={(e) => setBarcodeInput(e.target.value)}
            style={{ flex: 1 }}
          />
          <Button
            onClick={handleBarcodeSearch}
            disabled={barcodeSearching || !barcodeInput.trim()}
            style={{ minWidth: '100px' }}
          >
            {barcodeSearching ? 'Поиск...' : 'Найти'}
          </Button>
        </div>

        {barcodeNotFound && (
          <div style={{ marginTop: theme.spacing.sm }}>
            <Text variant="small" muted>
              Продукт со штрихкодом {notFoundBarcode} не найден
            </Text>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowCreateForm(true)}
              style={{ marginTop: theme.spacing.xs }}
            >
              Создать продукт
            </Button>
          </div>
        )}
      </Card>

      {/* Create Product from Barcode Form */}
      {showCreateForm && barcodeNotFound && (
        <Card style={{ marginBottom: theme.spacing.md, border: `2px solid ${theme.palette.primary}` }}>
          <Text variant="h2" style={{ marginBottom: theme.spacing.sm }}>Создать продукт</Text>
          <Text variant="small" muted style={{ marginBottom: theme.spacing.sm }}>
            Штрихкод: {notFoundBarcode}
          </Text>
          <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.sm }}>
            <Input
              label="Название *"
              value={newProduct.name}
              onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
              placeholder="Йогурт натуральный"
            />
            <Input
              label="Бренд"
              value={newProduct.brand}
              onChange={(e) => setNewProduct({ ...newProduct, brand: e.target.value })}
              placeholder="Danone"
            />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: theme.spacing.sm }}>
              <Input
                label="Калории на 100г *"
                type="number"
                value={newProduct.kcalPer100g}
                onChange={(e) => setNewProduct({ ...newProduct, kcalPer100g: e.target.value })}
                placeholder="60"
              />
              <Input
                label="Белки на 100г"
                type="number"
                value={newProduct.proteinPer100g}
                onChange={(e) => setNewProduct({ ...newProduct, proteinPer100g: e.target.value })}
                placeholder="4.3"
              />
              <Input
                label="Жиры на 100г"
                type="number"
                value={newProduct.fatPer100g}
                onChange={(e) => setNewProduct({ ...newProduct, fatPer100g: e.target.value })}
                placeholder="1.5"
              />
              <Input
                label="Углеводы на 100г"
                type="number"
                value={newProduct.carbPer100g}
                onChange={(e) => setNewProduct({ ...newProduct, carbPer100g: e.target.value })}
                placeholder="6.2"
              />
            </div>
            <div style={{ display: 'flex', gap: theme.spacing.sm }}>
              <Button variant="ghost" onClick={() => { setShowCreateForm(false); setBarcodeNotFound(false); }} style={{ flex: 1 }}>
                Отмена
              </Button>
              <Button onClick={handleCreateFromBarcode} disabled={saving} style={{ flex: 1 }}>
                {saving ? 'Создание...' : 'Создать'}
              </Button>
            </div>
          </div>
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
                  backgroundColor: selectedProduct?._id === product._id ? theme.palette.gray_100 : 'transparent',
                  borderBottom: `1px solid ${selectedProduct?._id === product._id ? theme.palette.text : theme.palette.border}`,
                  display: 'flex',
                  flexDirection: 'column',
                }}
                onMouseEnter={(e) => {
                  if (selectedProduct?._id !== product._id) {
                    e.currentTarget.style.backgroundColor = theme.palette.white;
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedProduct?._id !== product._id) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.xs }}>
                  <Text bold style={{ color: theme.palette.text }}>{product.name}</Text>
                  {product.source === 'RECIPE' && (
                    <span style={{
                      fontSize: '11px',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      backgroundColor: theme.palette.primary + '20',
                      color: theme.palette.primary,
                      fontWeight: '600',
                    }}>
                      {t('recipes.dish')}
                    </span>
                  )}
                </div>
                <Text variant="small" muted>{t('totals.macros', {
                  kcal: product.kcalPer100g.toFixed(1),
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

