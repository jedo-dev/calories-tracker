import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SocialController, LeaderboardController, FeedController } from './social.controller';
import { SocialService } from './social.service';
import { AchievementsController } from './achievements.controller';
import { AchievementsService } from './achievements.service';
import { UserStats, UserStatsSchema } from './schemas/user-stats.schema';
import { ActivityEvent, ActivityEventSchema } from './schemas/activity-event.schema';
import { Follow, FollowSchema } from './schemas/follow.schema';
import { Achievement, AchievementSchema } from './schemas/achievement.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { Entry, EntrySchema } from '../entries/schemas/entry.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: UserStats.name, schema: UserStatsSchema },
      { name: ActivityEvent.name, schema: ActivityEventSchema },
      { name: Follow.name, schema: FollowSchema },
      { name: Achievement.name, schema: AchievementSchema },
      { name: User.name, schema: UserSchema },
      { name: Entry.name, schema: EntrySchema },
    ]),
  ],
  controllers: [SocialController, LeaderboardController, FeedController, AchievementsController],
  providers: [SocialService, AchievementsService],
  exports: [SocialService, AchievementsService],
})
export class SocialModule {}
