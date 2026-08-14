import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Entry, EntryDocument } from '../entries/schemas/entry.schema';
import { ActivityEvent, ActivityEventDocument } from './schemas/activity-event.schema';
import { UserStats, UserStatsDocument } from './schemas/user-stats.schema';

// Экономика стриков: фриз спасает пропущенный день автоматически,
// восстановление возвращает уже сгоревший стрик. Всё за xpTotal —
// недельный xpWeek (лидерборд) тратами не затрагивается.
export const STREAK_FREEZE_COST = 30;
export const STREAK_FREEZE_MAX = 2;
export const STREAK_RESTORE_COST = 50;
export const STREAK_RESTORE_WINDOW_DAYS = 2;
// Однодневный стрик восстанавливать бессмысленно — сохраняем только заметные
const STREAK_RESTORE_MIN = 3;

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
    const week = Math.ceil(
      (monday.getTime() - new Date(Date.UTC(year, 0, 1)).getTime()) / (7 * 24 * 60 * 60 * 1000),
    );
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
    // Миграция на чтении для старых документов: поле появилось позже,
    // а атомарные запросы вида {streakFreezes: {$lt: 2}} не матчат отсутствующее.
    // Важно: проверка через $isDefault — Mongoose подставляет дефолт схемы при
    // чтении, поэтому `== null` для отсутствующего в базе поля никогда не истинно.
    if (stats.$isDefault('streakFreezes')) {
      await this.userStatsModel
        .updateOne({ _id: stats._id, streakFreezes: null }, { $set: { streakFreezes: 1 } })
        .exec();
      stats.streakFreezes = 1;
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

    const entryCount = await this.entryModel
      .countDocuments({
        userId: new Types.ObjectId(userId),
        date,
      })
      .exec();

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

    // Сколько дней пропущено между последней записью и текущей датой
    const missedDays = stats.lastLoggedDate
      ? Math.round(
          (new Date(date + 'T00:00:00Z').getTime() -
            new Date(stats.lastLoggedDate + 'T00:00:00Z').getTime()) /
            86400000,
        ) - 1
      : Infinity;

    const freezes = stats.streakFreezes ?? 1;
    let newStreak: number;
    let freezesSpent = 0;
    const set: Record<string, any> = { lastLoggedDate: date };

    if (missedDays === 0) {
      // Вчера была запись — обычное продолжение
      newStreak = stats.currentStreak + 1;
    } else if (missedDays >= 1 && missedDays <= freezes && stats.currentStreak > 0) {
      // Пропуск покрыт фризами: стрик живёт, фризы сгорают по одному за день
      newStreak = stats.currentStreak + 1;
      freezesSpent = missedDays;
    } else {
      newStreak = 1;
      // Заметный стрик сгорел — даём окно на платное восстановление
      if (stats.currentStreak >= STREAK_RESTORE_MIN) {
        set.lostStreak = stats.currentStreak;
        set.lostStreakDate = date;
      }
    }
    set.currentStreak = newStreak;

    // Оптимистичная блокировка: обновляем только если lastLoggedDate не изменился
    // с момента чтения — при гонке победит ровно один запрос.
    const updated = await this.userStatsModel
      .findOneAndUpdate(
        {
          userId: new Types.ObjectId(userId),
          lastLoggedDate: stats.lastLoggedDate ?? null,
        },
        {
          $set: set,
          $max: { bestStreak: newStreak },
          ...(freezesSpent > 0 ? { $inc: { streakFreezes: -freezesSpent } } : {}),
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

  /**
   * Покупка стрик-фриза за XP. Атомарно: условия (хватает XP, запас не полон)
   * зашиты в фильтр запроса, гонки не дают уйти в минус или превысить лимит.
   */
  async buyStreakFreeze(userId: string) {
    const stats = await this.ensureUserStats(userId);
    const result = await this.userStatsModel
      .updateOne(
        {
          userId: new Types.ObjectId(userId),
          xpTotal: { $gte: STREAK_FREEZE_COST },
          streakFreezes: { $lt: STREAK_FREEZE_MAX },
        },
        { $inc: { xpTotal: -STREAK_FREEZE_COST, streakFreezes: 1 } },
      )
      .exec();
    if (result.modifiedCount === 0) {
      if ((stats.streakFreezes ?? 0) >= STREAK_FREEZE_MAX) {
        throw new BadRequestException('Запас фризов уже полон');
      }

      throw new BadRequestException('Недостаточно XP для покупки фриза');
    }
    const updated = await this.ensureUserStats(userId);
    return { streakFreezes: updated.streakFreezes, xpTotal: updated.xpTotal };
  }

  /**
   * Восстановление сгоревшего стрика за XP: доступно 2 дня после потери.
   * Восстановленный стрик поглощает начатый заново (lostStreak + текущий).
   */
  async restoreStreak(userId: string) {
    const stats = await this.ensureUserStats(userId);
    if (!stats.lostStreak || !stats.lostStreakDate) {
      throw new BadRequestException('Нет стрика для восстановления');
    }
    const today = new Date().toISOString().slice(0, 10);
    const daysSinceLoss = Math.round(
      (new Date(today + 'T00:00:00Z').getTime() -
        new Date(stats.lostStreakDate + 'T00:00:00Z').getTime()) /
        86400000,
    );
    if (daysSinceLoss > STREAK_RESTORE_WINDOW_DAYS) {
      // Окно прошло — чистим, чтобы UI перестал предлагать восстановление
      await this.userStatsModel
        .updateOne(
          { userId: new Types.ObjectId(userId) },
          { $set: { lostStreak: 0 }, $unset: { lostStreakDate: 1 } },
        )
        .exec();
      throw new BadRequestException('Время восстановления истекло');
    }
    const newStreak = stats.lostStreak + stats.currentStreak;
    const result = await this.userStatsModel
      .updateOne(
        {
          userId: new Types.ObjectId(userId),
          lostStreak: stats.lostStreak,
          xpTotal: { $gte: STREAK_RESTORE_COST },
        },
        {
          $set: { currentStreak: newStreak, lostStreak: 0 },
          $unset: { lostStreakDate: 1 },
          $max: { bestStreak: newStreak },
          $inc: { xpTotal: -STREAK_RESTORE_COST },
        },
      )
      .exec();
    if (result.modifiedCount === 0) {
      throw new BadRequestException('Недостаточно XP для восстановления');
    }
    const updated = await this.ensureUserStats(userId);
    return { currentStreak: updated.currentStreak, xpTotal: updated.xpTotal };
  }

  async grantXpForEntry(userId: string, date: string): Promise<void> {
    const entryCount = await this.entryModel
      .countDocuments({
        userId: new Types.ObjectId(userId),
        date,
      })
      .exec();

    const isFirstLogOfDay = entryCount === 1;

    const todayEvents = await this.activityEventModel
      .find({
        userId: new Types.ObjectId(userId),
        date,
        type: { $in: ['log_day', 'xp_gain'] },
      })
      .exec();

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
