import React from 'react';
import { useTheme } from '../theme/useTheme';

const TOOLTIP_CSS = `
.icon-btn { position: relative; }
.icon-btn .icon-btn-tip {
  position: absolute;
  bottom: calc(100% + 6px);
  left: 50%;
  transform: translateX(-50%);
  background: rgba(3, 18, 28, 0.95);
  color: #fff;
  font-size: 11px;
  font-weight: 600;
  padding: 4px 8px;
  border-radius: 8px;
  border: 1px solid rgba(160, 200, 220, 0.25);
  white-space: nowrap;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.15s;
  z-index: 20;
}
.icon-btn:hover .icon-btn-tip { opacity: 1; }
`;

let stylesInjected = false;
function ensureStyles() {
  if (stylesInjected || typeof document === 'undefined') return;
  const style = document.createElement('style');
  style.textContent = TOOLTIP_CSS;
  document.head.appendChild(style);
  stylesInjected = true;
}

interface IconButtonProps {
  label: string;
  onClick: (e: React.MouseEvent) => void;
  children: React.ReactNode;
  danger?: boolean;
  active?: boolean;
  size?: number;
}

// 36x36 rounded icon button in the profile-card style, with a hover tooltip
// (and aria-label/title for accessibility and touch devices).
export function IconButton({ label, onClick, children, danger, active, size = 36 }: IconButtonProps) {
  const theme = useTheme();
  ensureStyles();

  const color = danger ? '#ff8a8a' : active ? theme.palette.primary : theme.palette.text;

  return (
    <button
      type="button"
      className="icon-btn"
      aria-label={label}
      title={label}
      onClick={onClick}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: '12px',
        border: `1px solid ${danger ? 'rgba(255,120,120,0.3)' : active ? theme.palette.primary + '66' : 'rgba(255,255,255,0.12)'}`,
        background: active ? theme.palette.primary + '1f' : 'rgba(255,255,255,0.06)',
        color,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        padding: 0,
      }}
    >
      {children}
      <span className="icon-btn-tip">{label}</span>
    </button>
  );
}
