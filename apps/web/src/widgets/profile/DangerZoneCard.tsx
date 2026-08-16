import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../../api/client';
import { t } from '../../i18n';
import { useTheme } from '../../theme/useTheme';
import { glassCardStyle } from '../../theme/styles';

// «Опасная зона» в профиле: полное удаление аккаунта с подтверждением паролем.
// Свернута по умолчанию — случайно не нажать.
export function DangerZoneCard() {
  const theme = useTheme();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const remove = async () => {
    if (busy || !password) return;
    if (!window.confirm(t('danger.confirm'))) return;
    setBusy(true);
    setError(null);
    try {
      await apiClient.delete('/users/me', { data: { password } });
      localStorage.removeItem('token');
      navigate('/register');
      window.location.reload();
    } catch (err: any) {
      setError(err.response?.data?.message || t('danger.failed'));
      setBusy(false);
    }
  };

  return (
    <div
      style={{
        ...glassCardStyle,
        marginTop: theme.spacing.md,
        border: '1px solid rgba(255, 138, 138, 0.25)',
      }}
    >
      <button
        type="button"
        onClick={() => setOpen(!open)}
        style={{
          background: 'transparent',
          border: 'none',
          color: '#ff8a8a',
          fontSize: '14px',
          fontWeight: 700,
          cursor: 'pointer',
          padding: 0,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          width: '100%',
        }}
      >
        <span>🗑</span> {t('danger.title')}
        <span style={{ marginLeft: 'auto', color: theme.palette.textMuted }}>{open ? '▴' : '▾'}</span>
      </button>

      {open && (
        <div style={{ marginTop: '12px' }}>
          <div style={{ fontSize: '13px', color: theme.palette.textMuted, marginBottom: '10px' }}>
            {t('danger.desc')}
          </div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t('danger.passwordPlaceholder')}
            autoComplete="current-password"
            style={{
              width: '100%',
              boxSizing: 'border-box',
              background: 'rgba(160, 200, 220, 0.1)',
              border: '1px solid rgba(160, 200, 220, 0.3)',
              borderRadius: '12px',
              color: theme.palette.text,
              padding: '11px 13px',
              fontSize: '14px',
              outline: 'none',
              marginBottom: '10px',
            }}
          />
          {error && (
            <div style={{ fontSize: '13px', color: '#ff8a8a', marginBottom: '10px' }}>{error}</div>
          )}
          <button
            type="button"
            onClick={remove}
            disabled={busy || !password}
            style={{
              width: '100%',
              background: 'rgba(255, 82, 82, 0.16)',
              border: '1px solid rgba(255, 82, 82, 0.5)',
              color: '#ff8a8a',
              borderRadius: '12px',
              padding: '12px',
              fontSize: '14px',
              fontWeight: 800,
              cursor: 'pointer',
              opacity: busy || !password ? 0.5 : 1,
            }}
          >
            {t('danger.delete')}
          </button>
        </div>
      )}
    </div>
  );
}
