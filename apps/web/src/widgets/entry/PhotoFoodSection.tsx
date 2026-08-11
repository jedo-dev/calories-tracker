import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../../api/client';
import { t } from '../../i18n';
import { glassCardStyle } from '../../theme/styles';
import { useTheme } from '../../theme/useTheme';
import { Button } from '../../ui/Button';
import { Text } from '../../ui/Text';
import { showToast } from '../../ui/Toast';

interface RecognizedItem {
  name: string;
  grams: number;
  kcalPer100g: number;
  proteinPer100g: number;
  fatPer100g: number;
  carbPer100g: number;
  confidence: 'high' | 'medium' | 'low';
}

interface EditableItem extends RecognizedItem {
  checked: boolean;
  gramsInput: string;
}

interface Props {
  date: string;
  time: string;
  mealType: string;
}

// Ужимаем фото до 768px по длинной стороне — этого хватает для распознавания
// еды, а входных токенов уходит в разы меньше, чем от исходного снимка.
const MAX_SIDE = 768;
const JPEG_QUALITY = 0.65;

async function downscaleToBase64(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas unavailable');
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const dataUrl = canvas.toDataURL('image/jpeg', JPEG_QUALITY);
  return dataUrl.slice(dataUrl.indexOf(',') + 1);
}

// Кнопка «Определить по фото» + карточка подтверждения распознанных блюд.
// После подтверждения создаёт продукты (или переиспользует существующие
// по точному совпадению имени) и записи в дневнике.
export function PhotoFoodSection({ date, time, mealType }: Props) {
  const theme = useTheme();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [items, setItems] = useState<EditableItem[] | null>(null);
  const [saving, setSaving] = useState(false);

  const handleFile = async (file: File) => {
    setAnalyzing(true);
    setItems(null);
    try {
      const imageBase64 = await downscaleToBase64(file);
      const res = await apiClient.post('/ai/food-photo', { imageBase64, mediaType: 'image/jpeg' });
      const recognized: RecognizedItem[] = res.data?.items || [];
      if (recognized.length === 0) {
        showToast(t('aiPhoto.nothingFound'));
        return;
      }
      setItems(
        recognized.map((item) => ({
          ...item,
          checked: true,
          gramsInput: String(Math.round(item.grams)),
        })),
      );
    } catch (err: any) {
      showToast(err.response?.data?.message || t('aiPhoto.failed'));
    } finally {
      setAnalyzing(false);
    }
  };

  const findOrCreateProduct = async (item: EditableItem): Promise<string> => {
    // Сначала ищем точное совпадение по имени, чтобы не плодить дубли
    try {
      const search = await apiClient.get('/products', { params: { search: item.name, limit: 5 } });
      const match = (search.data || []).find(
        (p: any) => String(p.name).trim().toLowerCase() === item.name.trim().toLowerCase(),
      );
      if (match) return match._id;
    } catch {
      // поиск не критичен — создадим новый продукт
    }

    const created = await apiClient.post('/products', {
      name: item.name,
      kcalPer100g: item.kcalPer100g,
      proteinPer100g: item.proteinPer100g,
      fatPer100g: item.fatPer100g,
      carbPer100g: item.carbPer100g,
    });
    return created.data._id;
  };

  const handleSave = async () => {
    if (!items) return;
    const selected = items.filter((i) => i.checked && parseFloat(i.gramsInput) > 0);
    if (selected.length === 0) {
      showToast(t('aiPhoto.nothingSelected'));
      return;
    }

    setSaving(true);
    let saved = 0;
    try {
      for (const item of selected) {
        const productId = await findOrCreateProduct(item);
        await apiClient.post('/entries', {
          date,
          ...(time && { time }),
          mealType,
          productId,
          grams: parseFloat(item.gramsInput),
        });
        saved++;
      }
      showToast(t('aiPhoto.added', { count: saved }));
      navigate('/today');
    } catch (err: any) {
      showToast(err.response?.data?.message || t('aiPhoto.saveFailed'));
      if (saved > 0) navigate('/today');
    } finally {
      setSaving(false);
    }
  };

  const updateItem = (index: number, patch: Partial<EditableItem>) => {
    setItems((prev) => (prev ? prev.map((it, i) => (i === index ? { ...it, ...patch } : it)) : prev));
  };

  const selectedCount = items?.filter((i) => i.checked).length ?? 0;

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        style={{ display: 'none' }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = '';
          if (file) handleFile(file);
        }}
      />

      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={analyzing}
        style={{
          width: '100%',
          height: '48px',
          borderRadius: '16px',
          border: '1px solid rgba(160, 200, 220, 0.22)',
          background: 'rgba(255,255,255,0.06)',
          color: theme.palette.text,
          fontSize: '15px',
          fontWeight: 700,
          cursor: analyzing ? 'wait' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          marginBottom: '10px',
          opacity: analyzing ? 0.7 : 1,
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
          <circle cx="12" cy="13" r="4" />
        </svg>
        {analyzing ? t('aiPhoto.analyzing') : t('aiPhoto.button')}
      </button>

      {items && (
        <div style={{ ...glassCardStyle, marginBottom: '10px', border: `1px solid ${theme.palette.primary}55` }}>
          <Text bold style={{ display: 'block', marginBottom: '2px' }}>
            {t('aiPhoto.confirmTitle')}
          </Text>
          <Text variant="small" muted style={{ display: 'block', marginBottom: '10px' }}>
            {t('aiPhoto.confirmHint')}
          </Text>

          {items.map((item, index) => {
            const grams = parseFloat(item.gramsInput) || 0;
            const kcal = Math.round((item.kcalPer100g * grams) / 100);
            return (
              <div
                key={index}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '8px 0',
                  borderTop: index === 0 ? 'none' : '1px solid rgba(255,255,255,0.08)',
                  opacity: item.checked ? 1 : 0.45,
                }}
              >
                <input
                  type="checkbox"
                  checked={item.checked}
                  onChange={(e) => updateItem(index, { checked: e.target.checked })}
                  style={{ width: '18px', height: '18px', flexShrink: 0, accentColor: theme.palette.primary }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Text bold style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.name}
                    {item.confidence === 'low' && (
                      <span title={t('aiPhoto.lowConfidence')} style={{ marginLeft: '6px' }}>⚠️</span>
                    )}
                  </Text>
                  <Text variant="small" muted>
                    {item.kcalPer100g.toFixed(0)} ккал/100г · {kcal} ккал
                  </Text>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                  <input
                    type="number"
                    inputMode="numeric"
                    min="1"
                    value={item.gramsInput}
                    onChange={(e) => updateItem(index, { gramsInput: e.target.value })}
                    disabled={!item.checked}
                    style={{
                      width: '64px',
                      height: '38px',
                      padding: '0 8px',
                      borderRadius: '10px',
                      border: '1px solid rgba(160, 200, 220, 0.18)',
                      background: 'rgba(3, 18, 28, 0.5)',
                      color: theme.palette.text,
                      fontSize: '15px',
                      outline: 'none',
                      textAlign: 'right',
                      boxSizing: 'border-box',
                    }}
                  />
                  <Text variant="small" muted>г</Text>
                </div>
              </div>
            );
          })}

          <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
            <Button variant="ghost" onClick={() => setItems(null)} disabled={saving} style={{ flex: 1 }}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleSave} disabled={saving || selectedCount === 0} style={{ flex: 2 }}>
              {saving ? t('common.saving') : t('aiPhoto.addSelected', { count: selectedCount })}
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
