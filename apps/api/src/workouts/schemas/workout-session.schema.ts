import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type WorkoutSessionDocument = WorkoutSession & Document;

@Schema({ timestamps: true })
export class WorkoutSession {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ required: true, index: true })
  date: string;

  @Prop({ type: Types.ObjectId, ref: 'WorkoutCategory' })
  categoryId?: Types.ObjectId;

  @Prop()
  categoryName?: string;

  @Prop()
  name?: string;

  @Prop({ default: 0 })
  totalCaloriesBurned: number;

  @Prop({ default: 0 })
  totalDurationSec: number;

  @Prop({ default: 0 })
  exerciseCount: number;

  @Prop({ type: Date })
  startedAt?: Date;

  @Prop({ type: Date })
  finishedAt?: Date;
}

export const WorkoutSessionSchema = SchemaFactory.createForClass(WorkoutSession);

WorkoutSessionSchema.index({ userId: 1, date: 1 });
