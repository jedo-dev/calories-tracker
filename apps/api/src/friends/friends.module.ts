import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FriendsController } from './friends.controller';
import { FriendsService } from './friends.service';
import { Follow, FollowSchema } from '../social/schemas/follow.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { ActivityEvent, ActivityEventSchema } from '../social/schemas/activity-event.schema';
import { UserStats, UserStatsSchema } from '../social/schemas/user-stats.schema';
import { SocialModule } from '../social/social.module';

@Module({
  imports: [
    SocialModule,
    MongooseModule.forFeature([
      { name: Follow.name, schema: FollowSchema },
      { name: User.name, schema: UserSchema },
      { name: ActivityEvent.name, schema: ActivityEventSchema },
      { name: UserStats.name, schema: UserStatsSchema },
    ]),
  ],
  controllers: [FriendsController],
  providers: [FriendsService],
  exports: [FriendsService],
})
export class FriendsModule {}
