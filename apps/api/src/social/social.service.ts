import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { UserStats, UserStatsDocument } from './schemas/user-stats.schema';
import { ActivityEvent, ActivityEventDocument } from './schemas/activity-event.schema';
import { Entry, EntryDocument } from '../entries/schemas/entry.schema';

@Injectable()
export class SocialService {
  constructor(
    @InjectModel(UserStats.name) private userStatsModel: Model<UserStatsDocument>,
    @InjectModel(ActivityEvent.name) private activityEventModel: Model<ActivityEventDocument>,
    @InjectModel(Entry.name) private entryModel: Model<EntryDocument>,
  ) {}

  getWeekKey(date: Date = new Date()): string {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayOfWeek = d.getUTCDay();
    const diff = d.getUTCDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    const monday = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), diff));
    const year = monday.getUTCFullYear();
    const week = Math.ceil((monday.getTime() - new Date(Date.UTC(year, 0, 1)).getTime()) / (7 * 24 * 60 * 60 * 1000));
    return `${year}-W${String(week).padStart(2, '0')}`;
  }

  async ensureUserStats(userId: string): Promise<UserStatsDocument> {
    let stats = await this.userStatsModel.findOne({ userId: new Types.ObjectId(userId) }).exec();
    if (!stats) {
      stats = new this.userStatsModel({
        userId: new Types.ObjectId(userId),
        xpTotal: 0,
        xpWeek: 0,
        weekKey: this.getWeekKey(),
        currentStreak: 0,
        bestStreak: 0,
      });
      await stats.save();
    }
    return stats;
  }

  maybeResetWeek(stats: UserStatsDocument): void {
    const currentWeekKey = this.getWeekKey();
    if (stats.weekKey !== currentWeekKey) {
      stats.weekKey = currentWeekKey;
      stats.xpWeek = 0;
    }
  }

  getYesterday(date: string): string {
    const d = new Date(date + 'T00:00:00Z');
    d.setUTCDate(d.getUTCDate() - 1);
    return d.toISOString().split('T')[0];
  }

  /**
   * Атомарно начисляет XP (upsert + $inc, со сбросом недельного счётчика при
   * смене недели). Никаких read-modify-write: параллельные запросы не теряют XP.
   */
  async addXp(userId: string, amount: number): Promise<void> {
    if (amount <= 0) return;
    const uid = new Types.ObjectId(userId);
    const weekKey = this.getWeekKey();

    // Сброс недельного счётчика, если началась новая неделя.
    await this.userStatsModel
      .updateOne({ userId: uid, weekKey: { $ne: weekKey } }, { $set: { weekKey, xpWeek: 0 } })
      .exec();

    try {
      await this.userStatsModel
        .updateOne(
          { userId: uid },
          {
            $inc: { xpTotal: amount, xpWeek: amount },
            $setOnInsert: { weekKey, currentStreak: 0, bestStreak: 0 },
          },
          { upsert: true },
        )
        .exec();
    } catch (err: any) {
      // Гонка двух upsert'ов упирается в unique(userId) — повторяем без upsert.
      if (err?.code === 11000) {
        await this.userStatsModel
          .updateOne({ userId: uid }, { $inc: { xpTotal: amount, xpWeek: amount } })
          .exec();
      } else {
        throw err;
      }
    }
  }

  /** +5 XP за завершённую тренировку (событие ленты создаёт workout-сервис). */
  async grantXpForWorkout(userId: string): Promise<void> {
    await this.addXp(userId, 5);
  }

  /** +3 XP за закрытую норму воды (событие ленты создаёт water-сервис). */
  async grantXpForWaterGoal(userId: string): Promise<void> {
    await this.addXp(userId, 3);
  }

  async updateStreakIfFirstLogOfDay(userId: string, date: string): Promise<void> {
    const stats = await this.ensureUserStats(userId);

    const entryCount = await this.entryModel.countDocuments({
      userId: new Types.ObjectId(userId),
      date,
    }).exec();

    // Раньше здесь было `!== 1`: две параллельные записи обе видели count=2,
    // и стрик не засчитывался вообще.
    if (entryCount === 0) {
      return;
    }

    if (stats.lastLoggedDate === date) {
      return;
    }
    // Дозапись за прошлые даты не должна сбрасывать текущий стрик.
    if (stats.lastLoggedDate && date < stats.lastLoggedDate) {
      return;
    }

    const yesterday = this.getYesterday(date);
    const newStreak = stats.lastLoggedDate === yesterday ? stats.currentStreak + 1 : 1;

    // Оптимистичная блокировка: обновляем только если lastLoggedDate не изменился
    // с момента чтения — при гонке победит ровно один запрос.
    const updated = await this.userStatsModel
      .findOneAndUpdate(
        {
          userId: new Types.ObjectId(userId),
          lastLoggedDate: stats.lastLoggedDate ?? null,
        },
        {
          $set: { currentStreak: newStreak, lastLoggedDate: date },
          $max: { bestStreak: newStreak },
        },
        { new: true },
      )
      .exec();

    if (!updated) return;

    const milestones = [3, 7, 14, 30];
    if (milestones.includes(newStreak)) {
      await this.activityEventModel.create({
        userId: new Types.ObjectId(userId),
        type: 'streak_milestone',
        date,
        payload: { streak: newStreak },
      });
    }
  }

  async grantXpForEntry(userId: string, date: string): Promise<void> {
    const entryCount = await this.entryModel.countDocuments({
      userId: new Types.ObjectId(userId),
      date,
    }).exec();

    const isFirstLogOfDay = entryCount === 1;

    const todayEvents = await this.activityEventModel.find({
      userId: new Types.ObjectId(userId),
      date,
      type: { $in: ['log_day', 'xp_gain'] },
    }).exec();

    const todayXp = todayEvents.reduce((sum, event) => {
      return sum + (event.payload?.xp || 0);
    }, 0);

    const maxXpPerDay = 50;
    if (todayXp >= maxXpPerDay) {
      return;
    }

    let xpToGrant = 0;
    let eventType: 'log_day' | 'xp_gain' = 'xp_gain';

    if (isFirstLogOfDay) {
      const remainingXp = maxXpPerDay - todayXp;
      if (remainingXp >= 10) {
        xpToGrant = 10;
        eventType = 'log_day';
      } else if (remainingXp > 0) {
        xpToGrant = remainingXp;
        eventType = 'log_day';
      }
    } else {
      const remainingXp = maxXpPerDay - todayXp;
      if (remainingXp >= 2) {
        xpToGrant = 2;
      } else if (remainingXp > 0) {
        xpToGrant = remainingXp;
      }
    }

    if (xpToGrant > 0) {
      await this.addXp(userId, xpToGrant);

      await this.activityEventModel.create({
        userId: new Types.ObjectId(userId),
        type: eventType,
        date,
        payload: { xp: xpToGrant },
      });
    }
  }
}
