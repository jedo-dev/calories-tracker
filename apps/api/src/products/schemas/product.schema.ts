import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ProductDocument = Product & Document;

export type ProductSource = 'OFF' | 'USER' | 'CUSTOM_SEED' | 'BARCODE' | 'RECIPE';

@Schema({ timestamps: true })
export class Product {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, lowercase: true })
  nameNormalized: string;

  @Prop()
  brand?: string;

  @Prop({ sparse: true, unique: true })
  barcode?: string;

  @Prop({ required: true })
  kcalPer100g: number;

  @Prop({ default: 0 })
  proteinPer100g: number;

  @Prop({ default: 0 })
  fatPer100g: number;

  @Prop({ default: 0 })
  carbPer100g: number;

  @Prop({ required: true, enum: ['OFF', 'USER', 'CUSTOM_SEED', 'BARCODE', 'RECIPE'] })
  source: ProductSource;

  @Prop()
  sourceId?: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  createdBy?: Types.ObjectId;

  @Prop({ default: false })
  verified?: boolean;
}

export const ProductSchema = SchemaFactory.createForClass(Product);

// partial вместо sparse: у составного sparse-индекса документ индексируется,
// если заполнено ХОТЯ БЫ одно поле — продукты без sourceId попадали в индекс
// как {source, null} и второй такой продукт падал с E11000.
ProductSchema.index(
  { source: 1, sourceId: 1 },
  { unique: true, partialFilterExpression: { sourceId: { $exists: true } } },
);
ProductSchema.index({ nameNormalized: 1 });
ProductSchema.index({ barcode: 1 }, { unique: true, sparse: true });
