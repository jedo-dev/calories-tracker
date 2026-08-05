import { useEffect, useState } from 'react';
import mascotFoxDumbbell from '../../assets/08_mascot/mascot_fox_dumbbell.png';

export function Thumb({ src, alt, size, radius = 12 }: { src?: string; alt: string; size: number; radius?: number }) {
  const [failed, setFailed] = useState(false);

  // a new src (e.g. freshly uploaded photo) must clear the previous load failure
  useEffect(() => {
    setFailed(false);
  }, [src]);
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
          flexShrink: 0,
        }}
      >
        <img
          src={mascotFoxDumbbell}
          alt={alt}
          style={{ width: '82%', height: '82%', objectFit: 'contain' }}
        />
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
