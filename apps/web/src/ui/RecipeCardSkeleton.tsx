const shimmerBlock = (width: string, height: string, radius = '8px'): React.CSSProperties => ({
  width,
  height,
  borderRadius: radius,
  background: 'linear-gradient(90deg, rgba(255,255,255,0.06) 25%, rgba(255,255,255,0.12) 50%, rgba(255,255,255,0.06) 75%)',
  backgroundSize: '200% 100%',
  animation: 'recipe-skeleton-shimmer 1.4s ease-in-out infinite',
});

export function RecipeCardSkeleton() {
  return (
    <div
      style={{
        borderRadius: '22px',
        background: 'linear-gradient(180deg, rgba(17, 49, 69, 0.96), rgba(10, 32, 46, 0.96))',
        border: '1px solid rgba(160, 200, 220, 0.18)',
        boxShadow: '0 22px 44px rgba(0, 0, 0, 0.28)',
        padding: '14px',
      }}
    >
      <style>{`
        @keyframes recipe-skeleton-shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
      <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
        <div style={shimmerBlock('64px', '64px', '14px')} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={shimmerBlock('60%', '16px')} />
          <div style={shimmerBlock('85%', '12px')} />
          <div style={shimmerBlock('40%', '12px')} />
        </div>
      </div>
    </div>
  );
}
