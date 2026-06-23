import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ProductDocument = Product & Document;

export type ProductSource = 'OFF' | 'USER' | 'CUSTOM_SEED';

@Schema({ timestamps: true })
export class Product {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, lowercase: true })
  nameNormalized: string;

  @Prop({ required: true })
  kcalPer100g: number;

  @Prop({ default: 0 })
  proteinPer100g: number;

  @Prop({ default: 0 })
  fatPer100g: number;

  @Prop({ default: 0 })
  carbPer100g: number;

  @Prop({ required: true, enum: ['OFF', 'USER', 'CUSTOM_SEED'] })
  source: ProductSource;

  @Prop()
  sourceId?: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  createdBy?: Types.ObjectId;
}

export const ProductSchema = SchemaFactory.createForClass(Product);

ProductSchema.index({ source: 1, sourceId: 1 }, { unique: true, sparse: true });
ProductSchema.index({ nameNormalized: 1 });
