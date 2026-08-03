import { useState } from 'react';

export function Thumb({ src, alt, size, radius = 12 }: { src?: string; alt: string; size: number; radius?: number }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return (
      <div
        style={{
          width: size,
          height: size,
          borderRadius: `${radius}px`,
          background: 'rgba(255,255,255,0.06)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: size / 2.5,
          flexShrink: 0,
        }}
      >
        💪
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      onError={() => setFailed(true)}
      style={{
        width: size,
        height: size,
        objectFit: 'cover',
        borderRadius: `${radius}px`,
        flexShrink: 0,
        border: '1px solid rgba(255,255,255,0.08)',
      }}
    />
  );
}
