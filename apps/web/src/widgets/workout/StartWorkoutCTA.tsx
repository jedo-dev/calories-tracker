interface StartWorkoutCTAProps {
  label: string;
  busy?: boolean;
  onClick: () => void;
}

export function StartWorkoutCTA({ label, busy, onClick }: StartWorkoutCTAProps) {
  return (
    <div
      style={{
        position: 'fixed',
        bottom: '64px',
        left: 0,
        right: 0,
        padding: '10px 12px 12px',
        maxWidth: '520px',
        margin: '0 auto',
        background: 'linear-gradient(180deg, transparent, rgba(7, 17, 29, 0.92) 40%)',
        zIndex: 5,
        boxSizing: 'border-box',
      }}
    >
      <button
        type="button"
        onClick={onClick}
        disabled={busy}
        style={{
          width: '100%',
          height: '52px',
          borderRadius: '18px',
          border: 'none',
          background: 'linear-gradient(180deg, rgba(83, 212, 107, 1), rgba(60, 170, 82, 1))',
          color: '#07210f',
          fontSize: '15px',
          fontWeight: 700,
          cursor: 'pointer',
          boxShadow: '0 18px 30px rgba(83, 212, 107, 0.24)',
          opacity: busy ? 0.6 : 1,
          fontFamily: 'inherit',
        }}
      >
        {label}
      </button>
    </div>
  );
}
