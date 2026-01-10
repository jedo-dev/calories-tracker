import React from 'react';
import { useTheme } from '../theme/useTheme';

interface TextProps {
  variant?: 'h1' | 'h2' | 'body' | 'small';
  muted?: boolean;
  bold?: boolean;
  children: React.ReactNode;
  style?: React.CSSProperties;
}

export function Text({ variant = 'body', muted = false, bold = false, children, style }: TextProps) {
  const theme = useTheme();

  const variantStyles = {
    h1: theme.typography.h1,
    h2: theme.typography.h2,
    body: theme.typography.body,
    small: theme.typography.small,
  };

  return (
    <span
      style={{
        ...variantStyles[variant],
        color: muted ? theme.palette.textMuted : theme.palette.text,
        fontWeight: bold ? '600' : variantStyles[variant].fontWeight,
        ...style,
      }}
    >
      {children}
    </span>
  );
}
