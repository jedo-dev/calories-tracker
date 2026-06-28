import { useTheme } from '../../theme/useTheme';
import { Text } from '../../ui/Text';
import type { CSSProperties } from 'react';

interface ReportsPeriodNavigatorProps {
  label: string;
  onPrev: () => void;
  onNext: () => void;
  nextDisabled?: boolean;
}

function Chevron({ direction }: { direction: 'left' | 'right' }) {
  const d = direction === 'left'
    ? 'M16 6 L8 14 L16 22'
    : 'M8 6 L16 14 L8 22';

  return (
    <svg viewBox="0 0 24 24" width="12" height="12" aria-hidden="true" focusable="false">
      <path d={d} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ReportsPeriodNavigator({
  label,
  onPrev,
  onNext,
  nextDisabled = false,
}: ReportsPeriodNavigatorProps) {
  const theme = useTheme();

  const buttonStyle: CSSProperties = {
    width: '22px',
    height: '22px',
    borderRadius: '999px',
    border: '1px solid rgba(116, 160, 190, 0.20)',
    background: 'rgba(14, 37, 56, 0.72)',
    color: theme.palette.text,
    display: 'grid',
    placeItems: 'center',
    cursor: 'pointer',
    boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.03)',
  };

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '44px 1fr 44px',
        alignItems: 'center',
        gap: '12px',
      }}
    >
      <button
        type="button"
        onClick={onPrev}
        aria-label="Предыдущий период"
        style={buttonStyle}
      >
        <Chevron direction="left" />
      </button>
      <Text
        bold
        style={{
          textAlign: 'center',
          fontSize: '18px',
          letterSpacing: '-0.03em',
        }}
      >
        {label}
      </Text>
      <button
        type="button"
        onClick={onNext}
        disabled={nextDisabled}
        aria-label="Следующий период"
        style={{
          ...buttonStyle,
          opacity: nextDisabled ? 0.45 : 1,
          cursor: nextDisabled ? 'not-allowed' : 'pointer',
        }}
      >
        <Chevron direction="right" />
      </button>
    </div>
  );
}
