import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UserStatsDocument = UserStats & Document;

@Schema({ timestamps: true })
export class UserStats {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, unique: true, index: true })
  userId: Types.ObjectId;

  @Prop({ default: 0 })
  xpTotal: number;

  @Prop({ default: 0 })
  xpWeek: number;

  @Prop()
  weekKey: string;

  @Prop({ default: 0 })
  currentStreak: number;

  @Prop({ default: 0 })
  bestStreak: number;

  @Prop()
  lastLoggedDate?: string;
}

export const UserStatsSchema = SchemaFactory.createForClass(UserStats);

// Недельный лидерборд: find({weekKey}).sort({xpWeek:-1}) — без этого
// индекса каждый запрос топа был COLLSCAN + сортировкой в памяти.
UserStatsSchema.index({ weekKey: 1, xpWeek: -1 });
