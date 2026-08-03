import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type MealTemplateDocument = MealTemplate & Document;

@Schema({ timestamps: true })
export class MealTemplate {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop({ enum: ['breakfast', 'lunch', 'dinner', 'snack', 'other'], default: 'other' })
  mealType: string;

  @Prop({
    type: [{
      productId: { type: Types.ObjectId, ref: 'Product' },
      productName: String,
      grams: Number,
      kcal: Number,
      kcalPer100g: Number,
    }],
    default: [],
  })
  items: {
    productId?: Types.ObjectId;
    productName: string;
    grams: number;
    kcal: number;
    kcalPer100g?: number;
  }[];

  @Prop({ default: 0 })
  totalKcal: number;
}

export const MealTemplateSchema = SchemaFactory.createForClass(MealTemplate);
