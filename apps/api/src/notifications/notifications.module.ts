import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Entry, EntrySchema } from '../entries/schemas/entry.schema';
import { WaterLog, WaterLogSchema } from '../water/schemas/water-log.schema';
import { UserStats, UserStatsSchema } from '../social/schemas/user-stats.schema';
import { NotificationSettings, NotificationSettingsSchema } from './schemas/notification-settings.schema';
import { PushSubscription, PushSubscriptionSchema } from './schemas/push-subscription.schema';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { NotificationsSchedulerService } from './notifications-scheduler.service';
import { PushService } from './push.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: NotificationSettings.name, schema: NotificationSettingsSchema },
      { name: PushSubscription.name, schema: PushSubscriptionSchema },
      { name: Entry.name, schema: EntrySchema },
      { name: WaterLog.name, schema: WaterLogSchema },
      { name: UserStats.name, schema: UserStatsSchema },
    ]),
  ],
  controllers: [NotificationsController],
  providers: [PushService, NotificationsService, NotificationsSchedulerService],
  exports: [PushService],
})
export class NotificationsModule {}
