import { useTheme } from '../../theme/useTheme';
import { EmojiIcon } from '../../ui/Icon';
import { Text } from '../../ui/Text';
import { planCardStyle, MEAL_TITLE_EMOJI, PlanMeal } from './types';

interface PlanMealCardProps {
  meal: PlanMeal;
  onReplaceItem: (itemIndex: number) => void;
}

export function PlanMealCard({ meal, onReplaceItem }: PlanMealCardProps) {
  const theme = useTheme();

  return (
    <div style={{ ...planCardStyle, marginBottom: '10px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
        <div
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '12px',
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '17px',
            flexShrink: 0,
          }}
        >
          <EmojiIcon emoji={MEAL_TITLE_EMOJI[meal.mealType] || '🍽️'} size={20} />
        </div>
        <Text bold style={{ flex: 1, minWidth: 0, fontSize: '14px' }}>{meal.title}</Text>
        <span style={{ fontSize: '14px', fontWeight: 800, color: theme.palette.primary, whiteSpace: 'nowrap' }}>
          {Math.round(meal.totalKcal)} <span style={{ fontSize: '10px', color: theme.palette.textMuted, fontWeight: 600 }}>ккал</span>
        </span>
      </div>

      {meal.items.length === 0 ? (
        <Text variant="small" muted>Не удалось подобрать блюдо</Text>
      ) : (
        meal.items.map((item, itemIdx) => (
          <div
            key={itemIdx}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 0',
              borderTop: itemIdx > 0 ? '1px solid rgba(255,255,255,0.07)' : 'none',
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <Text style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '14px' }}>
                {item.name}
              </Text>
              <Text variant="small" muted style={{ display: 'block', fontSize: '11px', marginTop: '2px' }}>
                {item.grams}г · {Math.round(item.kcal)} ккал · Б{Math.round(item.protein)} Ж{Math.round(item.fat)} У{Math.round(item.carb)}
                {item.authorName ? ` · от ${item.authorName}` : ''}
              </Text>
            </div>
            <button
              type="button"
              onClick={() => onReplaceItem(itemIdx)}
              aria-label="Заменить блюдо"
              title="Заменить"
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '11px',
                border: '1px solid rgba(160, 200, 220, 0.24)',
                background: 'rgba(255,255,255,0.06)',
                color: theme.palette.text,
                fontSize: '14px',
                cursor: 'pointer',
                flexShrink: 0,
                fontFamily: 'inherit',
              }}
            >
              🔄
            </button>
          </div>
        ))
      )}
    </div>
  );
}
