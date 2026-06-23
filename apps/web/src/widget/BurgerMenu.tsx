import { useTheme } from '../theme/useTheme';

export function BurgerMenu({ onClick, isOpen = false }: { onClick: (boolean: boolean) => void, isOpen: boolean }) {
  const theme = useTheme();

  return (
    <button
      onClick={() => onClick(!isOpen)}
      aria-label={isOpen ? 'Закрыть меню' : 'Открыть меню'}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '3px',
        cursor: 'pointer',
        padding: '10px',
        width: '44px',
        height: '44px',
        justifyContent: 'center',
        alignItems: 'center',
        background: 'none',
        border: 'none',
        outline: 'none',
      }}
    >
      <div style={{ width: '100%', height: '3px', backgroundColor: theme.palette.primary, transition: 'all 0.3s ease' }} />
      <div style={{ width: '100%', height: '3px', backgroundColor: theme.palette.primary, transition: 'all 0.3s ease' }} />
      <div style={{ width: '100%', height: '3px', backgroundColor: theme.palette.primary, transition: 'all 0.3s ease' }} />
    </button>
  );
}
