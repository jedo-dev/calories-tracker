export const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack', 'other'] as const;
export type MealType = (typeof MEAL_TYPES)[number];

export const MEAL_TYPE_EMOJI: Record<MealType, string> = {
  breakfast: '🍳',
  lunch: '🍲',
  dinner: '🌙',
  snack: '🍎',
  other: '🍽️',
};
