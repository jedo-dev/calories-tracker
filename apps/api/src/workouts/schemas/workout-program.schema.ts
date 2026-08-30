import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type WorkoutProgramDocument = WorkoutProgram & Document;

@Schema({ _id: false })
export class WorkoutProgramItem {
  @Prop({ type: Types.ObjectId, ref: 'Exercise', required: true })
  exerciseId: Types.ObjectId;

  @Prop({ required: true })
  order: number;

  @Prop({ required: true, default: 3 })
  sets: number;

  @Prop()
  reps?: number;

  @Prop()
  durationSec?: number;

  @Prop({ default: 60 })
  restSec: number;
}

export const WorkoutProgramItemSchema = SchemaFactory.createForClass(WorkoutProgramItem);

@Schema({ timestamps: true })
export class WorkoutProgram {
  // Уникальность имени снята: у пользовательских программ имена свободные.
  // Старый unique-индекс name_1 дропается в WorkoutService.onModuleInit.
  @Prop({ required: true })
  name: string;

  // null/отсутствует — глобальная программа (admin/trainer), иначе личная
  @Prop({ type: Types.ObjectId, ref: 'User', index: true, default: null })
  userId?: Types.ObjectId | null;

  @Prop()
  description?: string;

  @Prop()
  imageUrl?: string;

  @Prop({ type: Types.ObjectId, ref: 'WorkoutCategory' })
  categoryId?: Types.ObjectId;

  @Prop({ enum: ['beginner', 'intermediate', 'advanced'], default: 'beginner' })
  level: string;

  @Prop({ required: true, default: 0 })
  sortOrder: number;

  @Prop({ type: [WorkoutProgramItemSchema], default: [] })
  items: WorkoutProgramItem[];
}

export const WorkoutProgramSchema = SchemaFactory.createForClass(WorkoutProgram);

WorkoutProgramSchema.index({ categoryId: 1, sortOrder: 1 });
