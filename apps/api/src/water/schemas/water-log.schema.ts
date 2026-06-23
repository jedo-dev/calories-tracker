import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type WaterLogDocument = WaterLog & Document;

@Schema({ timestamps: true })
export class WaterLog {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ required: true, index: true })
  date: string;

  @Prop({ required: true, min: 1 })
  amountMl: number;
}

export const WaterLogSchema = SchemaFactory.createForClass(WaterLog);
WaterLogSchema.index({ userId: 1, date: 1 });
