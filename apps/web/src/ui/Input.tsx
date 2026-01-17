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
        backgroundColor: theme.palette.white,
        color: theme.palette.blue,
        border: `1px solid ${theme.palette.border}`,
        borderRadius: theme.radius.sm,
        boxSizing: 'border-box',
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
            color: theme.palette.blue,
            fontSize: theme.typography.body.fontSize,
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
