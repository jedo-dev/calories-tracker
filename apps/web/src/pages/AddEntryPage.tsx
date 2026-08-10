import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { apiClient } from '../api/client';
import { RecentProducts } from '../features/TodayComponents/RecentProducts';
import { useDebounce } from '../hooks/useDebounce';
import { t, toISODate } from '../i18n';
import { showToast } from '../ui/Toast';
import { glassCardStyle, pageBackground } from '../theme/styles';
import { useTheme } from '../theme/useTheme';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Text } from '../ui/Text';
import { BarcodeScanner } from '../ui/BarcodeScanner';

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
  servingGrams?: number;
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

function formatTime(date: Date): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

// Guess the meal from the clock so the user rarely has to touch the selector
function mealTypeForTime(time: string): string {
  const hour = parseInt(time.split(':')[0], 10);
  if (isNaN(hour)) return 'other';
  if (hour >= 5 && hour < 11) return 'breakfast';
  if (hour >= 11 && hour < 16) return 'lunch';
  if (hour >= 16 && hour < 22) return 'dinner';
  return 'snack';
}

const cardStyle = glassCardStyle;

const MACRO_COLORS = { protein: '#5AC8FA', fat: '#FFCC66', carb: '#C792EA' };

const chipBtn = (theme: any): React.CSSProperties => ({
  height: '44px',
  padding: '0 14px',
  borderRadius: '14px',
  border: '1px solid rgba(160, 200, 220, 0.18)',
  background: 'rgba(255,255,255,0.06)',
  color: theme.palette.text,
  fontSize: '13px',
  fontWeight: 700,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
  flexShrink: 0,
});

