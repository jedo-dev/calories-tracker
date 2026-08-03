import { useTheme } from '../../theme/useTheme';
import { Text } from '../../ui/Text';
import { measurementCardStyle, MEASUREMENT_ROWS, Measurement } from './shared';

interface CurrentMeasurementsCardProps {
  latest?: Measurement;
  previous?: Measurement;
}

export function CurrentMeasurementsCard({ latest, previous }: CurrentMeasurementsCardProps) {
  const theme = useTheme();

  return (
    <div style={{ ...measurementCardStyle, padding: '6px 14px' }}>
      {MEASUREMENT_ROWS.map((row, index) => {
        const current = latest?.[row.key];
        const prev = previous?.[row.key];
        const delta =
          typeof current === 'number' && typeof prev === 'number' ? current - prev : null;
        // for body measurements a decrease is usually the goal — show it green
        const deltaColor =
          delta === null || Math.abs(delta) < 0.05
            ? theme.palette.textMuted
            : delta < 0
              ? theme.palette.primary
              : '#ffc457';

        return (
          <div
            key={row.key}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '11px 0',
              borderTop: index === 0 ? 'none' : '1px solid rgba(255,255,255,0.07)',
            }}
          >
            <div
              style={{
                width: '52px',
                height: '52px',
                borderRadius: '15px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(83, 212, 107, 0.08)',
                border: '1px solid rgba(83, 212, 107, 0.35)',
                color: '#89ee7f',
                overflow: 'hidden',
                flexShrink: 0,
              }}
            >
              {row.icon}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <Text bold style={{ display: 'block', fontSize: '14px' }}>{row.label}</Text>
              {typeof prev === 'number' && (
                <Text variant="small" muted style={{ display: 'block', fontSize: '11px', marginTop: '2px' }}>
                  Прошлый: {prev.toFixed(1)} {row.unit}
                </Text>
              )}
            </div>

            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <span style={{ fontSize: '20px', fontWeight: 800, color: theme.palette.text, whiteSpace: 'nowrap' }}>
                {typeof current === 'number' ? current.toFixed(1) : '—'}{' '}
                <span style={{ fontSize: '11px', color: theme.palette.textMuted, fontWeight: 600 }}>{row.unit}</span>
              </span>
              {delta !== null && Math.abs(delta) >= 0.05 && (
                <span
                  style={{
                    display: 'block',
                    fontSize: '11px',
                    fontWeight: 800,
                    color: deltaColor,
                    marginTop: '2px',
                  }}
                >
                  {delta > 0 ? '↑' : '↓'} {Math.abs(delta).toFixed(1)} {row.unit}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
