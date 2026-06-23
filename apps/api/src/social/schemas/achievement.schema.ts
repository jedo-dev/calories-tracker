import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AchievementDocument = Achievement & Document;

@Schema({ timestamps: true })
export class Achievement {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  key: string;

  @Prop({ required: true })
  name: string;

  @Prop()
  description: string;

  @Prop()
  imageKey: string;

  @Prop({ default: Date.now })
  unlockedAt: Date;
}

export const AchievementSchema = SchemaFactory.createForClass(Achievement);

AchievementSchema.index({ userId: 1, key: 1 }, { unique: true });
