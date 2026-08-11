export interface RecipeIngredient {
  productId?: string;
  productName: string;
  grams: number;
  kcalPer100g: number;
  proteinPer100g: number;
  fatPer100g: number;
  carbPer100g: number;
  kcal: number;
  protein: number;
  fat: number;
  carb: number;
}

export interface Recipe {
  _id: string;
  userId: string;
  name: string;
  description?: string;
  photoUrl?: string;
  mealTypes: string[];
  tags: string[];
  servingName?: string;
  servingGrams?: number;
  totalCookedWeightG: number;
  calculationMode: string;
  ingredients: RecipeIngredient[];
  kcalPer100g: number;
  proteinPer100g: number;
  fatPer100g: number;
  carbPer100g: number;
  totalKcal: number;
  totalProtein: number;
  totalFat: number;
  totalCarb: number;
  isArchived: boolean;
  linkedProductId?: string;
  visibility?: string;
  publishedAt?: string;
  forkCount?: number;
  likesCount?: number;
  authorSnapshot?: {
    userId: string;
    username?: string;
    displayName?: string;
    avatarEmoji?: string;
  };
  createdAt: string;
  updatedAt: string;
}
