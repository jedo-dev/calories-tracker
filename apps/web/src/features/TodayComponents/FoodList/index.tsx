import { useMemo } from 'react';
import emptyFood from '../../../assets/03_empty_states/empty_food.jpg';
import { t } from '../../../i18n';
import { useTheme } from '../../../theme/useTheme';
import { Card } from '../../../ui/Card';
import { EmptyState } from '../../../ui/EmptyState';
import { Text } from '../../../ui/Text';
import type { Entry } from '../../../pages/TodayPage';

const MEAL_ORDER = ['breakfast', 'lunch', 'dinner', 'snack', 'other'];

const MEAL_META: Record<string, { label: string; icon: string; color: string }> = {
  breakfast: { label: 'Завтрак', icon: '☀', color: '#F7C948' },
  lunch: { label: 'Обед', icon: '☀', color: '#FF9F1A' },
  dinner: { label: 'Ужин', icon: '☾', color: '#B77BFF' },
  snack: { label: 'Перекус', icon: '●', color: '#5CCBFF' },
  other: { label: 'Другие записи', icon: '•', color: '#94A3B8' },
};

export type MealGroup = {
  mealType: string;
  entries: Entry[];
  totalKcal: number;
};

interface Props {
  entries: Entry[];
  onMealClick: (group: MealGroup) => void;
}

const FoodList = ({ entries, onMealClick }: Props) => {
  const theme = useTheme();

  const groups = useMemo<MealGroup[]>(() => {
    const map = new Map<string, Entry[]>();

    for (const entry of entries) {
      const key = entry.mealType || 'other';
      const list = map.get(key) || [];
      list.push(entry);
      map.set(key, list);
    }

    return MEAL_ORDER.map((mealType) => {
      const mealEntries = map.get(mealType) || [];
      return {
        mealType,
        entries: mealEntries,
        totalKcal: mealEntries.reduce((sum, entry) => sum + entry.kcal, 0),
      };
    }).filter((group) => group.entries.length > 0);
  }, [entries]);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: theme.spacing.sm }}>
        <Text variant="h2" bold>
          Питание
        </Text>
        <Text variant="small" muted>
          {t('today.entriesCount', { count: entries.length })}
        </Text>
      </div>

      {entries.length === 0 ? (
        <EmptyState image={emptyFood} title={t('today.noEntries')} />
      ) : (
        <Card
          style={{
            padding: 0,
            overflow: 'hidden',
            borderRadius: '22px',
            background: 'linear-gradient(180deg, rgba(18, 52, 72, 0.9) 0%, rgba(9, 28, 42, 0.96) 100%)',
            border: '1px solid rgba(146, 188, 221, 0.14)',
          }}
        >
          {groups.map((group, index) => {
            const meta = MEAL_META[group.mealType] || MEAL_META.other;
            const summary = group.entries
              .slice(0, 3)
              .map((entry) => entry.productName)
              .join(', ');
            const moreCount = group.entries.length - 3;

            return (
              <button
                key={group.mealType}
                type="button"
                onClick={() => onMealClick(group)}
                style={{
                  width: '100%',
                  background: 'transparent',
                  border: 'none',
                  borderTop: index === 0 ? 'none' : `1px solid rgba(255,255,255,0.08)`,
                  padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                  color: theme.palette.text,
                  textAlign: 'left',
                  cursor: 'pointer',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm }}>
                  <div
                    style={{
                      width: '30px',
                      height: '30px',
                      borderRadius: '999px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: meta.color,
                      backgroundColor: 'rgba(255,255,255,0.04)',
                      fontSize: '17px',
                      flexShrink: 0,
                    }}
                  >
                    {meta.icon}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: theme.spacing.sm }}>
                      <Text variant="body" bold style={{ display: 'block', fontSize: '17px' }}>
                        {meta.label}
                      </Text>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', flexShrink: 0 }}>
                        <Text style={{ color: theme.palette.primary, fontSize: '17px', fontWeight: 700 }}>
                          {Math.round(group.totalKcal)}
                        </Text>
                        <Text variant="small" muted>
                          ккал
                        </Text>
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: theme.spacing.sm, marginTop: '3px' }}>
                      <Text variant="small" muted style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {summary}
                        {moreCount > 0 ? `, +${moreCount}` : ''}
                      </Text>
                      <Text variant="small" muted style={{ flexShrink: 0, fontSize: '18px', lineHeight: 1 }}>
                        ›
                      </Text>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </Card>
      )}
    </div>
  );
};

export default FoodList;
