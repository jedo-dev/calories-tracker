import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as webpush from 'web-push';
import { PushSubscription, PushSubscriptionDocument } from './schemas/push-subscription.schema';

export interface PushPayload {
  title: string;
  body: string;
  // tag схлопывает одинаковые уведомления, url открывается по клику
  tag?: string;
  url?: string;
}

// Тонкая обёртка над web-push: VAPID-ключи, доставка на все подписки
// пользователя, чистка мёртвых подписок (404/410 от пуш-сервиса).
@Injectable()
export class PushService implements OnModuleInit {
  private readonly logger = new Logger(PushService.name);
  private configured = false;

  constructor(
    private configService: ConfigService,
    @InjectModel(PushSubscription.name)
    private subscriptionModel: Model<PushSubscriptionDocument>,
  ) {}

  onModuleInit() {
    const publicKey = this.configService.get<string>('VAPID_PUBLIC_KEY');
    const privateKey = this.configService.get<string>('VAPID_PRIVATE_KEY');
    if (!publicKey || !privateKey) {
      this.logger.warn(
        'VAPID_PUBLIC_KEY/VAPID_PRIVATE_KEY не заданы — пуш-уведомления отключены. ' +
          'Сгенерировать: npx web-push generate-vapid-keys',
      );
      return;
    }
    const subject = this.configService.get<string>('VAPID_SUBJECT') || 'mailto:admin@flareonfit.app';
    webpush.setVapidDetails(subject, publicKey, privateKey);
    this.configured = true;
  }

  get isConfigured(): boolean {
    return this.configured;
  }

  getPublicKey(): string | null {
    return this.configService.get<string>('VAPID_PUBLIC_KEY') || null;
  }

  /**
   * Отправляет payload на все подписки пользователя.
   * ttlSeconds — время жизни в пуш-сервисе: напоминание «запишите обед»
   * не должно прилететь утром следующего дня, когда телефон выйдет в сеть.
   * Возвращает число успешных доставок.
   */
  async sendToUser(userId: string, payload: PushPayload, ttlSeconds = 3600): Promise<number> {
    if (!this.configured) return 0;
    const subs = await this.subscriptionModel.find({ userId }).lean();
    let delivered = 0;
    for (const sub of subs) {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: sub.keys },
          JSON.stringify(payload),
          { TTL: ttlSeconds, urgency: 'normal' },
        );
        delivered++;
      } catch (err: any) {
        const status = err?.statusCode;
        // Подписка отозвана или протухла — удаляем, чтобы не долбить пуш-сервис
        if (status === 404 || status === 410) {
          await this.subscriptionModel.deleteOne({ endpoint: sub.endpoint });
        } else {
          this.logger.warn(`Push failed for user ${userId}: ${status || err?.message}`);
        }
      }
    }
    return delivered;
  }
}
