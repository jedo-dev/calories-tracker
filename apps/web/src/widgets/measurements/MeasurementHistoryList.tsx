import { useTheme } from '../../theme/useTheme';
import { Text } from '../../ui/Text';
import { measurementCardStyle, formatDateRu, MEASUREMENT_ROWS, Measurement } from './shared';

interface MeasurementHistoryListProps {
  entries: Measurement[];
  onDelete: (entry: Measurement) => void;
}

export function MeasurementHistoryList({ entries, onDelete }: MeasurementHistoryListProps) {
  const theme = useTheme();

  if (entries.length === 0) {
    return (
      <div style={{ ...measurementCardStyle, textAlign: 'center', padding: '24px' }}>
        <Text muted>История замеров появится после первого сохранения</Text>
      </div>
    );
  }

  return (
    <>
      {entries.map((entry) => (
        <div key={entry._id} style={{ ...measurementCardStyle, marginBottom: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <Text bold style={{ fontSize: '14px' }}>📅 {formatDateRu(entry.date)}</Text>
            <button
              type="button"
              onClick={() => onDelete(entry)}
              aria-label="Удалить запись"
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '11px',
                border: '1px solid rgba(255,110,110,0.35)',
                background: 'rgba(255,110,110,0.08)',
                color: '#ff8a8a',
                fontSize: '14px',
                cursor: 'pointer',
                flexShrink: 0,
                fontFamily: 'inherit',
              }}
            >
              ✕
            </button>
          </div>

          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {MEASUREMENT_ROWS.map((row) => {
              const value = entry[row.key];
              if (typeof value !== 'number') return null;
              return (
                <span
                  key={row.key}
                  style={{
                    fontSize: '11px',
                    padding: '5px 10px',
                    borderRadius: '11px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.09)',
                    color: theme.palette.text,
                    fontWeight: 600,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {row.label}: <span style={{ fontWeight: 800 }}>{value.toFixed(1)}</span> {row.unit}
                </span>
              );
            })}
          </div>
        </div>
      ))}
    </>
  );
}
