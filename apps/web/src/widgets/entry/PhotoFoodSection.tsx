import { useEffect, useRef, useState } from 'react';
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
  gramsInput: string;
}

interface Props {
  date: string;
  time: string;
  mealType: string;
}

const MACRO_COLORS = { protein: '#5AC8FA', fat: '#FFCC66', carb: '#C792EA' };

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

// Кнопка «Определить по фото» + карточки подтверждения распознанных блюд
// (в стиле карточки выбранного продукта). После подтверждения создаёт
// продукты (или переиспользует существующие по точному совпадению имени)
// и записи в дневнике.
export function PhotoFoodSection({ date, time, mealType }: Props) {
  const theme = useTheme();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [items, setItems] = useState<EditableItem[] | null>(null);
  const [saving, setSaving] = useState(false);
  // null = квота ещё грузится (кнопку не блокируем, бэк всё равно проверит)
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    apiClient
      .get('/ai/quota')
      .then((res) => setRemaining(res.data?.remaining ?? null))
      .catch(() => setRemaining(null));
  }, []);

  const quotaExhausted = remaining !== null && remaining <= 0;

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
          gramsInput: String(Math.round(item.grams)),
        })),
      );
      setRemaining((prev) => (prev !== null ? Math.max(0, prev - 1) : prev));
    } catch (err: any) {
      if (err.response?.status === 403) {
        setRemaining(0);
        showToast(t('aiPhoto.limitExhausted'));
      } else {
        showToast(err.response?.data?.message || t('aiPhoto.failed'));
      }
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
    const valid = items.filter((i) => parseFloat(i.gramsInput) > 0);
    if (valid.length === 0) {
      showToast(t('aiPhoto.nothingSelected'));
      return;
    }

    setSaving(true);
    let saved = 0;
    try {
      for (const item of valid) {
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

  const updateGrams = (index: number, gramsInput: string) => {
    setItems((prev) => (prev ? prev.map((it, i) => (i === index ? { ...it, gramsInput } : it)) : prev));
  };

  const removeItem = (index: number) => {
    setItems((prev) => {
      if (!prev) return prev;
      const next = prev.filter((_, i) => i !== index);
      return next.length > 0 ? next : null;
    });
  };

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
        onClick={() => {
          if (quotaExhausted) {
            navigate('/ai-limits');
            return;
          }
          fileInputRef.current?.click();
        }}
        disabled={analyzing}
        style={{
          width: '100%',
          height: '48px',
          borderRadius: '16px',
          border: '1px solid rgba(160, 200, 220, 0.22)',
          background: 'rgba(255,255,255,0.06)',
          color: quotaExhausted ? theme.palette.textMuted : theme.palette.text,
          fontSize: '15px',
          fontWeight: 700,
          cursor: analyzing ? 'wait' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          marginBottom: quotaExhausted ? '4px' : '10px',
          opacity: analyzing ? 0.7 : 1,
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
          <circle cx="12" cy="13" r="4" />
        </svg>
        {analyzing
          ? t('aiPhoto.analyzing')
          : quotaExhausted
            ? t('aiPhoto.limitButton')
            : t('aiPhoto.button')}
        {!analyzing && !quotaExhausted && remaining !== null && (
          <span style={{ fontSize: '12px', fontWeight: 700, color: theme.palette.textMuted }}>
            · {remaining}
          </span>
        )}
      </button>
      {quotaExhausted && (
        <div
          onClick={() => navigate('/ai-limits')}
          style={{ marginBottom: '10px', cursor: 'pointer', textAlign: 'center' }}
        >
          <Text variant="small" muted>
            {t('aiPhoto.limitHint')}
          </Text>
        </div>
      )}

      {items && (
        <>
          <Text variant="small" muted style={{ display: 'block', marginBottom: '8px' }}>
            {t('aiPhoto.confirmHint')}
          </Text>

          {items.map((item, index) => {
            const g = parseFloat(item.gramsInput) || 0;
            const factor = g / 100;
            const total = {
              kcal: item.kcalPer100g * factor,
              protein: item.proteinPer100g * factor,
              fat: item.fatPer100g * factor,
              carb: item.carbPer100g * factor,
            };
            const aiGrams = Math.round(item.grams);

            return (
              <div key={index} style={{ ...glassCardStyle, marginBottom: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '8px' }}>
                  <div style={{ minWidth: 0 }}>
                    <Text bold style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.name}
                    </Text>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        marginTop: '6px',
                        padding: '3px 8px',
                        borderRadius: '999px',
                        fontSize: '11px',
                        fontWeight: 700,
                        color: theme.palette.primary,
                        background: theme.palette.primary + '1a',
                        border: `1px solid ${theme.palette.primary}45`,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      📷 {t('aiPhoto.tag')}
                      {item.confidence === 'low' && <span title={t('aiPhoto.lowConfidence')}> · ⚠️</span>}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    aria-label={t('common.delete')}
                    style={{ background: 'none', border: 'none', color: theme.palette.textMuted, cursor: 'pointer', fontSize: '18px', lineHeight: 1, padding: '2px 4px', flexShrink: 0 }}
                  >
                    ✕
                  </button>
                </div>

                <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', flexWrap: 'wrap' }}>
                  <span style={{ whiteSpace: 'nowrap' }}>
                    <span style={{ fontSize: '15px', fontWeight: 800, color: theme.palette.primary }}>{item.kcalPer100g.toFixed(0)}</span>
                    <span style={{ fontSize: '11px', color: theme.palette.textMuted }}> ккал</span>
                  </span>
                  <span style={{ whiteSpace: 'nowrap' }}><span style={{ fontSize: '11px', fontWeight: 800, color: MACRO_COLORS.protein }}>Б</span><span style={{ fontSize: '13px', fontWeight: 700 }}> {item.proteinPer100g.toFixed(1)}</span></span>
                  <span style={{ whiteSpace: 'nowrap' }}><span style={{ fontSize: '11px', fontWeight: 800, color: MACRO_COLORS.fat }}>Ж</span><span style={{ fontSize: '13px', fontWeight: 700 }}> {item.fatPer100g.toFixed(1)}</span></span>
                  <span style={{ whiteSpace: 'nowrap' }}><span style={{ fontSize: '11px', fontWeight: 800, color: MACRO_COLORS.carb }}>У</span><span style={{ fontSize: '13px', fontWeight: 700 }}> {item.carbPer100g.toFixed(1)}</span></span>
                  <span style={{ fontSize: '11px', color: theme.palette.textMuted }}>{t('entry.per100g')}</span>
                </div>

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
                      value={item.gramsInput}
                      onChange={(e) => updateGrams(index, e.target.value)}
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
                    <button type="button" onClick={() => updateGrams(index, String(aiGrams))} style={chipBtn(theme)} title={t('aiPhoto.aiGramsHint')}>
                      📷 {aiGrams}г
                    </button>
                    <button type="button" onClick={() => updateGrams(index, '100')} style={chipBtn(theme)}>100г</button>
                  </div>
                </div>

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
                  <span style={{ fontSize: '12px', color: theme.palette.textMuted }}>{t('entry.totalLabel')} {g > 0 ? `${g} г` : ''}:</span>
                  <span><span style={{ fontSize: '20px', fontWeight: 800, color: theme.palette.primary }}>{Math.round(total.kcal)}</span><span style={{ fontSize: '11px', color: theme.palette.textMuted }}> ккал</span></span>
                  <span style={{ fontSize: '13px', fontWeight: 700 }}><span style={{ color: MACRO_COLORS.protein }}>Б</span> {total.protein.toFixed(1)}</span>
                  <span style={{ fontSize: '13px', fontWeight: 700 }}><span style={{ color: MACRO_COLORS.fat }}>Ж</span> {total.fat.toFixed(1)}</span>
                  <span style={{ fontSize: '13px', fontWeight: 700 }}><span style={{ color: MACRO_COLORS.carb }}>У</span> {total.carb.toFixed(1)}</span>
                </div>
              </div>
            );
          })}

          <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
            <Button variant="ghost" onClick={() => setItems(null)} disabled={saving} style={{ flex: 1 }}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleSave} disabled={saving} style={{ flex: 2 }}>
              {saving ? t('common.saving') : t('aiPhoto.addSelected', { count: items.length })}
            </Button>
          </div>
        </>
      )}
    </>
  );
}
