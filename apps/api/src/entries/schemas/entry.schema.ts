import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type EntryDocument = Entry & Document;

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'other';

@Schema({ timestamps: true })
export class Entry {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ required: true, index: true })
  date: string; // YYYY-MM-DD

  @Prop()
  time?: string; // HH:mm

  @Prop({
    type: String,
    enum: ['breakfast', 'lunch', 'dinner', 'snack', 'other'],
    default: 'other',
  })
  mealType: MealType;

  @Prop({ type: Types.ObjectId, ref: 'Product' })
  productId?: Types.ObjectId;

  @Prop({ required: true })
  productName: string;

  @Prop({ required: true, min: 0.01 })
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

  @Prop({ required: true })
  protein: number;

  @Prop({ required: true })
  fat: number;

  @Prop({ required: true })
  carb: number;
}

export const EntrySchema = SchemaFactory.createForClass(Entry);

EntrySchema.index({ userId: 1, date: 1, createdAt: 1 });
EntrySchema.index({ userId: 1, date: 1, mealType: 1 });

