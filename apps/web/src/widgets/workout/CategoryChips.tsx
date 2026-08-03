import { useTheme } from '../../theme/useTheme';
import type { WorkoutCategory } from './types';

interface CategoryChipsProps {
  categories: WorkoutCategory[];
  activeCategoryId: string | null;
  onSelect: (categoryId: string | null) => void;
}

export function CategoryChips({ categories, activeCategoryId, onSelect }: CategoryChipsProps) {
  const theme = useTheme();

  const chipStyle = (active: boolean): React.CSSProperties => ({
    padding: '8px 12px',
    borderRadius: '12px',
    border: `1px solid ${active ? theme.palette.primary : 'rgba(255,255,255,0.12)'}`,
    background: active
      ? `linear-gradient(180deg, ${theme.palette.primary}33, ${theme.palette.primary}1f)`
      : 'rgba(255,255,255,0.06)',
    color: active ? theme.palette.primary : theme.palette.textMuted,
    fontSize: '12px',
    fontWeight: 700,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    flexShrink: 0,
    fontFamily: 'inherit',
  });

  return (
    <div
      style={{
        display: 'flex',
        gap: '8px',
        overflowX: 'auto',
        paddingBottom: '4px',
        marginBottom: '12px',
        scrollbarWidth: 'none',
      }}
    >
      <button type="button" onClick={() => onSelect(null)} style={chipStyle(activeCategoryId === null)}>
        Все
      </button>
      {categories.map((cat) => (
        <button key={cat._id} type="button" onClick={() => onSelect(cat._id)} style={chipStyle(activeCategoryId === cat._id)}>
          {cat.emoji} {cat.name}
        </button>
      ))}
    </div>
  );
}
