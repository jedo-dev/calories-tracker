import { useTheme } from '../theme/useTheme';

export function BurgerMenu({ onClick, isOpen = false }: { onClick: (boolean: boolean) => void, isOpen: boolean }) {
  const theme = useTheme();

  return (
    <div
      onClick={() => onClick(!isOpen)}
      style={{
        position: 'absolute',
        right: '15px',
        display: 'flex',
        flexDirection: 'column',
        gap: '3px',
        cursor: 'pointer',
        padding: '8px',
        width: '44px',
        height: '34px',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          width: '100%',
          height: '3px',
          backgroundColor: theme.palette.primary,
          transition: 'all 0.3s ease',
        }}
      />
      <div
        style={{
          width: '100%',
          height: '3px',
          backgroundColor: theme.palette.primary,
          transition: 'all 0.3s ease',
        }}
      />
      <div
        style={{
          width: '100%',
          height: '3px',
          backgroundColor: theme.palette.primary,
          transition: 'all 0.3s ease',
        }}
      />
    </div>
  );
}
