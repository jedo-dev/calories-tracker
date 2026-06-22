import React from 'react';
import { useTheme } from '../theme/useTheme';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'primaryReverse';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  children,
  style,
  disabled,
  ...props
}: ButtonProps) {
  const theme = useTheme();

  const variantStyles = {
    primary: {
      backgroundColor: theme.palette.primary,
      color: theme.palette.primaryText,
    },
    primaryReverse: {
      backgroundColor: theme.palette.primaryText,
      color: theme.palette.primary,
    },
    secondary: {
      backgroundColor: theme.palette.secondary,
      color: theme.palette.secondaryText,
      border: `1px solid ${theme.palette.border}`,
    },
    danger: {
      backgroundColor: theme.palette.danger,
      color: theme.palette.dangerText,
    },
    ghost: {
      backgroundColor: 'transparent',
      color: theme.palette.text,
      border: `1px solid ${theme.palette.border}`,
    }
  };

  const sizeStyles = {
    sm: {
      padding: `${theme.spacing.sm} ${theme.spacing.md}`,
      fontSize: theme.typography.small.fontSize,
    },
    md: {
      padding: `${theme.spacing.md} ${theme.spacing.lg}`,
      fontSize: theme.typography.body.fontSize,
    },
    lg: {
      padding: `${theme.spacing.lg} ${theme.spacing.xl}`,
      fontSize: theme.typography.h2.fontSize,
    },
  };

  return (
    <button
      {...props}
      disabled={disabled}
      style={{
        ...variantStyles[variant],
        ...sizeStyles[size],
        borderRadius: theme.radius.md,
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontWeight: '600',
        transition: 'opacity 0.2s',
        opacity: disabled ? 0.5 : 1,
        width: '100%',
        letterSpacing: '0.02em',
        ...style,
      }}
    >
      {children}
    </button>
  );
}
