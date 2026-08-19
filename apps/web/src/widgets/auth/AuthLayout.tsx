import React from 'react';
import { pageBackground } from '../../theme/styles';
import { useTheme } from '../../theme/useTheme';
import { Text } from '../../ui/Text';

interface AuthLayoutProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  /** Ссылки под формой («Нет аккаунта?» и т.п.) */
  footer?: React.ReactNode;
}

// Общий каркас auth-страниц (/login, /register, /forgot-password,
// /reset-password): фирменный градиент, логотип со свечением, плавное
// появление. Фокус инпутов, автофилл и анимации живут в <style> —
// инлайн-стили не умеют :focus и keyframes. !important нужен, чтобы
// перебить инлайновые стили общих ui/Input и ui/Button.
export function AuthLayout({ title, subtitle, children, footer }: AuthLayoutProps) {
  const theme = useTheme();

  return (
    <div
      style={{
        minHeight: '100dvh',
        background: pageBackground(theme.palette.bg),
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
        padding: theme.spacing.xl,
        paddingTop: `calc(${theme.spacing.xl} + env(safe-area-inset-top, 0px))`,
        paddingBottom: `calc(${theme.spacing.xl} + env(safe-area-inset-bottom, 0px))`,
      }}
    >
      <style>
        {`
        .auth-appear { animation: authAppear 0.45s ease-out both; }
        @keyframes authAppear {
          from { opacity: 0; transform: translateY(14px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .auth-logo { animation: authGlow 3.5s ease-in-out infinite; }
        @keyframes authGlow {
          0%, 100% { box-shadow: 0 0 34px rgba(83, 212, 107, 0.28); }
          50% { box-shadow: 0 0 54px rgba(83, 212, 107, 0.45); }
        }
        .auth-form input {
          background: rgba(3, 14, 22, 0.55) !important;
          border: 1px solid rgba(160, 200, 220, 0.22) !important;
          border-radius: 14px !important;
          padding: 13px 14px !important;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .auth-form input:focus {
          border-color: rgba(83, 212, 107, 0.65) !important;
          box-shadow: 0 0 0 3px rgba(83, 212, 107, 0.15);
        }
        .auth-form input:-webkit-autofill {
          -webkit-text-fill-color: ${theme.palette.text};
          -webkit-box-shadow: 0 0 0 1000px #0a1d2b inset;
          caret-color: ${theme.palette.text};
        }
        .auth-form button[type="submit"] {
          background: linear-gradient(180deg, #5FD973, #3EBE56) !important;
          border-radius: 14px !important;
          box-shadow: 0 10px 26px rgba(83, 212, 107, 0.22);
        }
        @media (prefers-reduced-motion: reduce) {
          .auth-appear, .auth-logo { animation: none; }
        }
        `}
      </style>

      <div className="auth-appear" style={{ maxWidth: '400px', margin: '0 auto', width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: theme.spacing.xl }}>
          <img
            src="/icon-192.png"
            alt=""
            width={72}
            height={72}
            className="auth-logo"
            style={{
              display: 'block',
              margin: `0 auto ${theme.spacing.md}`,
              borderRadius: '20px',
            }}
          />
          <Text variant="h1" style={{ display: 'block' }}>
            {title}
          </Text>
          {subtitle && (
            <Text muted style={{ display: 'block', marginTop: '6px', fontSize: '14px' }}>
              {subtitle}
            </Text>
          )}
        </div>

        <div className="auth-form">{children}</div>

        {footer}
      </div>
    </div>
  );
}
