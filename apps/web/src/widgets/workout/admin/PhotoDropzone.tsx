import { useRef } from 'react';
import { t } from '../../../i18n';
import { useTheme } from '../../../theme/useTheme';
import { Text } from '../../../ui/Text';

interface PhotoDropzoneProps {
  // current photo (http url or local data: preview); empty = dropzone state
  photoUrl: string;
  alt: string;
  onSelect: (file: File) => void;
  busy?: boolean;
}

// Recipe-editor style photo picker: 16:9 dashed dropzone, or preview with a
// "replace" overlay button. Selection is delegated up (upload or local preview).
export function PhotoDropzone({ photoUrl, alt, onSelect, busy }: PhotoDropzoneProps) {
  const theme = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const pick = () => fileInputRef.current?.click();

  return (
    <div style={{ marginBottom: '12px' }}>
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
          <div style={{ position: 'absolute', right: '10px', bottom: '10px' }}>
            <button
              type="button"
              onClick={pick}
              disabled={busy}
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
                opacity: busy ? 0.6 : 1,
                fontFamily: 'inherit',
              }}
            >
              {busy ? t('workout.uploading') : '📷 Заменить фото'}
            </button>
          </div>
        </div>
      ) : (
        <div
          onClick={pick}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') pick(); }}
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
            gap: '6px',
          }}
        >
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke={theme.palette.textMuted} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="4" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <path d="M21 15l-5-5L5 21" />
          </svg>
          <Text variant="small" muted>{busy ? t('workout.uploading') : t('workout.uploadPhoto')}</Text>
        </div>
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        style={{ display: 'none' }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onSelect(file);
          e.target.value = '';
        }}
      />
    </div>
  );
}
