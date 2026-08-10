import { glassCardStyle } from '../../theme/styles';
export interface PlanItem {
  sourceType: 'recipe' | 'product';
  sourceId: string;
  name: string;
  grams: number;
  kcal: number;
  protein: number;
  fat: number;
  carb: number;
  photoUrl?: string;
  authorName?: string;
}

export interface PlanMeal {
  mealType: string;
  title: string;
  items: PlanItem[];
  totalKcal: number;
  totalProtein: number;
  totalFat: number;
  totalCarb: number;
}

export interface PlanDay {
  date: string;
  meals: PlanMeal[];
  totalKcal: number;
  totalProtein: number;
  totalFat: number;
  totalCarb: number;
}

export interface MealPlan {
  _id: string;
  dateFrom: string;
  dateTo: string;
  mode: 'day' | 'week';
  status: 'draft' | 'applied' | 'archived';
  title?: string;
  settings: {
    kcalTarget: number;
    proteinTargetG: number;
    fatTargetG: number;
    carbTargetG: number;
    mealCount: number;
    includePublicRecipes: boolean;
    preferQuick: boolean;
    excludedTags: string[];
    excludedProductNames: string[];
    goal: string;
    considerEaten: boolean;
  };
  days: PlanDay[];
  score: number;
  explanation: string[];
}

export const planCardStyle: React.CSSProperties = { ...glassCardStyle, marginBottom: '12px' };

export const formatDateRu = (dateStr: string): string => {
  const months = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
  const days = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
  const d = new Date(dateStr + 'T00:00:00Z');
  return `${days[d.getUTCDay()]}, ${d.getUTCDate()} ${months[d.getUTCMonth()]}`;
};

export const MEAL_TITLE_EMOJI: Record<string, string> = {
  breakfast: '🍳',
  lunch: '🍲',
  dinner: '🌙',
  snack: '🍎',
  other: '🍽️',
};
