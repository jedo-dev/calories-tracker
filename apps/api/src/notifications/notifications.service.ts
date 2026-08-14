import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { NotificationSettings, NotificationSettingsDocument } from './schemas/notification-settings.schema';
import { PushSubscription, PushSubscriptionDocument } from './schemas/push-subscription.schema';
import { PushService } from './push.service';

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel(NotificationSettings.name)
    private settingsModel: Model<NotificationSettingsDocument>,
    @InjectModel(PushSubscription.name)
    private subscriptionModel: Model<PushSubscriptionDocument>,
    private pushService: PushService,
  ) {}

  async getSettings(userId: string) {
    const settings =
      (await this.settingsModel.findOne({ userId }).lean()) ||
      new this.settingsModel({ userId }).toObject();
    const subscriptionsCount = await this.subscriptionModel.countDocuments({ userId });
    return {
      enabled: settings.enabled,
      mealReminders: settings.mealReminders,
      waterReminder: settings.waterReminder,
      streakReminder: settings.streakReminder,
      weeklyReport: settings.weeklyReport,
      quietFrom: settings.quietFrom,
      quietTo: settings.quietTo,
      subscriptionsCount,
      pushConfigured: this.pushService.isConfigured,
    };
  }

  async updateSettings(userId: string, body: any) {
    const update: Record<string, any> = {};
    for (const key of ['enabled', 'mealReminders', 'waterReminder', 'streakReminder', 'weeklyReport']) {
      if (typeof body?.[key] === 'boolean') update[key] = body[key];
    }
    for (const key of ['quietFrom', 'quietTo']) {
      if (typeof body?.[key] === 'string') {
        if (!TIME_RE.test(body[key])) throw new BadRequestException(`Некорректное время: ${key}`);
        update[key] = body[key];
      }
    }
    if (Number.isFinite(body?.tzOffsetMinutes) && Math.abs(body.tzOffsetMinutes) <= 14 * 60) {
      update.tzOffsetMinutes = body.tzOffsetMinutes;
    }
    await this.settingsModel.updateOne({ userId }, { $set: update }, { upsert: true });
    return this.getSettings(userId);
  }

  async subscribe(userId: string, body: any) {
    const sub = body?.subscription;
    if (!sub?.endpoint || !sub?.keys?.p256dh || !sub?.keys?.auth) {
      throw new BadRequestException('Некорректная push-подписка');
    }
    // endpoint глобально уникален: если браузер переподписался под другим
    // аккаунтом — подписка переезжает к нему.
    await this.subscriptionModel.updateOne(
      { endpoint: sub.endpoint },
      {
        $set: {
          userId,
          keys: { p256dh: sub.keys.p256dh, auth: sub.keys.auth },
          userAgent: typeof body?.userAgent === 'string' ? body.userAgent.slice(0, 300) : undefined,
        },
      },
      { upsert: true },
    );
    const settingsUpdate: Record<string, any> = { enabled: true };
    if (Number.isFinite(body?.tzOffsetMinutes) && Math.abs(body.tzOffsetMinutes) <= 14 * 60) {
      settingsUpdate.tzOffsetMinutes = body.tzOffsetMinutes;
    }
    await this.settingsModel.updateOne({ userId }, { $set: settingsUpdate }, { upsert: true });
    return { ok: true };
  }

  async unsubscribe(userId: string, endpoint?: string) {
    if (endpoint) {
      await this.subscriptionModel.deleteOne({ userId, endpoint });
    } else {
      await this.subscriptionModel.deleteMany({ userId });
    }
    const left = await this.subscriptionModel.countDocuments({ userId });
    if (left === 0) {
      await this.settingsModel.updateOne({ userId }, { $set: { enabled: false } });
    }
    return { ok: true };
  }

  async sendTest(userId: string) {
    const delivered = await this.pushService.sendToUser(
      userId,
      {
        title: 'FlareonFit',
        body: 'Пуш-уведомления работают 🦊',
        tag: 'test',
        url: '/today',
      },
      300,
    );
    return { delivered };
  }
}
