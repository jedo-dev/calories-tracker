import { useEffect, useState } from 'react';
import { useTheme } from '../../theme/useTheme';
import { Text } from '../../ui/Text';
import { showToast } from '../../ui/Toast';
import { hapticImpact } from '../../utils/hapticFeedback';
import { SHARE_TEXT, SHARE_URL } from './shareDayImage';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  /** Нажали «Поделиться» — закрываем и нижнюю шторку меню */
  onShared: () => void;
  imageBlob: Blob | null;
}

// Полноэкранная модалка «Результат дня»: карточка-герой + одна pill-кнопка
// «Поделиться» (нативный share sheet). Без рядов соцсетей — системный шер
// сам предложит Telegram/VK/WhatsApp и «Сохранить изображение».
export function ShareDaySheet({ isOpen, onClose, onShared, imageBlob }: Props) {
  const theme = useTheme();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // двойной rAF, чтобы стартовое состояние успело отрисоваться до анимации
      requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
    } else {
      setVisible(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!imageBlob) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(imageBlob);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [imageBlob]);

  if (!isOpen) return null;

  const handleShare = async () => {
    if (!imageBlob) return;
    hapticImpact('medium');
    const file = new File([imageBlob], 'flareonfit-day.png', { type: 'image/png' });

    try {
      if (typeof navigator.share === 'function' && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], text: SHARE_TEXT });
      } else if (typeof navigator.share === 'function') {
        await navigator.share({ text: SHARE_TEXT, url: SHARE_URL });
      } else if (previewUrl) {
        // Десктоп без Web Share API — просто отдаём картинку файлом
        const a = document.createElement('a');
        a.href = previewUrl;
        a.download = 'flareonfit-day.png';
        a.click();
        showToast('Картинка сохранена');
      }
    } catch (err: any) {
      if (err?.name === 'AbortError') return; // юзер передумал в системном шере
      showToast('Не удалось поделиться');
      return;
    }
    onShared();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 30,
        display: 'flex',
        flexDirection: 'column',
        background: theme.palette.bg,
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(24px)',
        transition: 'opacity 220ms ease, transform 260ms cubic-bezier(0.22, 0.9, 0.24, 1)',
      }}
    >
      {/* Шапка: короткий тайтл слева, круглый ✕ справа */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '18px 16px 10px',
          flexShrink: 0,
        }}
      >
        <Text bold style={{ fontSize: '19px' }}>
          Результат дня
        </Text>
        <button
          type="button"
          onClick={onClose}
          aria-label="Закрыть"
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            border: 'none',
            background: 'rgba(255,255,255,0.08)',
            color: theme.palette.text,
            fontSize: '18px',
            lineHeight: 1,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            outline: 'none',
            WebkitTapHighlightColor: 'transparent',
            flexShrink: 0,
          }}
        >
          ✕
        </button>
      </div>

      {/* Карточка — герой экрана: превью во всю высоту, не обрезается кнопками */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '0 16px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        {previewUrl && (
          <img
            src={previewUrl}
            alt="Отчёт за день"
            style={{
              width: '100%',
              maxWidth: '400px',
              borderRadius: '22px',
              border: '1px solid rgba(146, 188, 221, 0.16)',
              boxShadow: '0 18px 40px rgba(0, 0, 0, 0.35)',
            }}
          />
        )}
      </div>

      {/* Единственный акцент: pill-кнопка в зоне большого пальца + подпись */}
      <div style={{ padding: '14px 16px calc(16px + env(safe-area-inset-bottom))', flexShrink: 0 }}>
        <button
          type="button"
          onClick={handleShare}
          style={{
            width: '100%',
            height: '60px',
            borderRadius: '999px',
            border: 'none',
            background: 'linear-gradient(180deg, rgba(83, 212, 107, 1), rgba(60, 170, 82, 1))',
            color: '#07210f',
            fontSize: '17px',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 14px 28px rgba(83, 212, 107, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            outline: 'none',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 16V3" />
            <path d="M7 8l5-5 5 5" />
            <path d="M4 13v6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-6" />
          </svg>
          Поделиться
        </button>
        <Text
          variant="small"
          muted
          style={{ display: 'block', textAlign: 'center', marginTop: '10px', fontSize: '12px', lineHeight: 1.4 }}
        >
          Откроется меню телефона: Telegram, VK, WhatsApp,
          <br />
          заметки, галерея — всё, что установлено
        </Text>
      </div>
    </div>
  );
}
