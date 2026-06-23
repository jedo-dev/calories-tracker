import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type RecipeDocument = Recipe & Document;

export type CalculationMode = 'manual' | 'ingredients' | 'mixed';
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'other';

export class Ingredient {
  @Prop({ type: Types.ObjectId, ref: 'Product' })
  productId?: Types.ObjectId;

  @Prop({ required: true })
  productName: string;

  @Prop({ required: true })
  grams: number;

  @Prop({ required: true })
  kcalPer100g: number;

  @Prop({ default: 0 })
  proteinPer100g: number;

  @Prop({ default: 0 })
  fatPer100g: number;

  @Prop({ default: 0 })
  carbPer100g: number;

  @Prop({ required: true })
  kcal: number;

  @Prop({ default: 0 })
  protein: number;

  @Prop({ default: 0 })
  fat: number;

  @Prop({ default: 0 })
  carb: number;
}

@Schema({ timestamps: true })
export class Recipe {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true, lowercase: true })
  nameNormalized: string;

  @Prop()
  description?: string;

  @Prop()
  photoUrl?: string;

  @Prop({ type: [String], default: [] })
  mealTypes: MealType[];

  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop()
  servingName?: string;

  @Prop()
  servingGrams?: number;

  @Prop({ required: true })
  totalCookedWeightG: number;

  @Prop({ required: true, enum: ['manual', 'ingredients', 'mixed'] })
  calculationMode: CalculationMode;

  @Prop({ type: [Object], default: [] })
  ingredients: Ingredient[];

  @Prop({ required: true })
  kcalPer100g: number;

  @Prop({ default: 0 })
  proteinPer100g: number;

  @Prop({ default: 0 })
  fatPer100g: number;

  @Prop({ default: 0 })
  carbPer100g: number;

  @Prop({ required: true })
  totalKcal: number;

  @Prop({ default: 0 })
  totalProtein: number;

  @Prop({ default: 0 })
  totalFat: number;

  @Prop({ default: 0 })
  totalCarb: number;

  @Prop({ type: Types.ObjectId, ref: 'Product' })
  linkedProductId?: Types.ObjectId;

  @Prop({ default: false })
  isArchived: boolean;
}

export const RecipeSchema = SchemaFactory.createForClass(Recipe);

RecipeSchema.index({ userId: 1, isArchived: 1 });
RecipeSchema.index({ nameNormalized: 1 });
