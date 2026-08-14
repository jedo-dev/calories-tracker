import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Entry, EntryDocument } from '../entries/schemas/entry.schema';
import { WaterLog, WaterLogDocument } from '../water/schemas/water-log.schema';
import { UserStats, UserStatsDocument } from '../social/schemas/user-stats.schema';
import { NotificationSettings, NotificationSettingsDocument } from './schemas/notification-settings.schema';
import { PushSubscription, PushSubscriptionDocument } from './schemas/push-subscription.schema';
import { PushPayload, PushService } from './push.service';

// Не больше двух пушей в день на пользователя — жёсткий потолок,
// независимо от того, сколько типов напоминаний включено.
const DAILY_CAP = 2;

// Слоты в минутах локального времени. Крон ходит раз в 10 минут, окно 20 минут
// перекрывает возможный пропуск тика; дубли отсекаются через sentTypes.
const SLOT_WINDOW_MIN = 20;
const SLOTS = {
  lunch: 13 * 60 + 30, // 13:30 — день ещё пустой
  water: 16 * 60, //      16:00 — вода не записана
  evening: 20 * 60 + 30, // 20:30 — день так и остался пустым / стрик под угрозой
  weekly: 19 * 60, //     19:00 воскресенья — итоги недели
};

type ReminderType = 'lunch' | 'water' | 'streak' | 'evening' | 'weekly';

@Injectable()
export class NotificationsSchedulerService {
  private readonly logger = new Logger(NotificationsSchedulerService.name);

  constructor(
    private pushService: PushService,
    @InjectModel(NotificationSettings.name)
    private settingsModel: Model<NotificationSettingsDocument>,
    @InjectModel(PushSubscription.name)
    private subscriptionModel: Model<PushSubscriptionDocument>,
    @InjectModel(Entry.name) private entryModel: Model<EntryDocument>,
    @InjectModel(WaterLog.name) private waterModel: Model<WaterLogDocument>,
    @InjectModel(UserStats.name) private statsModel: Model<UserStatsDocument>,
  ) {}

  @Cron('*/10 * * * *')
  async tick() {
    if (!this.pushService.isConfigured) return;
    const allEnabled = await this.settingsModel.find({ enabled: true }).lean();
    for (const settings of allEnabled) {
      try {
        await this.processUser(settings);
      } catch (err: any) {
        this.logger.warn(`Reminder tick failed for ${settings.userId}: ${err?.message}`);
      }
    }
  }

  private async processUser(settings: NotificationSettings & { _id: any }) {
    const userId = String(settings.userId);
    // Локальное время пользователя: getTimezoneOffset() = UTC − local
    const local = new Date(Date.now() - settings.tzOffsetMinutes * 60000);
    const localMinutes = local.getUTCHours() * 60 + local.getUTCMinutes();
    const localDate = local.toISOString().slice(0, 10);
    const isSunday = local.getUTCDay() === 0;

    if (this.inQuietHours(localMinutes, settings.quietFrom, settings.quietTo)) return;

    const sentTypes = settings.sentDate === localDate ? settings.sentTypes || [] : [];
    if (sentTypes.length >= DAILY_CAP) return;

    const inSlot = (slot: number) => localMinutes >= slot && localMinutes < slot + SLOT_WINDOW_MIN;

    // Кандидаты в порядке приоритета — отправляем максимум один пуш за тик
    const candidates: Array<{ type: ReminderType; build: () => Promise<PushPayload | null> }> = [];

    if (settings.weeklyReport && isSunday && inSlot(SLOTS.weekly)) {
      candidates.push({ type: 'weekly', build: () => this.buildWeekly(userId, localDate) });
    }
    if (inSlot(SLOTS.evening)) {
      // Вечером один пуш на выбор: стрик под угрозой (важнее) или общее напоминание
      if (settings.streakReminder) {
        candidates.push({ type: 'streak', build: () => this.buildStreakAtRisk(userId, localDate) });
      }
      if (settings.mealReminders) {
        candidates.push({ type: 'evening', build: () => this.buildEvening(userId, localDate) });
      }
    }
    if (settings.mealReminders && inSlot(SLOTS.lunch)) {
      candidates.push({ type: 'lunch', build: () => this.buildLunch(userId, localDate) });
    }
    if (settings.waterReminder && inSlot(SLOTS.water)) {
      candidates.push({ type: 'water', build: () => this.buildWater(userId, localDate) });
    }

    for (const candidate of candidates) {
      if (sentTypes.includes(candidate.type)) continue;
      // Вечерние типы взаимоисключающие: либо стрик, либо общее напоминание
      if (candidate.type === 'evening' && sentTypes.includes('streak')) continue;
      const payload = await candidate.build();
      if (!payload) continue;
      const delivered = await this.pushService.sendToUser(userId, payload);
      if (delivered > 0) {
        await this.settingsModel.updateOne(
          { _id: settings._id },
          { $set: { sentDate: localDate, sentTypes: [...sentTypes, candidate.type] } },
        );
      } else {
        // Все подписки умерли — sendToUser их вычистил, выключаем рассылку
        const left = await this.subscriptionModel.countDocuments({ userId });
        if (left === 0) {
          await this.settingsModel.updateOne({ _id: settings._id }, { $set: { enabled: false } });
        }
      }
      return;
    }
  }

