import React from 'react';
import { useTheme } from '../theme/useTheme';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export function Input({ label, style, ...props }: InputProps) {
  const theme = useTheme();

  const inputElement = (
    <input
      {...props}
      style={{
        width: '100%',
        padding: theme.spacing.sm,
        fontSize: theme.typography.body.fontSize,
        backgroundColor: theme.palette.bg,
        color: theme.palette.text,
        border: `1px solid ${theme.palette.border}`,
        borderRadius: theme.radius.sm,
        boxSizing: 'border-box',
        outline: 'none',
        ...style,
      }}
    />
  );

  if (label) {
    return (
      <div>
        <label
          style={{
            display: 'block',
            marginBottom: theme.spacing.xs,
            fontWeight: '600',
            color: theme.palette.text,
            fontSize: theme.typography.small.fontSize,
          }}
        >
          {label}
        </label>
        {inputElement}
      </div>
    );
  }

  return inputElement;
}
