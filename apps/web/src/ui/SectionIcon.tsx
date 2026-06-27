import React from 'react';

interface SectionIconProps {
  src: string;
  alt: string;
  size?: number;
  style?: React.CSSProperties;
}

export function SectionIcon({ src, alt, size = 24, style }: SectionIconProps) {
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      style={{
        width: `${size}px`,
        height: `${size}px`,
        objectFit: 'cover',
        flexShrink: 0,
        borderRadius: size >= 32 ? '10px' : '8px',
        ...style,
      }}
    />
  );
}
