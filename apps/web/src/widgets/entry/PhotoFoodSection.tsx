import { IconCamera } from '../../ui/navIcons';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../../api/client';
import { t } from '../../i18n';
import { useTheme } from '../../theme/useTheme';
import { Text } from '../../ui/Text';
import { showToast } from '../../ui/Toast';
import { AiFoodConfirm, RecognizedItem } from './AiFoodConfirm';

interface Props {
  date: string;
  time: string;
  mealType: string;
  /** Диплинк /entry/new?mode=photo: сразу открыть выбор/съёмку фото. */
  autoOpenPicker?: boolean;
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

// Кнопка «Определить по фото» + карточки подтверждения (AiFoodConfirm).
export function PhotoFoodSection({ date, time, mealType, autoOpenPicker = false }: Props) {
  const theme = useTheme();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [items, setItems] = useState<RecognizedItem[] | null>(null);
  // null = квота ещё грузится (кнопку не блокируем, бэк всё равно проверит)
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    apiClient
      .get('/ai/quota')
      .then((res) => setRemaining(res.data?.remaining ?? null))
      .catch(() => setRemaining(null));
  }, []);

  // Диплинк из листа быстрых действий: открываем системный выбор фото сразу.
  // Если браузер требует жеста и блокирует программный click — пользователь
  // просто нажмёт видимую кнопку, ничего не ломается.
  useEffect(() => {
    if (autoOpenPicker) fileInputRef.current?.click();
  }, [autoOpenPicker]);

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
      setItems(recognized);
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
        <AiFoodConfirm
          items={items}
          date={date}
          time={time}
          mealType={mealType}
          tagLabel={t('aiPhoto.tag')}
          tagIcon={<IconCamera size={12} style={{ verticalAlign: '-2px', marginRight: '4px' }} />}
          onClose={() => setItems(null)}
        />
      )}
    </>
  );
}