export function AddEntryPage() {
  const navigate = useNavigate();
  const theme = useTheme();
  const { id } = useParams();
  const isEdit = !!id;

  const [date, setDate] = useState(toISODate(new Date()));
  const [time, setTime] = useState(() => formatTime(new Date()));
  const [mealType, setMealType] = useState(() => mealTypeForTime(formatTime(new Date())));
  // once the user picks a meal manually, stop following the clock
  const [mealTypeTouched, setMealTypeTouched] = useState(false);
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
  const [showScanner, setShowScanner] = useState(false);
  const [foundInOff, setFoundInOff] = useState(false);
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
      setMealTypeTouched(true);
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
      // Иначе сбой поиска выглядит как «ничего не найдено».
      showToast(t('common.loadError'));
    }
  };

  const handleBarcodeSearch = async (code?: string) => {
    const barcode = (code ?? barcodeInput).trim();
    if (!barcode) return;
    setBarcodeSearching(true);
    setBarcodeNotFound(false);
    setNotFoundBarcode('');
    setFoundInOff(false);
    setError(null);

    try {
      const response = await apiClient.get(`/products/barcode/${barcode}`);
      const data = response.data;

      if (data.found) {
        setFoundInOff(data.origin === 'openfoodfacts');
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
        setNotFoundBarcode(barcode);
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
    setFoundInOff(false);
    if (product.servingGrams) setGrams(String(product.servingGrams));
  };

  const handleSave = async () => {
    if (!selectedProduct) {
      showToast(t('entry.noProductSelected'));
      return;
    }
    if (!grams || parseFloat(grams) <= 0) {
      showToast(t('entry.invalidGrams'));
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
    <div
      style={{
        padding: '12px',
        maxWidth: '520px',
        margin: '0 auto',
        minHeight: '100vh',
        paddingBottom: '100px',
        background: pageBackground(theme.palette.bg),
      }}
    >
      <Text variant="h2" bold style={{ fontSize: '20px', display: 'block', marginBottom: '12px' }}>
        {isEdit ? t('entry.edit') : t('entry.add')}
      </Text>

      {error && (
        <div style={{ ...cardStyle, marginBottom: '10px', border: '1px solid rgba(255,120,120,0.35)' }}>
          <Text style={{ color: '#ff8a8a' }}>
            {t('common.error')}: {error}
          </Text>
        </div>
      )}

      {/* Barcode scan */}
      <button
        type="button"
        onClick={() => setShowScanner(true)}
        disabled={barcodeSearching}
        style={{
          width: '100%',
          height: '48px',
          borderRadius: '16px',
          border: '1px solid rgba(160, 200, 220, 0.22)',
          background: 'rgba(255,255,255,0.06)',
          color: theme.palette.text,
          fontSize: '15px',
          fontWeight: 700,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          marginBottom: '10px',
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 8V5a2 2 0 0 1 2-2h3M16 3h3a2 2 0 0 1 2 2v3M21 16v3a2 2 0 0 1-2 2h-3M8 21H5a2 2 0 0 1-2-2v-3" />
          <path d="M7 8v8M10.5 8v8M14 8v8M17 8v8" />
        </svg>
        {barcodeSearching ? t('barcode.searching') : t('barcode.scan')}
      </button>

      {barcodeNotFound && (
        <div style={{ ...cardStyle, marginBottom: '10px' }}>
          <Text variant="small" muted style={{ display: 'block' }}>
            {t('barcode.notFound', { code: notFoundBarcode })}
          </Text>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowCreateForm(true)}
            style={{ marginTop: theme.spacing.xs }}
          >
            {t('barcode.createProduct')}
          </Button>
        </div>
      )}

      {showScanner && (
        <BarcodeScanner
          onClose={() => setShowScanner(false)}
          onDetected={(code) => {
            setShowScanner(false);
            setBarcodeInput(code);
            handleBarcodeSearch(code);
          }}
        />
      )}

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

      {/* Time + meal type in one row; the date is always today */}
      <div style={{ ...cardStyle, marginBottom: '10px' }}>
        <div style={{ display: 'flex', gap: '10px' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: 600, color: theme.palette.textMuted, fontSize: '12px' }}>
              Время
            </label>
            <input
              type="time"
              value={time}
              onChange={(e) => {
                setTime(e.target.value);
                if (!mealTypeTouched) setMealType(mealTypeForTime(e.target.value));
              }}
              style={{
                width: '100%',
                boxSizing: 'border-box',
                height: '44px',
                padding: '0 10px',
                borderRadius: '14px',
                border: '1px solid rgba(160, 200, 220, 0.18)',
                background: 'rgba(3, 18, 28, 0.5)',
                color: theme.palette.text,
                fontSize: '15px',
                outline: 'none',
                colorScheme: 'dark',
              }}
            />
          </div>
          <div style={{ flex: 1.4, minWidth: 0 }}>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: 600, color: theme.palette.textMuted, fontSize: '12px' }}>
              {t('entry.mealType')}
            </label>
            <select
              value={mealType}
              onChange={(e) => { setMealType(e.target.value); setMealTypeTouched(true); }}
              style={{
                width: '100%',
                height: '44px',
                padding: '0 10px',
                borderRadius: '14px',
                border: '1px solid rgba(160, 200, 220, 0.18)',
                background: 'rgba(3, 18, 28, 0.5)',
                color: theme.palette.text,
                fontSize: '15px',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            >
              <option value="breakfast">{t('mealType.breakfast')}</option>
              <option value="lunch">{t('mealType.lunch')}</option>
              <option value="dinner">{t('mealType.dinner')}</option>
              <option value="snack">{t('mealType.snack')}</option>
              <option value="other">{t('mealType.other')}</option>
            </select>
          </div>
        </div>
      </div>

      {!selectedProduct && (
      <div style={{ marginBottom: theme.spacing.md }}>
        <label style={{ display: 'block', marginBottom: '4px', fontWeight: 600, color: theme.palette.textMuted, fontSize: '12px' }}>
          {t('entry.product')}
        </label>
        <input
          type="text"
          placeholder={t('entry.productSearch')}
          value={productSearch}
          onChange={(e) => setProductSearch(e.target.value)}
          style={{
            width: '100%',
            boxSizing: 'border-box',
            height: '46px',
            padding: '0 14px',
            borderRadius: '16px',
            border: '1px solid rgba(160, 200, 220, 0.18)',
            background: 'rgba(255, 255, 255, 0.06)',
            color: theme.palette.text,
            fontSize: '15px',
            outline: 'none',
          }}
        />
        {products.length > 0 && (
          <div
            style={{
              ...cardStyle,
              marginTop: '8px',
              maxHeight: '260px',
              overflowY: 'auto',
              padding: 0,
            }}
          >
            {products.map((product) => (
              <div
                key={product._id}
                onClick={() => handleProductSelect(product)}
                style={{
                  padding: '10px 12px',
                  cursor: 'pointer',
                  borderBottom: '1px solid rgba(255,255,255,0.07)',
                  display: 'flex',
                  flexDirection: 'column',
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
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '2px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: theme.palette.primary }}>{product.kcalPer100g.toFixed(0)}</span>
                  <span style={{ fontSize: '11px', color: theme.palette.textMuted }}>ккал ·</span>
                  <span style={{ fontSize: '12px' }}><span style={{ color: MACRO_COLORS.protein, fontWeight: 700 }}>Б</span> {product.proteinPer100g.toFixed(1)}</span>
                  <span style={{ fontSize: '12px' }}><span style={{ color: MACRO_COLORS.fat, fontWeight: 700 }}>Ж</span> {product.fatPer100g.toFixed(1)}</span>
                  <span style={{ fontSize: '12px' }}><span style={{ color: MACRO_COLORS.carb, fontWeight: 700 }}>У</span> {product.carbPer100g.toFixed(1)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      )}

      {/* Selected product: KBJU per 100g + live total for the entered grams */}
      {selectedProduct && (() => {
        const g = parseFloat(grams) || 0;
        const factor = g / 100;
        const total = {
          kcal: selectedProduct.kcalPer100g * factor,
          protein: selectedProduct.proteinPer100g * factor,
          fat: selectedProduct.fatPer100g * factor,
          carb: selectedProduct.carbPer100g * factor,
        };
        return (
          <div style={{ ...cardStyle, marginBottom: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <Text bold style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {selectedProduct.name}
              </Text>
              <button
                type="button"
                onClick={() => { setSelectedProduct(null); setGrams(''); }}
                aria-label={t('common.cancel')}
                style={{ background: 'none', border: 'none', color: theme.palette.textMuted, cursor: 'pointer', fontSize: '18px', lineHeight: 1, padding: '2px 4px', flexShrink: 0 }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', flexWrap: 'wrap' }}>
              <span style={{ whiteSpace: 'nowrap' }}>
                <span style={{ fontSize: '15px', fontWeight: 800, color: theme.palette.primary }}>{selectedProduct.kcalPer100g.toFixed(0)}</span>
                <span style={{ fontSize: '11px', color: theme.palette.textMuted }}> ккал</span>
              </span>
              <span style={{ whiteSpace: 'nowrap' }}><span style={{ fontSize: '11px', fontWeight: 800, color: MACRO_COLORS.protein }}>Б</span><span style={{ fontSize: '13px', fontWeight: 700 }}> {selectedProduct.proteinPer100g.toFixed(1)}</span></span>
              <span style={{ whiteSpace: 'nowrap' }}><span style={{ fontSize: '11px', fontWeight: 800, color: MACRO_COLORS.fat }}>Ж</span><span style={{ fontSize: '13px', fontWeight: 700 }}> {selectedProduct.fatPer100g.toFixed(1)}</span></span>
              <span style={{ whiteSpace: 'nowrap' }}><span style={{ fontSize: '11px', fontWeight: 800, color: MACRO_COLORS.carb }}>У</span><span style={{ fontSize: '13px', fontWeight: 700 }}> {selectedProduct.carbPer100g.toFixed(1)}</span></span>
              <span style={{ fontSize: '11px', color: theme.palette.textMuted }}>на 100 г</span>
            </div>

            {foundInOff && (
              <Text variant="small" muted style={{ display: 'block', marginTop: '8px', fontSize: '11px' }}>
                {t('barcode.foundInOff')}
              </Text>
            )}

            {/* grams */}
            <div style={{ marginTop: '12px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: 600, color: theme.palette.textMuted, fontSize: '12px' }}>
                {t('entry.grams')}
              </label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input
                  type="number"
                  inputMode="decimal"
                  step="1"
                  min="1"
                  placeholder={t('entry.gramsPlaceholder')}
                  value={grams}
                  onChange={(e) => setGrams(e.target.value)}
                  style={{
                    flex: 1,
                    minWidth: 0,
                    boxSizing: 'border-box',
                    height: '44px',
                    padding: '0 12px',
                    borderRadius: '14px',
                    border: '1px solid rgba(160, 200, 220, 0.18)',
                    background: 'rgba(3, 18, 28, 0.5)',
                    color: theme.palette.text,
                    fontSize: '16px',
                    outline: 'none',
                  }}
                />
                {selectedProduct.servingGrams ? (
                  <button type="button" onClick={() => setGrams(String(selectedProduct.servingGrams))} style={chipBtn(theme)}>
                    {selectedProduct.servingGrams}г
                  </button>
                ) : null}
                <button type="button" onClick={() => setGrams('100')} style={chipBtn(theme)}>100г</button>
              </div>
            </div>

            {/* live total */}
            <div
              style={{
                marginTop: '12px',
                padding: '10px 12px',
                borderRadius: '14px',
                background: g > 0 ? theme.palette.primary + '1f' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${g > 0 ? theme.palette.primary + '55' : 'rgba(255,255,255,0.08)'}`,
                display: 'flex',
                alignItems: 'baseline',
                gap: '12px',
                flexWrap: 'wrap',
              }}
            >
              <span style={{ fontSize: '12px', color: theme.palette.textMuted }}>Итого {g > 0 ? `${g} г` : ''}:</span>
              <span><span style={{ fontSize: '20px', fontWeight: 800, color: theme.palette.primary }}>{Math.round(total.kcal)}</span><span style={{ fontSize: '11px', color: theme.palette.textMuted }}> ккал</span></span>
              <span style={{ fontSize: '13px', fontWeight: 700 }}><span style={{ color: MACRO_COLORS.protein }}>Б</span> {total.protein.toFixed(1)}</span>
              <span style={{ fontSize: '13px', fontWeight: 700 }}><span style={{ color: MACRO_COLORS.fat }}>Ж</span> {total.fat.toFixed(1)}</span>
              <span style={{ fontSize: '13px', fontWeight: 700 }}><span style={{ color: MACRO_COLORS.carb }}>У</span> {total.carb.toFixed(1)}</span>
            </div>
          </div>
        );
      })()}

      <div style={{ display: 'flex', gap: '10px' }}>
        <Button variant="secondary" onClick={() => navigate(-1)} style={{ flex: 1, borderRadius: '16px' }}>
          {t('common.cancel')}
        </Button>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || !selectedProduct}
          style={{
            flex: 2,
            height: '48px',
            borderRadius: '16px',
            border: 'none',
            background: !selectedProduct ? 'rgba(255,255,255,0.08)' : 'linear-gradient(180deg, rgba(83, 212, 107, 1), rgba(60, 170, 82, 1))',
            color: !selectedProduct ? theme.palette.textMuted : '#07210f',
            fontSize: '15px',
            fontWeight: 700,
            cursor: !selectedProduct || saving ? 'default' : 'pointer',
            boxShadow: !selectedProduct ? 'none' : '0 14px 26px rgba(83, 212, 107, 0.22)',
          }}
        >
          {saving ? t('common.saving') : t('common.save')}
        </button>
      </div>

      {/* Quick add: recent products, one tap straight into the diary */}
      {!isEdit && (
        <div style={{ ...cardStyle, marginTop: '14px' }}>
          <Text bold style={{ fontSize: '16px', display: 'block' }}>
            Быстрое добавление
          </Text>
          <Text variant="small" muted style={{ display: 'block', marginTop: '2px', marginBottom: '8px' }}>
            Нажми на продукт, чтобы сразу добавить его в дневник
          </Text>
          <RecentProducts date={date} onAdded={() => navigate('/today')} compact />
        </div>
      )}
    </div>
  );
}

