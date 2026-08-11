import { useState } from 'react';
import { apiClient } from '../../api/client';
import { t } from '../../i18n';
import { glassCardStyle } from '../../theme/styles';
import { useTheme } from '../../theme/useTheme';
import { BarcodeScanner } from '../../ui/BarcodeScanner';
import { Button } from '../../ui/Button';
import { Card } from '../../ui/Card';
import { Input } from '../../ui/Input';
import { Text } from '../../ui/Text';
import { showToast } from '../../ui/Toast';

export interface BarcodeProduct {
  _id: string;
  name: string;
  brand?: string;
  barcode?: string;
  kcalPer100g: number;
  proteinPer100g: number;
  fatPer100g: number;
  carbPer100g: number;
  servingGrams?: number;
}

interface BarcodeSectionProps {
  /** Продукт найден по штрихкоду или создан вручную. fromOff — пришёл из Open Food Facts. */
  onProductSelected: (product: BarcodeProduct, fromOff: boolean) => void;
}

const EMPTY_FORM = { name: '', brand: '', kcalPer100g: '', proteinPer100g: '', fatPer100g: '', carbPer100g: '' };

// Сканер штрихкода + «продукт не найден» + форма создания продукта.
// Владеет всем штрихкод-стейтом; страница получает только выбранный продукт.
export function BarcodeSection({ onProductSelected }: BarcodeSectionProps) {
  const theme = useTheme();
  const [searching, setSearching] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [notFoundBarcode, setNotFoundBarcode] = useState('');
  const [showScanner, setShowScanner] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const search = async (code: string) => {
    const barcode = code.trim();
    if (!barcode) return;
    setSearching(true);
    setNotFound(false);
    setNotFoundBarcode('');

    try {
      const response = await apiClient.get(`/products/barcode/${barcode}`);
      const data = response.data;

      if (data.found) {
        onProductSelected(
          {
            _id: data._id,
            name: data.name,
            brand: data.brand,
            barcode: data.barcode,
            kcalPer100g: data.kcalPer100g,
            proteinPer100g: data.proteinPer100g,
            fatPer100g: data.fatPer100g,
            carbPer100g: data.carbPer100g,
          },
          data.origin === 'openfoodfacts',
        );
      } else {
        setNotFound(true);
        setNotFoundBarcode(barcode);
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || t('barcode.searchFailed'));
    } finally {
      setSearching(false);
    }
  };

  const createProduct = async () => {
    if (!form.name || !form.kcalPer100g) {
      showToast(t('barcode.fillRequired'));
      return;
    }

    setCreating(true);
    try {
      const response = await apiClient.post('/products', {
        name: form.name,
        brand: form.brand || undefined,
        barcode: notFoundBarcode,
        kcalPer100g: parseFloat(form.kcalPer100g),
        proteinPer100g: form.proteinPer100g ? parseFloat(form.proteinPer100g) : 0,
        fatPer100g: form.fatPer100g ? parseFloat(form.fatPer100g) : 0,
        carbPer100g: form.carbPer100g ? parseFloat(form.carbPer100g) : 0,
      });

      onProductSelected(response.data, false);
      setShowCreateForm(false);
      setNotFound(false);
      setForm(EMPTY_FORM);
    } catch (err: any) {
      showToast(err.response?.data?.message || t('barcode.createFailed'));
    } finally {
      setCreating(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setShowScanner(true)}
        disabled={searching}
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
        {searching ? t('barcode.searching') : t('barcode.scan')}
      </button>

      {notFound && (
        <div style={{ ...glassCardStyle, marginBottom: '10px' }}>
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
            search(code);
          }}
        />
      )}

      {showCreateForm && notFound && (
        <Card style={{ marginBottom: theme.spacing.md, border: `2px solid ${theme.palette.primary}` }}>
          <Text variant="h2" style={{ marginBottom: theme.spacing.sm }}>{t('barcode.createTitle')}</Text>
          <Text variant="small" muted style={{ marginBottom: theme.spacing.sm }}>
            {t('barcode.codeLabel')}: {notFoundBarcode}
          </Text>
          <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.sm }}>
            <Input
              label={t('barcode.nameLabel')}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Йогурт натуральный"
            />
            <Input
              label={t('barcode.brandLabel')}
              value={form.brand}
              onChange={(e) => setForm({ ...form, brand: e.target.value })}
              placeholder="Danone"
            />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: theme.spacing.sm }}>
              <Input
                label={t('barcode.kcalLabel')}
                type="number"
                value={form.kcalPer100g}
                onChange={(e) => setForm({ ...form, kcalPer100g: e.target.value })}
                placeholder="60"
              />
              <Input
                label={t('barcode.proteinLabel')}
                type="number"
                value={form.proteinPer100g}
                onChange={(e) => setForm({ ...form, proteinPer100g: e.target.value })}
                placeholder="4.3"
              />
              <Input
                label={t('barcode.fatLabel')}
                type="number"
                value={form.fatPer100g}
                onChange={(e) => setForm({ ...form, fatPer100g: e.target.value })}
                placeholder="1.5"
              />
              <Input
                label={t('barcode.carbLabel')}
                type="number"
                value={form.carbPer100g}
                onChange={(e) => setForm({ ...form, carbPer100g: e.target.value })}
                placeholder="6.2"
              />
            </div>
            <div style={{ display: 'flex', gap: theme.spacing.sm }}>
              <Button variant="ghost" onClick={() => { setShowCreateForm(false); setNotFound(false); }} style={{ flex: 1 }}>
                {t('common.cancel')}
              </Button>
              <Button onClick={createProduct} disabled={creating} style={{ flex: 1 }}>
                {creating ? t('barcode.creating') : t('barcode.create')}
              </Button>
            </div>
          </div>
        </Card>
      )}
    </>
  );
}
