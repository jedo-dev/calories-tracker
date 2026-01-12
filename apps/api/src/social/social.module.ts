import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SocialController, LeaderboardController, FeedController } from './social.controller';
import { SocialService } from './social.service';
import { UserStats, UserStatsSchema } from './schemas/user-stats.schema';
import { ActivityEvent, ActivityEventSchema } from './schemas/activity-event.schema';
import { Follow, FollowSchema } from './schemas/follow.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { Entry, EntrySchema } from '../entries/schemas/entry.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: UserStats.name, schema: UserStatsSchema },
      { name: ActivityEvent.name, schema: ActivityEventSchema },
      { name: Follow.name, schema: FollowSchema },
      { name: User.name, schema: UserSchema },
      { name: Entry.name, schema: EntrySchema },
    ]),
  ],
  controllers: [SocialController, LeaderboardController, FeedController],
  providers: [SocialService],
  exports: [SocialService],
})
export class SocialModule {}
