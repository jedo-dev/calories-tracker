import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type BodyMeasurementDocument = BodyMeasurement & Document;

@Schema({ timestamps: true })
export class BodyMeasurement {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ required: true, index: true })
  date: string;

  @Prop()
  waistCm?: number;

  @Prop()
  hipsCm?: number;

  @Prop()
  chestCm?: number;

  @Prop()
  bicepCm?: number;

  @Prop()
  thighCm?: number;
}

export const BodyMeasurementSchema = SchemaFactory.createForClass(BodyMeasurement);
BodyMeasurementSchema.index({ userId: 1, date: 1 }, { unique: true });
