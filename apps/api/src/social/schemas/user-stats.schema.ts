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

  // Стрик-фризы: авто-списываются при пропуске дня, максимум 2 в запасе.
  // Новичкам один бесплатный (дефолт), дальше — покупка за XP.
  @Prop({ default: 1 })
  streakFreezes: number;

  // Сгоревший стрик, доступный для платного восстановления в течение 2 дней
  @Prop({ default: 0 })
  lostStreak: number;

  @Prop()
  lostStreakDate?: string;
}

export const UserStatsSchema = SchemaFactory.createForClass(UserStats);

// Недельный лидерборд: find({weekKey}).sort({xpWeek:-1}) — без этого
// индекса каждый запрос топа был COLLSCAN + сортировкой в памяти.
UserStatsSchema.index({ weekKey: 1, xpWeek: -1 });
