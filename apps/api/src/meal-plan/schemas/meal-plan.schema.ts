import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type MealPlanDocument = MealPlan & Document;

export type MealPlanMode = 'day' | 'week';
export type MealPlanStatus = 'draft' | 'applied' | 'archived';
export type SourceType = 'recipe' | 'product';

export class PlanItem {
  @Prop({ required: true, enum: ['recipe', 'product'] })
  sourceType: SourceType;

  @Prop({ type: Types.ObjectId })
  sourceId?: Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  grams: number;

  @Prop({ required: true })
  kcal: number;

  @Prop({ default: 0 })
  protein: number;

  @Prop({ default: 0 })
  fat: number;

  @Prop({ default: 0 })
  carb: number;

  @Prop()
  photoUrl?: string;

  @Prop()
  authorName?: string;
}

export class PlanMeal {
  @Prop({ required: true })
  mealType: string;

  @Prop({ required: true })
  title: string;

  @Prop({ type: [PlanItem], default: [] })
  items: PlanItem[];

  @Prop({ default: 0 })
  totalKcal: number;

  @Prop({ default: 0 })
  totalProtein: number;

  @Prop({ default: 0 })
  totalFat: number;

  @Prop({ default: 0 })
  totalCarb: number;
}

export class PlanDay {
  @Prop({ required: true })
  date: string;

  @Prop({ type: [PlanMeal], default: [] })
  meals: PlanMeal[];

  @Prop({ default: 0 })
  totalKcal: number;

  @Prop({ default: 0 })
  totalProtein: number;

  @Prop({ default: 0 })
  totalFat: number;

  @Prop({ default: 0 })
  totalCarb: number;
}

export class PlanSettings {
  @Prop({ default: 0 })
  kcalTarget: number;

  @Prop({ default: 0 })
  proteinTargetG: number;

  @Prop({ default: 0 })
  fatTargetG: number;

  @Prop({ default: 0 })
  carbTargetG: number;

  @Prop({ default: 3 })
  mealCount: number;

  @Prop({ default: true })
  includePublicRecipes: boolean;

  @Prop({ default: false })
  preferQuick: boolean;

  @Prop({ type: [String], default: [] })
  excludedTags: string[];

  @Prop({ type: [String], default: [] })
  excludedProductNames: string[];

  @Prop({ default: 'maintain' })
  goal: string;

  @Prop({ default: false })
  considerEaten: boolean;
}

@Schema({ timestamps: true })
export class MealPlan {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  dateFrom: string;

  @Prop({ required: true })
  dateTo: string;

  @Prop({ required: true, enum: ['day', 'week'] })
  mode: MealPlanMode;

  @Prop({ required: true, enum: ['draft', 'applied', 'archived'], default: 'draft' })
  status: MealPlanStatus;

  @Prop()
  title?: string;

  @Prop({ type: PlanSettings, required: true })
  settings: PlanSettings;

  @Prop({ type: [PlanDay], default: [] })
  days: PlanDay[];

  @Prop({ default: 0 })
  score: number;

  @Prop({ type: [String], default: [] })
  explanation: string[];
}

export const MealPlanSchema = SchemaFactory.createForClass(MealPlan);

MealPlanSchema.index({ userId: 1, createdAt: -1 });
MealPlanSchema.index({ userId: 1, dateFrom: 1, dateTo: 1 });
