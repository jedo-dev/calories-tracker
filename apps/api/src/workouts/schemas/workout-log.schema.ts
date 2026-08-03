import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type WorkoutLogDocument = WorkoutLog & Document;

@Schema({ _id: false })
export class WorkoutSetDetail {
  @Prop({ required: true })
  setNumber: number;

  @Prop({ type: Number, default: null })
  weightKg?: number;

  @Prop({ type: Number, default: null })
  reps?: number;

  @Prop({ type: Number, default: null })
  durationSec?: number;

  @Prop({ default: false })
  done: boolean;

  @Prop({ type: Date })
  completedAt?: Date;
}

export const WorkoutSetDetailSchema = SchemaFactory.createForClass(WorkoutSetDetail);

@Schema({ timestamps: true })
export class WorkoutLog {
  @Prop({ type: Types.ObjectId, ref: 'WorkoutSession', required: true })
  sessionId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Exercise', required: true })
  exerciseId: Types.ObjectId;

  @Prop({ required: true })
  exerciseName: string;

  @Prop()
  gifUrl?: string;

  @Prop({ default: 0 })
  sets: number;

  @Prop({ default: 0 })
  reps: number;

  @Prop({ default: null })
  weightKg: number;

  @Prop({ default: 0 })
  durationSec: number;

  @Prop({ default: 0 })
  caloriesBurned: number;

  @Prop({ type: [WorkoutSetDetailSchema], default: [] })
  setsDetail: WorkoutSetDetail[];

  @Prop({ default: 60 })
  restSec: number;

  @Prop({ default: 0 })
  order: number;
}

export const WorkoutLogSchema = SchemaFactory.createForClass(WorkoutLog);

WorkoutLogSchema.index({ sessionId: 1 });
WorkoutLogSchema.index({ userId: 1, createdAt: 1 });
