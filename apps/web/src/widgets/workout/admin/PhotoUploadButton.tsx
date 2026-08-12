import { IconCamera } from '../../../ui/navIcons';
import { useRef, useState } from 'react';
import { apiClient } from '../../../api/client';
import { t } from '../../../i18n';
import { useTheme } from '../../../theme/useTheme';

interface PhotoUploadButtonProps {
  // e.g. /workouts/exercises/<id>/photo — expects multipart field "photo"
  uploadUrl: string;
  onUploaded: (url: string) => void;
  compact?: boolean;
}

export function PhotoUploadButton({ uploadUrl, onUploaded, compact }: PhotoUploadButtonProps) {
  const theme = useTheme();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  const handleFile = async (file: File) => {
    setBusy(true);
    setError(false);
    try {
      const form = new FormData();
      form.append('photo', file);
      const res = await apiClient.post(uploadUrl, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      onUploaded(res.data.imageUrl || res.data.gifUrl || res.data.photoUrl);
    } catch (err) {
      console.error('Photo upload failed', err);
      setError(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        style={{ display: 'none' }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = '';
        }}
      />
      <button
        type="button"
        disabled={busy}
        onClick={() => inputRef.current?.click()}
        style={{
          padding: compact ? '6px 10px' : '8px 12px',
          borderRadius: '12px',
          border: `1px solid ${error ? 'rgba(255,110,110,0.5)' : 'rgba(160, 200, 220, 0.24)'}`,
          background: 'rgba(255,255,255,0.07)',
          color: error ? '#ff8a8a' : theme.palette.text,
          fontSize: '11px',
          fontWeight: 700,
          cursor: 'pointer',
          whiteSpace: 'nowrap',
          opacity: busy ? 0.6 : 1,
          fontFamily: 'inherit',
          flexShrink: 0,
        }}
      >
        {busy ? t('workout.uploading') : (<><IconCamera size={14} style={{ verticalAlign: '-2px', marginRight: '5px' }} />{t('workout.uploadPhoto')}</>)}
      </button>
    </>
  );
}
