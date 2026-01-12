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

  async updateStreakIfFirstLogOfDay(userId: string, date: string): Promise<void> {
    const stats = await this.ensureUserStats(userId);
    this.maybeResetWeek(stats);

    const entryCount = await this.entryModel.countDocuments({
      userId: new Types.ObjectId(userId),
      date,
    }).exec();

    if (entryCount !== 1) {
      return;
    }

    const yesterday = this.getYesterday(date);

    if (stats.lastLoggedDate === date) {
      return;
    }

    if (stats.lastLoggedDate === yesterday) {
      stats.currentStreak += 1;
    } else {
      stats.currentStreak = 1;
    }

    if (stats.currentStreak > stats.bestStreak) {
      stats.bestStreak = stats.currentStreak;
    }

    stats.lastLoggedDate = date;
    await stats.save();

    const milestones = [3, 7, 14, 30];
    if (milestones.includes(stats.currentStreak)) {
      await this.activityEventModel.create({
        userId: new Types.ObjectId(userId),
        type: 'streak_milestone',
        date,
        payload: { streak: stats.currentStreak },
      });
    }
  }

  async grantXpForEntry(userId: string, date: string): Promise<void> {
    const stats = await this.ensureUserStats(userId);
    this.maybeResetWeek(stats);

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
      stats.xpTotal += xpToGrant;
      stats.xpWeek += xpToGrant;
      await stats.save();

      await this.activityEventModel.create({
        userId: new Types.ObjectId(userId),
        type: eventType,
        date,
        payload: { xp: xpToGrant },
      });
    }
  }
}
