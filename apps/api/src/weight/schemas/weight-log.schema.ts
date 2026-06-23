import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type WeightLogDocument = WeightLog & Document;

@Schema({ timestamps: true })
export class WeightLog {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ required: true, index: true })
  date: string;

  @Prop({ required: true, min: 20, max: 400 })
  weightKg: number;
}

export const WeightLogSchema = SchemaFactory.createForClass(WeightLog);
WeightLogSchema.index({ userId: 1, date: 1 }, { unique: true });
