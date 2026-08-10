import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ActivityEventDocument = ActivityEvent & Document;

// 'recipe_like' — служебный тип для хранения лайков; в ленту не попадает.
export type ActivityEventType = 'log_day' | 'streak_milestone' | 'xp_gain' | 'follow' | 'workout_completed' | 'water_goal' | 'achievement_earned' | 'recipe_published' | 'recipe_like';

@Schema({ timestamps: true })
export class ActivityEvent {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ type: String, enum: ['log_day', 'streak_milestone', 'xp_gain', 'follow', 'workout_completed', 'water_goal', 'achievement_earned', 'recipe_published', 'recipe_like'], required: true })
  type: ActivityEventType;

  @Prop({ required: true })
  date: string;

  @Prop({ type: Object, default: {} })
  payload: Record<string, any>;

  @Prop({ type: Object, default: {} })
  reactions: Record<string, string[]>;
}

export const ActivityEventSchema = SchemaFactory.createForClass(ActivityEvent);

ActivityEventSchema.index({ userId: 1, createdAt: -1 });
