import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Achievement, AchievementDocument } from './schemas/achievement.schema';
import { UserStats, UserStatsDocument } from './schemas/user-stats.schema';
import { ActivityEvent, ActivityEventDocument } from './schemas/activity-event.schema';

const ACHIEVEMENT_DEFS = [
  { key: '7day_streak', imageKey: 'badge_7day_streak' },
  { key: 'first_workout', imageKey: 'badge_first_workout' },
  { key: 'calorie_master', imageKey: 'badge_calorie_master' },
  { key: 'hydration_hero', imageKey: 'badge_hydration_hero' },
  { key: 'social_butterfly', imageKey: 'badge_social_butterfly' },
];

@Injectable()
export class AchievementsService {
  constructor(
    @InjectModel(Achievement.name) private achievementModel: Model<AchievementDocument>,
    @InjectModel(UserStats.name) private userStatsModel: Model<UserStatsDocument>,
    @InjectModel(ActivityEvent.name) private activityEventModel: Model<ActivityEventDocument>,
  ) {}

  async getUserAchievements(userId: string) {
    const unlocked = await this.achievementModel
      .find({ userId: new Types.ObjectId(userId) })
      .exec();
    const unlockedMap = new Map(unlocked.map((a) => [a.key, a]));

    return ACHIEVEMENT_DEFS.map((def) => {
      const achievement = unlockedMap.get(def.key);
      return {
        key: def.key,
        imageKey: def.imageKey,
        unlocked: !!achievement,
        unlockedAt: achievement?.unlockedAt || null,
      };
    });
  }

  async checkAndUnlock(userId: string): Promise<string[]> {
    const newlyUnlocked: string[] = [];
    const stats = await this.userStatsModel.findOne({ userId: new Types.ObjectId(userId) }).exec();

    const existing = await this.achievementModel
      .find({ userId: new Types.ObjectId(userId) })
      .distinct('key')
      .exec();
    const existingSet = new Set(existing);

    if (stats) {
      if (stats.currentStreak >= 7 && !existingSet.has('7day_streak')) {
        await this.unlock(userId, '7day_streak');
        newlyUnlocked.push('7day_streak');
      }

      if (stats.xpTotal >= 500 && !existingSet.has('calorie_master')) {
        await this.unlock(userId, 'calorie_master');
        newlyUnlocked.push('calorie_master');
      }
    }

    const workoutCount = await this.activityEventModel.countDocuments({
      userId: new Types.ObjectId(userId),
      type: 'workout_completed',
    }).exec();
    if (workoutCount >= 1 && !existingSet.has('first_workout')) {
      await this.unlock(userId, 'first_workout');
      newlyUnlocked.push('first_workout');
    }

    const waterGoalDays = await this.activityEventModel.countDocuments({
      userId: new Types.ObjectId(userId),
      type: 'water_goal',
    }).exec();
    if (waterGoalDays >= 5 && !existingSet.has('hydration_hero')) {
      await this.unlock(userId, 'hydration_hero');
      newlyUnlocked.push('hydration_hero');
    }

    return newlyUnlocked;
  }

  private async unlock(userId: string, key: string) {
    const def = ACHIEVEMENT_DEFS.find((d) => d.key === key);
    if (!def) return;

    await this.achievementModel.findOneAndUpdate(
      { userId: new Types.ObjectId(userId), key },
      {
        userId: new Types.ObjectId(userId),
        key: def.key,
        imageKey: def.imageKey,
        unlockedAt: new Date(),
      },
      { upsert: true, new: true },
    ).exec();

    await this.activityEventModel.create({
      userId: new Types.ObjectId(userId),
      type: 'achievement_earned',
      date: new Date().toISOString().split('T')[0],
      payload: { achievementKey: key },
    });
  }
}
