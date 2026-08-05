import { useTheme } from '../../theme/useTheme';
import { Avatar } from '../../ui/Avatar';
import { AVATARS } from '../../ui/avatarCatalog';
import { t } from '../../i18n';

interface AvatarPickerProps {
  value: string;
  onChange: (emoji: string) => void;
}

export function AvatarPicker({ value, onChange }: AvatarPickerProps) {
  const theme = useTheme();
  const activeIndex = Math.max(0, AVATARS.findIndex((a) => a.emoji === value));

  const step = (delta: number) => {
    const next = (activeIndex + delta + AVATARS.length) % AVATARS.length;
    onChange(AVATARS[next].emoji);
  };

  const arrowStyle: React.CSSProperties = {
    width: '32px',
    height: '32px',
    borderRadius: '10px',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    background: 'rgba(255, 255, 255, 0.06)',
    color: theme.palette.text,
    display: 'grid',
    placeItems: 'center',
    cursor: 'pointer',
    fontSize: '16px',
    flexShrink: 0,
    fontFamily: 'inherit',
  };

  return (
    <div style={{ marginTop: '12px' }}>
      <div
        style={{
          fontSize: '11px',
          fontWeight: 700,
          color: theme.palette.textMuted,
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          marginBottom: '8px',
        }}
      >
        {t('profile.avatarTitle')}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button type="button" aria-label="←" onClick={() => step(-1)} style={arrowStyle}>
          ‹
        </button>
        <div
          style={{
            display: 'flex',
            gap: '8px',
            flex: 1,
            justifyContent: 'center',
            overflowX: 'auto',
            padding: '4px 0',
          }}
        >
          {AVATARS.map((avatar) => {
            const active = avatar.emoji === value;
            return (
              <button
                key={avatar.key}
                type="button"
                aria-label={avatar.emoji}
                aria-pressed={active}
                onClick={() => onChange(avatar.emoji)}
                style={{
                  padding: 0,
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                  borderRadius: '50%',
                  transform: active ? 'scale(1.12)' : 'none',
                  transition: 'transform 0.15s ease, opacity 0.15s ease',
                  opacity: active ? 1 : 0.55,
                }}
              >
                <Avatar
                  emoji={avatar.emoji}
                  size={40}
                  borderWidth={2.5}
                  borderColor={active ? theme.palette.primary : 'rgba(160, 200, 220, 0.28)'}
                />
              </button>
            );
          })}
        </div>
        <button type="button" aria-label="→" onClick={() => step(1)} style={arrowStyle}>
          ›
        </button>
      </div>
    </div>
  );
}
