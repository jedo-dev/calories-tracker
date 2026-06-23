import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User, UserSchema } from './schemas/user.schema';
import { UserStats, UserStatsSchema } from '../social/schemas/user-stats.schema';
import { ActivityEvent, ActivityEventSchema } from '../social/schemas/activity-event.schema';
import { Follow, FollowSchema } from '../social/schemas/follow.schema';
import { FriendsModule } from '../friends/friends.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: UserStats.name, schema: UserStatsSchema },
      { name: ActivityEvent.name, schema: ActivityEventSchema },
      { name: Follow.name, schema: FollowSchema },
    ]),
    FriendsModule,
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}