  // Интервал тихих часов в HH:mm, может переходить через полночь (21:30 → 09:00)
  private inQuietHours(localMinutes: number, from: string, to: string): boolean {
    const parse = (s: string) => {
      const [h, m] = s.split(':').map(Number);
      return (h || 0) * 60 + (m || 0);
    };
    const start = parse(from);
    const end = parse(to);
    if (start === end) return false;
    if (start < end) return localMinutes >= start && localMinutes < end;
    return localMinutes >= start || localMinutes < end;
  }

  private async hasEntriesToday(userId: string, date: string): Promise<boolean> {
    return (await this.entryModel.countDocuments({ userId, date }).limit(1)) > 0;
  }

  private async buildLunch(userId: string, date: string): Promise<PushPayload | null> {
    if (await this.hasEntriesToday(userId, date)) return null;
    return {
      title: 'Как насчёт обеда? 🍽',
      body: 'Сегодня в дневнике пока пусто. Записать еду — минутное дело.',
      tag: 'meal-reminder',
      url: '/today',
    };
  }

  private async buildWater(userId: string, date: string): Promise<PushPayload | null> {
    const count = await this.waterModel.countDocuments({ userId, date }).limit(1);
    if (count > 0) return null;
    return {
      title: 'Стакан воды 💧',
      body: 'За сегодня не записано ни капли. Самое время попить.',
      tag: 'water-reminder',
      url: '/today',
    };
  }

  private async buildStreakAtRisk(userId: string, date: string): Promise<PushPayload | null> {
    const stats = await this.statsModel.findOne({ userId }).lean();
    if (!stats || stats.currentStreak < 2) return null;
    if (stats.lastLoggedDate === date) return null;
    if (await this.hasEntriesToday(userId, date)) return null;
    return {
      title: `Серия ${stats.currentStreak} дн. под угрозой 🔥`,
      body: 'Запишите хотя бы одно блюдо сегодня, чтобы не потерять стрик.',
      tag: 'streak-reminder',
      url: '/today',
    };
  }

  private async buildEvening(userId: string, date: string): Promise<PushPayload | null> {
    if (await this.hasEntriesToday(userId, date)) return null;
    return {
      title: 'Дневник ждёт 🦊',
      body: 'День почти закончился, а записей нет. Вспомните, что ели?',
      tag: 'meal-reminder',
      url: '/today',
    };
  }

  private async buildWeekly(userId: string, localDate: string): Promise<PushPayload | null> {
    // Даты понедельник–воскресенье текущей недели (localDate — воскресенье)
    const end = new Date(`${localDate}T00:00:00Z`);
    const dates: string[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(end.getTime() - i * 86400000);
      dates.push(d.toISOString().slice(0, 10));
    }
    const loggedDates = await this.entryModel.distinct('date', {
      userId,
      date: { $in: dates },
    });
    if (loggedDates.length === 0) return null;
    return {
      title: 'Итоги недели 📊',
      body: `Дневник вёлся ${loggedDates.length} из 7 дней. Загляните в отчёты!`,
      tag: 'weekly-report',
      url: '/reports',
    };
  }
}
