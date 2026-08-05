import type { CSSProperties } from 'react';
import { avatarImage } from './avatarCatalog';

interface AvatarProps {
  emoji?: string | null;
  size: number;
  borderColor?: string;
  borderWidth?: number;
  style?: CSSProperties;
}

export function Avatar({ emoji, size, borderColor, borderWidth = 0, style }: AvatarProps) {
  const image = avatarImage(emoji);

  return (
    <div
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: '50%',
        border: borderWidth && borderColor ? `${borderWidth}px solid ${borderColor}` : 'none',
        background: 'linear-gradient(180deg, rgba(83,212,107,0.12), rgba(83,212,107,0.04))',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: `${Math.round(size * 0.5)}px`,
        flexShrink: 0,
        overflow: 'hidden',
        ...style,
      }}
    >
      {image ? (
        <img
          src={image}
          alt=""
          style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
        />
      ) : (
        emoji || '🦊'
      )}
    </div>
  );
}
