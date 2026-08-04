import { useState } from 'react';
import { t } from '../i18n';
import { useTheme } from '../theme/useTheme';
import ringLoader from '../assets/loader/ring-loader.svg';
import dotsLoader from '../assets/loader/dots-loader.svg';
import dumbbellLoader from '../assets/loader/dumbbell-loader.svg';
import foxLoader from '../assets/loader/fox-loader.svg';

// SMIL-animated brand loaders (apps/web/src/assets/loader).
// Fullscreen alternates «кольцо»/«блины», inline — «гантель»/«лис».
const FULLSCREEN_LOADERS = [ringLoader, dotsLoader];
const INLINE_LOADERS = [dumbbellLoader, foxLoader];

const pick = (variants: string[]) => variants[Math.floor(Math.random() * variants.length)];

const Loader = () => {
  const theme = useTheme();
  // chosen once per mount so it doesn't flicker between variants on re-render
  const [src] = useState(() => pick(FULLSCREEN_LOADERS));

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: theme.palette.bg,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '18px',
      }}
    >
      <img src={src} alt={t('common.loading')} style={{ width: '120px', height: '120px' }} />
      <style>{`
        @keyframes pulse-text {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 0.15; }
        }
      `}</style>
      <div
        style={{
          fontSize: '15px',
          fontWeight: 600,
          color: theme.palette.textMuted,
          animation: 'pulse-text 2s infinite',
        }}
      >
        {t('common.loading')}
      </div>
    </div>
  );
};

// Compact loader for in-card / in-list loading states
export function InlineLoader({ size = 64 }: { size?: number }) {
  const [src] = useState(() => pick(INLINE_LOADERS));
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0' }}>
      <img src={src} alt={t('common.loading')} style={{ width: size, height: size }} />
    </div>
  );
}

export default Loader;
