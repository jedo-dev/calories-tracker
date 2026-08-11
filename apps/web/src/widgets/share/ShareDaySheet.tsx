import { useEffect, useState } from 'react';
import { useTheme } from '../../theme/useTheme';
import { BottomSheet } from '../../ui/BottomSheet';
import { Text } from '../../ui/Text';
import { showToast } from '../../ui/Toast';
import { hapticImpact } from '../../utils/hapticFeedback';
import { SHARE_TEXT, SHARE_URL } from './shareDayImage';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  imageBlob: Blob | null;
}

// Шторка «Поделиться результатом дня»: превью картинки-отчёта, нативный
// шаринг файлом (мобильные), ссылки на соцсети и скачивание для десктопа.
export function ShareDaySheet({ isOpen, onClose, imageBlob }: Props) {
  const theme = useTheme();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!imageBlob) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(imageBlob);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [imageBlob]);

  const canNativeShareFile = () => {
    if (!imageBlob || typeof navigator.share !== 'function') return false;
    const file = new File([imageBlob], 'flareonfit-day.png', { type: 'image/png' });
    return typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] });
  };

  const handleNativeShare = async () => {
    if (!imageBlob) return;
    hapticImpact('medium');
    try {
      const file = new File([imageBlob], 'flareonfit-day.png', { type: 'image/png' });
      if (canNativeShareFile()) {
        await navigator.share({ files: [file], text: SHARE_TEXT });
      } else if (typeof navigator.share === 'function') {
        await navigator.share({ text: SHARE_TEXT, url: SHARE_URL });
      }
    } catch (err: any) {
      if (err?.name !== 'AbortError') {
        showToast('Не удалось поделиться');
      }
    }
  };

  const handleDownload = () => {
    if (!previewUrl) return;
    hapticImpact('light');
    const a = document.createElement('a');
    a.href = previewUrl;
    a.download = 'flareonfit-day.png';
    a.click();
  };

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(SHARE_TEXT);
      showToast('Текст скопирован');
    } catch {
      showToast('Не удалось скопировать');
    }
  };

  const encodedUrl = encodeURIComponent(SHARE_URL);
  const encodedText = encodeURIComponent(SHARE_TEXT);
  const socials: { label: string; icon: string; href: string; color: string }[] = [
    { label: 'Telegram', icon: '✈️', href: `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`, color: '#2AABEE' },
    { label: 'VK', icon: '🔵', href: `https://vk.com/share.php?url=${encodedUrl}&comment=${encodedText}`, color: '#4C75A3' },
    { label: 'WhatsApp', icon: '💬', href: `https://wa.me/?text=${encodedText}`, color: '#25D366' },
  ];

  const actionButtonStyle: React.CSSProperties = {
    minHeight: '48px',
    borderRadius: '14px',
    border: '1px solid rgba(160, 200, 220, 0.18)',
    background: 'linear-gradient(180deg, rgba(17, 49, 69, 0.94), rgba(10, 32, 46, 0.94))',
    color: theme.palette.text,
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    outline: 'none',
    WebkitTapHighlightColor: 'transparent',
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose}>
      <div style={{ padding: `0 ${theme.spacing.lg}`, paddingBottom: theme.spacing.xl }}>
        <Text variant="h2" bold style={{ display: 'block', textAlign: 'center', marginBottom: theme.spacing.md }}>
          Поделиться результатом дня
        </Text>

        {previewUrl && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              marginBottom: theme.spacing.md,
            }}
          >
            <img
              src={previewUrl}
              alt="Отчёт за день"
              style={{
                maxWidth: '260px',
                width: '100%',
                borderRadius: '18px',
                border: '1px solid rgba(146, 188, 221, 0.22)',
                boxShadow: '0 18px 36px rgba(0, 0, 0, 0.35)',
              }}
            />
          </div>
        )}

        <button
          type="button"
          onClick={handleNativeShare}
          style={{
            width: '100%',
            minHeight: '52px',
            borderRadius: '16px',
            border: 'none',
            background: 'linear-gradient(180deg, rgba(83, 212, 107, 1), rgba(60, 170, 82, 1))',
            color: '#07210f',
            fontSize: '16px',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 14px 26px rgba(83, 212, 107, 0.22)',
            outline: 'none',
            WebkitTapHighlightColor: 'transparent',
            marginBottom: theme.spacing.sm,
          }}
        >
          📤 Поделиться
        </button>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: theme.spacing.sm,
            marginBottom: theme.spacing.sm,
          }}
        >
          {socials.map((s) => (
            <a
              key={s.label}
              href={s.href}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => hapticImpact('light')}
              style={{ ...actionButtonStyle, textDecoration: 'none', borderColor: `${s.color}55` }}
            >
              <span>{s.icon}</span>
              {s.label}
            </a>
          ))}
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: theme.spacing.sm,
          }}
        >
          <button type="button" onClick={handleDownload} style={actionButtonStyle}>
            ⬇️ Скачать картинку
          </button>
          <button type="button" onClick={handleCopyText} style={actionButtonStyle}>
            📋 Скопировать текст
          </button>
        </div>

        <Text
          variant="small"
          muted
          style={{ display: 'block', textAlign: 'center', marginTop: theme.spacing.md }}
        >
          В соцсети уходит ссылка с текстом, картинку приложи из скачанных
        </Text>
      </div>
    </BottomSheet>
  );
}
