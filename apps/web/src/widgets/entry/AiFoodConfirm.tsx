import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../../api/client';
import { t } from '../../i18n';
import { glassCardStyle } from '../../theme/styles';
import { useTheme } from '../../theme/useTheme';
import { Button } from '../../ui/Button';
import { Text } from '../../ui/Text';
import { showToast } from '../../ui/Toast';

export interface RecognizedItem {
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
  items: RecognizedItem[];
  date: string;
  time: string;
  mealType: string;
  /** Бейдж источника: «определено с фото» / «записано с голоса» */
  tagLabel: string;
  tagIcon: React.ReactNode;
  onClose: () => void;
}

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

// Карточки подтверждения распознанных нейросетью блюд (общие для фото и
// голоса). После подтверждения создаёт продукты (или переиспользует
// существующие по точному совпадению имени) и записи в дневнике.
export function AiFoodConfirm({ items, date, time, mealType, tagLabel, tagIcon, onClose }: Props) {
  const theme = useTheme();
  const navigate = useNavigate();
  const toEditable = (list: RecognizedItem[]) =>
    list.map((item) => ({ ...item, gramsInput: String(Math.round(item.grams)) }));

  const [editable, setEditable] = useState<EditableItem[]>(() => toEditable(items));
  const [saving, setSaving] = useState(false);

  // Родитель может подсунуть новый результат распознавания без размонтирования
  const itemsRef = useRef(items);
  useEffect(() => {
    if (itemsRef.current !== items) {
      itemsRef.current = items;
      setEditable(toEditable(items));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

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
    const valid = editable.filter((i) => parseFloat(i.gramsInput) > 0);
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
    setEditable((prev) => prev.map((it, i) => (i === index ? { ...it, gramsInput } : it)));
  };

  const removeItem = (index: number) => {
    setEditable((prev) => prev.filter((_, i) => i !== index));
  };

  useEffect(() => {
    // Пользователь удалил все карточки крестиками — закрываем блок целиком
    if (items.length > 0 && editable.length === 0) onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editable.length]);

  if (editable.length === 0) return null;

  return (
    <>
      <Text variant="small" muted style={{ display: 'block', marginBottom: '8px' }}>
        {t('aiPhoto.confirmHint')}
      </Text>

      {editable.map((item, index) => {
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
                  {tagIcon}
                  {tagLabel}
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
                  {aiGrams}г
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
        <Button variant="ghost" onClick={onClose} disabled={saving} style={{ flex: 1 }}>
          {t('common.cancel')}
        </Button>
        <Button onClick={handleSave} disabled={saving} style={{ flex: 2 }}>
          {saving ? t('common.saving') : t('aiPhoto.addSelected', { count: editable.length })}
        </Button>
      </div>
    </>
  );
}
