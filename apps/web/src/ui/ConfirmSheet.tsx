import { ReactNode } from 'react';
import { t } from '../i18n';
import { useTheme } from '../theme/useTheme';
import { BottomSheet } from './BottomSheet';
import { Text } from './Text';

interface ConfirmSheetProps {
  isOpen: boolean;
  title: string;
  description?: ReactNode;
  confirmLabel: string;
  danger?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function ConfirmSheet({
  isOpen,
  title,
  description,
  confirmLabel,
  danger,
  busy,
  onConfirm,
  onClose,
}: ConfirmSheetProps) {
  const theme = useTheme();

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose}>
      <div style={{ padding: '20px 16px 28px', maxWidth: '520px', margin: '0 auto' }}>
        <Text variant="h2" bold style={{ display: 'block', fontSize: '18px', marginBottom: '6px' }}>
          {title}
        </Text>
        {description && (
          <Text variant="small" muted style={{ display: 'block', marginBottom: '16px', lineHeight: 1.5 }}>
            {description}
          </Text>
        )}
        <div style={{ display: 'flex', gap: '10px', marginTop: description ? 0 : '16px' }}>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            style={{
              flex: 1,
              height: '48px',
              borderRadius: '16px',
              border: '1px solid rgba(160, 200, 220, 0.24)',
              background: 'rgba(255,255,255,0.06)',
              color: theme.palette.text,
              fontSize: '14px',
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            {t('common.cancel')}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            style={{
              flex: 1,
              height: '48px',
              borderRadius: '16px',
              border: 'none',
              background: danger
                ? 'linear-gradient(180deg, rgba(255, 110, 110, 1), rgba(214, 74, 74, 1))'
                : 'linear-gradient(180deg, rgba(83, 212, 107, 1), rgba(60, 170, 82, 1))',
              color: danger ? '#2a0808' : '#07210f',
              fontSize: '14px',
              fontWeight: 700,
              cursor: 'pointer',
              opacity: busy ? 0.6 : 1,
              fontFamily: 'inherit',
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </BottomSheet>
  );
}
