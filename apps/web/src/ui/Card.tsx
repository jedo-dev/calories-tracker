import React from 'react';
import { useTheme } from '../theme/useTheme';

interface CardProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
  onClick?: () => void;
}

export function Card({ children, style, onClick }: CardProps) {
  const theme = useTheme();

  return (
    <div
      onClick={onClick}
      style={{
        // backgroundColor: theme.palette.surface,
        // border: `1px solid ${theme.palette.border}`,
        borderRadius: theme.radius.md,
        padding: theme.spacing.md,
        boxShadow: theme.shadow.sm,
        cursor: onClick ? 'pointer' : 'default',
        ...style,
      }}
    >
      {children}
    </div>
  );
}
