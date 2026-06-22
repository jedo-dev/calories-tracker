import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ExerciseDocument = Exercise & Document;

export type ExerciseType = 'strength' | 'cardio' | 'flexibility';

@Schema({ timestamps: true })
export class Exercise {
  @Prop({ required: true })
  name: string;

  @Prop()
  description?: string;

  @Prop({ type: Types.ObjectId, ref: 'WorkoutCategory', required: true, index: true })
  categoryId: Types.ObjectId;

  @Prop({ required: true })
  gifUrl: string;

  @Prop({
    type: String,
    enum: ['strength', 'cardio', 'flexibility'],
    required: true,
  })
  type: ExerciseType;

  @Prop({ required: true })
  metValue: number;

  @Prop({ type: [String], default: [] })
  muscleGroups: string[];

  @Prop({ type: String, enum: ['beginner', 'intermediate', 'advanced'], default: 'beginner' })
  difficulty: string;

  @Prop({ type: String, default: null })
  equipment: string;

  @Prop({ default: 3 })
  defaultSets: number;

  @Prop({ default: 12 })
  defaultReps: number;

  @Prop({ default: null })
  defaultDurationSec: number;
}

export const ExerciseSchema = SchemaFactory.createForClass(Exercise);
