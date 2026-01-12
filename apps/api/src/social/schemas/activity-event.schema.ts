import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ActivityEventDocument = ActivityEvent & Document;

export type ActivityEventType = 'log_day' | 'streak_milestone' | 'xp_gain' | 'follow';

@Schema({ timestamps: true })
export class ActivityEvent {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ type: String, enum: ['log_day', 'streak_milestone', 'xp_gain', 'follow'], required: true })
  type: ActivityEventType;

  @Prop({ required: true })
  date: string;

  @Prop({ type: Object, default: {} })
  payload: Record<string, any>;
}

export const ActivityEventSchema = SchemaFactory.createForClass(ActivityEvent);

ActivityEventSchema.index({ userId: 1, createdAt: -1 });
