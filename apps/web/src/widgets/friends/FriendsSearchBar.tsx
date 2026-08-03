import { t } from '../../i18n';
import { useTheme } from '../../theme/useTheme';

interface FriendsSearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export function FriendsSearchBar({ value, onChange }: FriendsSearchBarProps) {
  const theme = useTheme();
  return (
    <div style={{ position: 'relative', marginBottom: '12px' }}>
      <span
        style={{
          position: 'absolute',
          left: '14px',
          top: '50%',
          transform: 'translateY(-50%)',
          fontSize: '15px',
          pointerEvents: 'none',
          opacity: 0.7,
        }}
      >
        🔍
      </span>
      <input
        type="text"
        placeholder={t('friends.searchPlaceholder')}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: '100%',
          boxSizing: 'border-box',
          height: '46px',
          padding: '0 14px 0 40px',
          borderRadius: '16px',
          border: '1px solid rgba(160, 200, 220, 0.18)',
          background: 'linear-gradient(180deg, rgba(17, 49, 69, 0.96), rgba(10, 32, 46, 0.96))',
          color: theme.palette.text,
          fontSize: '14px',
          outline: 'none',
          boxShadow: '0 12px 26px rgba(0, 0, 0, 0.22)',
        }}
      />
    </div>
  );
}
