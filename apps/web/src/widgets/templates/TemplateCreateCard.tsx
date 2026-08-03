import { useEffect, useState } from 'react';
import { apiClient } from '../../api/client';
import { useDebounce } from '../../hooks/useDebounce';
import { t } from '../../i18n';
import { useTheme } from '../../theme/useTheme';
import { Text } from '../../ui/Text';
import { MEAL_TYPES, MEAL_TYPE_EMOJI, MealType } from './mealTypes';
import type { TemplateItem } from './TemplateCard';

interface Product {
  _id: string;
  name: string;
  kcalPer100g: number;
}

interface TemplateCreateCardProps {
  onSaved: () => void;
  onCancel: () => void;
}

export function TemplateCreateCard({ onSaved, onCancel }: TemplateCreateCardProps) {
  const theme = useTheme();
  const [name, setName] = useState('');
  const [mealType, setMealType] = useState<MealType>('other');
  const [search, setSearch] = useState('');
  const [grams, setGrams] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [items, setItems] = useState<TemplateItem[]>([]);
  const [saving, setSaving] = useState(false);

  const debouncedSearch = useDebounce(search, 300);

  useEffect(() => {
    if (debouncedSearch.trim().length >= 2) {
      apiClient
        .get('/products', { params: { search: debouncedSearch, limit: 10 } })
        .then((r) => setProducts(r.data))
        .catch(() => setProducts([]));
    } else {
      setProducts([]);
    }
  }, [debouncedSearch]);

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

  const handleAddProduct = (p: Product) => {
    const g = grams ? parseFloat(grams) : 100;
    const kcal = Math.round((p.kcalPer100g * g) / 100);
    setItems((prev) => [...prev, { productId: p._id, productName: p.name, grams: g, kcal }]);
    setSearch('');
    setGrams('');
    setProducts([]);
  };

  const handleSave = async () => {
    if (!name.trim() || items.length === 0) return;
    setSaving(true);
    try {
      await apiClient.post('/templates', { name: name.trim(), mealType, items });
      onSaved();
    } catch (err) {
      console.error('Failed to save template', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      style={{
        marginBottom: '12px',
        borderRadius: '22px',
        background: 'linear-gradient(180deg, rgba(17, 49, 69, 0.96), rgba(10, 32, 46, 0.96))',
        border: `1px solid ${theme.palette.primary}55`,
        boxShadow: '0 22px 44px rgba(0, 0, 0, 0.28)',
        padding: '14px',
      }}
    >
      <Text variant="h2" bold style={{ display: 'block', fontSize: '16px', marginBottom: '10px' }}>
        {t('template.create')}
      </Text>

      <input
        placeholder={t('template.name')}
        value={name}
        onChange={(e) => setName(e.target.value)}
        style={{ ...inputStyle, marginBottom: '10px' }}
      />

      <Text variant="small" muted style={{ display: 'block', marginBottom: '6px', fontSize: '11px' }}>
        {t('template.mealTypeLabel')}
      </Text>
      <div style={{ display: 'flex', gap: '6px', marginBottom: '10px', overflowX: 'auto', scrollbarWidth: 'none' }}>
        {MEAL_TYPES.map((type) => {
          const active = mealType === type;
          return (
            <button
              key={type}
              type="button"
              onClick={() => setMealType(type)}
              aria-pressed={active}
              style={{
                padding: '8px 11px',
                borderRadius: '12px',
                border: `1px solid ${active ? theme.palette.primary : 'rgba(255,255,255,0.12)'}`,
                background: active
                  ? `linear-gradient(180deg, ${theme.palette.primary}33, ${theme.palette.primary}1f)`
                  : 'rgba(255,255,255,0.06)',
                color: active ? theme.palette.primary : theme.palette.textMuted,
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                flexShrink: 0,
                fontFamily: 'inherit',
              }}
            >
              {MEAL_TYPE_EMOJI[type]} {t(`mealType.${type}`)}
            </button>
          );
        })}
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
        <input
          placeholder={t('entry.productSearch')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ ...inputStyle, flex: 2 }}
        />
        <input
          type="number"
          placeholder={t('entry.grams')}
          value={grams}
          min="1"
          onChange={(e) => setGrams(e.target.value)}
          style={{ ...inputStyle, flex: 1 }}
        />
      </div>

      {products.length > 0 && (
        <div
          style={{
            maxHeight: '180px',
            overflowY: 'auto',
            borderRadius: '13px',
            border: '1px solid rgba(255,255,255,0.08)',
            marginBottom: '8px',
          }}
        >
          {products.map((p) => (
            <button
              key={p._id}
              type="button"
              onClick={() => handleAddProduct(p)}
              style={{
                width: '100%',
                padding: '9px 12px',
                border: 'none',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                background: 'none',
                cursor: 'pointer',
                textAlign: 'left',
                color: theme.palette.text,
                fontSize: '13px',
                fontFamily: 'inherit',
              }}
            >
              {p.name} <span style={{ color: theme.palette.textMuted, fontSize: '11px' }}>— {p.kcalPer100g} ккал/100г</span>
            </button>
          ))}
        </div>
      )}

      {items.length > 0 && (
        <div style={{ marginBottom: '10px' }}>
          {items.map((item, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '7px 0',
                borderBottom: '1px solid rgba(255,255,255,0.07)',
              }}
            >
              <Text variant="small" style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {item.productName} — {item.grams}г
              </Text>
              <Text variant="small" muted style={{ whiteSpace: 'nowrap' }}>{item.kcal} ккал</Text>
              <button
                type="button"
                aria-label={t('common.delete')}
                onClick={() => setItems((prev) => prev.filter((_, j) => j !== i))}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#ff8a8a',
                  cursor: 'pointer',
                  fontSize: '14px',
                  padding: '2px 4px',
                  flexShrink: 0,
                }}
              >
                ✕
              </button>
            </div>
          ))}
          <div style={{ textAlign: 'right', marginTop: '8px' }}>
            <Text bold style={{ color: theme.palette.primary }}>
              {t('template.total')}: {items.reduce((s, i) => s + i.kcal, 0)} ккал
            </Text>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          type="button"
          onClick={onCancel}
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
          disabled={!name.trim() || items.length === 0 || saving}
          onClick={handleSave}
          style={{
            flex: 2,
            height: '44px',
            borderRadius: '14px',
            border: 'none',
            background:
              !name.trim() || items.length === 0
                ? 'rgba(255,255,255,0.08)'
                : 'linear-gradient(180deg, rgba(83, 212, 107, 1), rgba(60, 170, 82, 1))',
            color: !name.trim() || items.length === 0 ? theme.palette.textMuted : '#07210f',
            fontSize: '13px',
            fontWeight: 700,
            cursor: !name.trim() || items.length === 0 ? 'default' : 'pointer',
            opacity: saving ? 0.6 : 1,
            fontFamily: 'inherit',
          }}
        >
          {t('common.save')}
        </button>
      </div>
    </div>
  );
}
