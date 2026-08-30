import { useEffect, useState } from 'react';
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

// --- fullscreen overlay bus ---------------------------------------------
// Pages simply render <Loader />; the actual visuals live in a single
// fixed overlay (LoaderOverlayHost in App). The overlay stays on screen for
// at least MIN_VISIBLE_MS and fades out, so fast responses don't produce a
// one-frame flash, and back-to-back loaders (auth → page data) don't blink.
const MIN_VISIBLE_MS = 600;
const FADE_MS = 280;

type HostState = { src: string; fading: boolean } | null;

let hostSetState: ((state: HostState) => void) | null = null;
let activeCount = 0;
let shownAt = 0;
let currentSrc = '';
let hideTimer: ReturnType<typeof setTimeout> | null = null;
let fadeTimer: ReturnType<typeof setTimeout> | null = null;

function busShow() {
  activeCount++;
  if (hideTimer) clearTimeout(hideTimer);
  if (fadeTimer) clearTimeout(fadeTimer);
  if (!currentSrc) {
    currentSrc = pick(FULLSCREEN_LOADERS);
    shownAt = Date.now();
  }
  hostSetState?.({ src: currentSrc, fading: false });
}

function busHide() {
  activeCount = Math.max(0, activeCount - 1);
  if (activeCount > 0) return;
  const wait = Math.max(0, MIN_VISIBLE_MS - (Date.now() - shownAt));
  hideTimer = setTimeout(() => {
    if (activeCount > 0) return;
    hostSetState?.({ src: currentSrc, fading: true });
    fadeTimer = setTimeout(() => {
      if (activeCount > 0) return;
      currentSrc = '';
      hostSetState?.(null);
    }, FADE_MS);
  }, wait);
}

// Mounted once in App; renders the actual fullscreen loader overlay.
export function LoaderOverlayHost() {
  const theme = useTheme();
  const [state, setState] = useState<HostState>(null);

  useEffect(() => {
    hostSetState = setState;
    return () => {
      hostSetState = null;
    };
  }, []);

  if (!state) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 40,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '18px',
        backgroundColor: theme.palette.bg,
        opacity: state.fading ? 0 : 1,
        transition: `opacity ${FADE_MS}ms ease`,
        pointerEvents: state.fading ? 'none' : 'auto',
      }}
    >
      <style>{`
        @keyframes loader-pop {
          from { opacity: 0; transform: scale(0.92); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes pulse-text {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 0.15; }
        }
      `}</style>
      <img
        src={state.src}
        alt={t('common.loading')}
        style={{ width: '120px', height: '120px', animation: 'loader-pop 0.3s ease' }}
      />
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
}

// Fullscreen loading state used by pages: `if (loading) return <Loader />`.
// Renders only a page-colored placeholder; visuals come from the overlay host.
const Loader = () => {
  const theme = useTheme();

  useEffect(() => {
    busShow();
    return () => busHide();
  }, []);

  return <div style={{ minHeight: '100vh', backgroundColor: theme.palette.bg }} />;
};

// Compact loader for in-card / in-list loading states
export function InlineLoader({ size = 64, variant }: { size?: number; variant?: 'dumbbell' | 'fox' }) {
  const [src] = useState(() =>
    variant === 'dumbbell' ? dumbbellLoader : variant === 'fox' ? foxLoader : pick(INLINE_LOADERS),
  );
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0' }}>
      <style>{`
        @keyframes inline-loader-pop {
          from { opacity: 0; transform: scale(0.92); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
      <img
        src={src}
        alt={t('common.loading')}
        style={{ width: size, height: size, animation: 'inline-loader-pop 0.3s ease' }}
      />
    </div>
  );
}

export default Loader;
