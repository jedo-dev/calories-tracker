import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type WorkoutCategoryDocument = WorkoutCategory & Document;

@Schema({ timestamps: true })
export class WorkoutCategory {
  @Prop({ required: true, unique: true })
  name: string;

  @Prop()
  description?: string;

  @Prop({ required: true })
  emoji: string;

  @Prop({ required: true })
  sortOrder: number;
}

export const WorkoutCategorySchema = SchemaFactory.createForClass(WorkoutCategory);
