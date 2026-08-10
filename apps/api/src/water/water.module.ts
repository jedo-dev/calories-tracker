import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { WaterService } from './water.service';
import { WaterController } from './water.controller';
import { WaterLog, WaterLogSchema } from './schemas/water-log.schema';
import { ActivityEvent, ActivityEventSchema } from '../social/schemas/activity-event.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { SocialModule } from '../social/social.module';

@Module({
  imports: [
    SocialModule,
    MongooseModule.forFeature([
      { name: WaterLog.name, schema: WaterLogSchema },
      { name: ActivityEvent.name, schema: ActivityEventSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [WaterController],
  providers: [WaterService],
  exports: [WaterService],
})
export class WaterModule {}
