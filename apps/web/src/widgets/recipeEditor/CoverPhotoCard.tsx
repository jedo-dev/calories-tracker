import { useRef } from 'react';
import { t } from '../../i18n';
import { glassCardStyle } from '../../theme/styles';
import { useTheme } from '../../theme/useTheme';
import { Card } from '../../ui/Card';
import { Text } from '../../ui/Text';

interface CoverPhotoCardProps {
  photoUrl: string;
  alt: string;
  /** Пользователь выбрал файл (валидация/загрузка — на стороне страницы). */
  onFileSelected: (file: File) => void;
  onRemove: () => void;
}

// Обложка рецепта: превью + заменить/удалить + скрытый file-input.
export function CoverPhotoCard({ photoUrl, alt, onFileSelected, onRemove }: CoverPhotoCardProps) {
  const theme = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <Card style={{ ...glassCardStyle, marginBottom: '12px' }}>
      <Text variant="h2" bold style={{ marginBottom: theme.spacing.sm, fontSize: '18px' }}>{t('recipeEditor.coverPhoto')}</Text>
      {photoUrl ? (
        <div style={{ position: 'relative' }}>
          <img
            src={photoUrl}
            alt={alt}
            style={{
              width: '100%',
              aspectRatio: '16 / 9',
              objectFit: 'cover',
              borderRadius: '14px',
              display: 'block',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          />
          <div style={{ position: 'absolute', right: '10px', bottom: '10px', display: 'flex', gap: '6px' }}>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              style={{
                padding: '8px 12px',
                borderRadius: '12px',
                border: '1px solid rgba(255,255,255,0.18)',
                background: 'rgba(3, 18, 28, 0.72)',
                color: theme.palette.text,
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                backdropFilter: 'blur(6px)',
              }}
            >
              {t('recipeEditor.replacePhoto')}
            </button>
            <button
              type="button"
              onClick={onRemove}
              style={{
                padding: '8px 12px',
                borderRadius: '12px',
                border: '1px solid rgba(255,120,120,0.35)',
                background: 'rgba(3, 18, 28, 0.72)',
                color: '#ff8a8a',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                backdropFilter: 'blur(6px)',
              }}
            >
              {t('recipeEditor.removePhoto')}
            </button>
          </div>
        </div>
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          style={{
            width: '100%',
            aspectRatio: '16 / 9',
            boxSizing: 'border-box',
            border: '2px dashed rgba(160, 200, 220, 0.28)',
            borderRadius: '14px',
            background: 'rgba(255,255,255,0.03)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            gap: theme.spacing.xs,
          }}
        >
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke={theme.palette.textMuted} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="4" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <path d="M21 15l-5-5L5 21" />
          </svg>
          <Text variant="small" muted>{t('recipeEditor.addPhoto')}</Text>
        </div>
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        style={{ display: 'none' }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFileSelected(file);
          e.target.value = '';
        }}
      />
    </Card>
  );
}
