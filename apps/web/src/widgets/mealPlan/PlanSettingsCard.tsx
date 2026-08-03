import { useTheme } from '../../theme/useTheme';
import { Text } from '../../ui/Text';
import { planCardStyle } from './types';

interface PlanSettingsCardProps {
  mode: 'day' | 'week';
  mealCount: number;
  includePublic: boolean;
  considerEaten: boolean;
  preferQuick: boolean;
  excludedTags: string;
  onChange: (patch: {
    mode?: 'day' | 'week';
    mealCount?: number;
    includePublic?: boolean;
    considerEaten?: boolean;
    preferQuick?: boolean;
    excludedTags?: string;
  }) => void;
}

export function PlanSettingsCard(props: PlanSettingsCardProps) {
  const theme = useTheme();
  const { mode, mealCount, includePublic, considerEaten, preferQuick, excludedTags, onChange } = props;

  const chip = (active: boolean): React.CSSProperties => ({
    flex: 1,
    padding: '10px 12px',
    borderRadius: '13px',
    border: `1px solid ${active ? theme.palette.primary : 'rgba(255,255,255,0.12)'}`,
    background: active
      ? `linear-gradient(180deg, ${theme.palette.primary}33, ${theme.palette.primary}1f)`
      : 'rgba(255,255,255,0.06)',
    color: active ? theme.palette.primary : theme.palette.textMuted,
    fontSize: '13px',
    fontWeight: 700,
    cursor: 'pointer',
    fontFamily: 'inherit',
  });

  const toggle = (label: string, checked: boolean, onToggle: (v: boolean) => void) => (
    <button
      type="button"
      onClick={() => onToggle(!checked)}
      aria-pressed={checked}
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
        background: 'none',
        border: 'none',
        padding: '9px 0',
        cursor: 'pointer',
        color: theme.palette.text,
        fontFamily: 'inherit',
      }}
    >
      <Text variant="small">{label}</Text>
      <span
        style={{
          width: '42px',
          height: '24px',
          borderRadius: '12px',
          background: checked
            ? 'linear-gradient(180deg, rgba(83, 212, 107, 1), rgba(60, 170, 82, 1))'
            : 'rgba(255,255,255,0.12)',
          position: 'relative',
          transition: 'background 0.2s',
          flexShrink: 0,
        }}
      >
        <span
          style={{
            position: 'absolute',
            top: '3px',
            left: checked ? '21px' : '3px',
            width: '18px',
            height: '18px',
            borderRadius: '50%',
            background: '#fff',
            transition: 'left 0.2s',
            boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
          }}
        />
      </span>
    </button>
  );

  return (
    <>
      <div style={planCardStyle}>
        <Text bold style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>Режим</Text>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button type="button" onClick={() => onChange({ mode: 'day' })} style={chip(mode === 'day')}>
            📅 Сегодня
          </button>
          <button type="button" onClick={() => onChange({ mode: 'week' })} style={chip(mode === 'week')}>
            🗓️ Неделя
          </button>
        </div>
      </div>

      <div style={planCardStyle}>
        <Text bold style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>Настройки</Text>

        <Text variant="small" muted style={{ display: 'block', marginBottom: '6px', fontSize: '11px' }}>
          Приёмов пищи
        </Text>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
          {[3, 4, 5].map((n) => (
            <button key={n} type="button" onClick={() => onChange({ mealCount: n })} style={chip(mealCount === n)}>
              {n}
            </button>
          ))}
        </div>

        {toggle('Публичные рецепты', includePublic, (v) => onChange({ includePublic: v }))}
        {mode === 'day' && toggle('Учитывать съеденное', considerEaten, (v) => onChange({ considerEaten: v }))}
        {toggle('Быстрые блюда', preferQuick, (v) => onChange({ preferQuick: v }))}

        <Text variant="small" muted style={{ display: 'block', margin: '8px 0 6px', fontSize: '11px' }}>
          Исключить теги (через запятую)
        </Text>
        <input
          placeholder="сладкое, фастфуд"
          value={excludedTags}
          onChange={(e) => onChange({ excludedTags: e.target.value })}
          style={{
            width: '100%',
            boxSizing: 'border-box',
            height: '42px',
            padding: '0 12px',
            borderRadius: '13px',
            border: '1px solid rgba(160, 200, 220, 0.18)',
            background: 'rgba(255, 255, 255, 0.06)',
            color: theme.palette.text,
            fontSize: '14px',
            outline: 'none',
            fontFamily: 'inherit',
          }}
        />
      </div>
    </>
  );
}
