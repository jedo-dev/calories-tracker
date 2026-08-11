import { BadRequestException, Body, Controller, Get, NotFoundException, Param, Post, Request, UseGuards } from '@nestjs/common';
import { SocialService } from './social.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { UserStats, UserStatsDocument } from './schemas/user-stats.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import { Follow, FollowDocument } from './schemas/follow.schema';
import { ActivityEvent, ActivityEventDocument } from './schemas/activity-event.schema';

@Controller('social')
@UseGuards(JwtAuthGuard)
export class SocialController {
  constructor(
    private socialService: SocialService,
    @InjectModel(UserStats.name) private userStatsModel: Model<UserStatsDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Follow.name) private followModel: Model<FollowDocument>,
    @InjectModel(ActivityEvent.name) private activityEventModel: Model<ActivityEventDocument>,
  ) {}

  @Get('me')
  async getMe(@Request() req: any) {
    const user = await this.userModel.findById(req.user.id).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const stats = await this.socialService.ensureUserStats(req.user.id);
    this.socialService.maybeResetWeek(stats);
    
    return {
      user: {
        id: user._id.toString(),
        username: user.username,
        displayName: user.displayName || user.firstName || user.username || 'User',
        avatarEmoji: user.avatarEmoji || '🦊',
        createdAt:user.createdAt,
      },
      stats: {
        xpTotal: stats.xpTotal,
        xpWeek: stats.xpWeek,
        weekKey: stats.weekKey,
        currentStreak: stats.currentStreak,
        bestStreak: stats.bestStreak,
        lastLoggedDate: stats.lastLoggedDate,
      },
    };
  }
}

@Controller('leaderboard')
@UseGuards(JwtAuthGuard)
export class LeaderboardController {
  constructor(
    @InjectModel(UserStats.name) private userStatsModel: Model<UserStatsDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Follow.name) private followModel: Model<FollowDocument>,
    private socialService: SocialService,
  ) {}

  private getLeague(xpTotal: number): { name: string; color: string; minXP: number; maxXP: number } {
    if (xpTotal >= 1000) return { name: 'Diamond', color: '#B9F2FF', minXP: 1000, maxXP: Infinity };
    if (xpTotal >= 500) return { name: 'Gold', color: '#FFD700', minXP: 500, maxXP: 1000 };
    if (xpTotal >= 200) return { name: 'Silver', color: '#C0C0C0', minXP: 200, maxXP: 500 };
    return { name: 'Bronze', color: '#CD7F32', minXP: 0, maxXP: 200 };
  }

  @Get('week/global')
  async getGlobalLeaderboard(@Request() req: any) {
    const weekKey = this.socialService.getWeekKey();
    // Берём с запасом (x3): приватные профили отфильтровываются после populate
    // и раньше «съедали» места в топ-50.
    const statsList = await this.userStatsModel
      .find({ weekKey })
      .sort({ xpWeek: -1, updatedAt: -1 })
      .limit(150)
      .populate('userId', 'displayName username firstName avatarEmoji isPublicProfile')
      .exec();

    const publicStats = statsList
      .filter((s: any) => {
        const user = s.userId;
        return user && user.isPublicProfile !== false;
      })
      .slice(0, 50)
      .map((s: any, index: number) => {
        const user = s.userId;
        return {
          rank: index + 1,
          user: {
            id: user._id.toString(),
            displayName: user.displayName || user.firstName || user.username || 'User',
            username: user.username,
            avatarEmoji: user.avatarEmoji || '🦊',
          },
          xpWeek: s.xpWeek,
        };
      });

    const myStats = statsList.find((s: any) => s.userId._id.toString() === req.user.id);
    let me = null;
    if (myStats) {
      const myRank = publicStats.findIndex((s: any) => s.user.id === req.user.id) + 1;
      if (myRank > 0) {
        const league = this.getLeague(myStats.xpTotal || 0);
        const nextLeagueXP = league.maxXP === Infinity ? null : league.maxXP;
        const progress = league.maxXP === Infinity ? 100 : Math.round(((myStats.xpTotal - league.minXP) / (league.maxXP - league.minXP)) * 100);
        me = {
          rank: myRank,
          xpWeek: myStats.xpWeek,
          xpTotal: myStats.xpTotal || 0,
          league,
          nextLeagueXP,
          progress,
        };
      }
    }

    return {
      weekKey,
      me,
      items: publicStats,
    };
  }

  @Get('week/friends')
  async getFriendsLeaderboard(@Request() req: any) {
    const weekKey = this.socialService.getWeekKey();
    const followingIds = await this.followModel
      .find({ followerId: new Types.ObjectId(req.user.id) })
      .distinct('followingId')
      .exec();

    const userIds = [new Types.ObjectId(req.user.id), ...followingIds];

    const statsList = await this.userStatsModel
      .find({
        userId: { $in: userIds },
        weekKey,
      })
      .sort({ xpWeek: -1, updatedAt: -1 })
      .populate('userId', 'displayName username firstName avatarEmoji isPublicProfile')
      .exec();

    const publicStats = statsList
      .filter((s: any) => {
        const user = s.userId;
        return user && user.isPublicProfile !== false;
      })
      .map((s: any, index: number) => {
        const user = s.userId;
        return {
          rank: index + 1,
          user: {
            id: user._id.toString(),
            displayName: user.displayName || user.firstName || user.username || 'User',
            username: user.username,
            avatarEmoji: user.avatarEmoji || '🦊',
          },
          xpWeek: s.xpWeek,
        };
      });

    const myStats = statsList.find((s: any) => s.userId._id.toString() === req.user.id);
    let me = null;
    if (myStats) {
      const myRank = publicStats.findIndex((s: any) => s.user.id === req.user.id) + 1;
      if (myRank > 0) {
        const league = this.getLeague(myStats.xpTotal || 0);
        const nextLeagueXP = league.maxXP === Infinity ? null : league.maxXP;
        const progress = league.maxXP === Infinity ? 100 : Math.round(((myStats.xpTotal - league.minXP) / (league.maxXP - league.minXP)) * 100);
        me = {
          rank: myRank,
          xpWeek: myStats.xpWeek,
          xpTotal: myStats.xpTotal || 0,
          league,
          nextLeagueXP,
          progress,
        };
      }
    }

    return {
      weekKey,
      me,
      items: publicStats,
    };
  }
}

@Controller('feed')
@UseGuards(JwtAuthGuard)
export class FeedController {
  constructor(
    @InjectModel(Follow.name) private followModel: Model<FollowDocument>,
    @InjectModel(ActivityEvent.name) private activityEventModel: Model<ActivityEventDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  @Get()
  async getFeed(@Request() req: any) {
    const followingIds = await this.followModel
      .find({ followerId: new Types.ObjectId(req.user.id) })
      .distinct('followingId')
      .exec();

    if (followingIds.length === 0) {
      return [];
    }

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const events = await this.activityEventModel
      .find({
        userId: { $in: followingIds },
        createdAt: { $gte: sevenDaysAgo },
        // Служебные события лайков (и легаси-лайки под видом публикаций) — не для ленты.
        type: { $ne: 'recipe_like' },
        'payload.isLike': { $ne: true },
      })
      .sort({ createdAt: -1 })
      .limit(50)
      .populate('userId', 'displayName username firstName avatarEmoji isPublicProfile')
      .exec();

    return events
      .filter((e: any) => {
        const user = e.userId;
        return user && user.isPublicProfile !== false;
      })
      .map((e: any) => {
        const user = e.userId;
        return {
          id: e._id.toString(),
          type: e.type,
          date: e.date,
          user: {
            id: user._id.toString(),
            displayName: user.displayName || user.firstName || user.username || 'User',
            avatarEmoji: user.avatarEmoji || '🦊',
          },
          payload: e.payload,
          reactions: e.reactions || {},
          createdAt: e.createdAt,
        };
      });
  }

  @Post(':eventId/react')
  async reactToEvent(@Param('eventId') eventId: string, @Body() body: { emoji: string }, @Request() req: any) {
    const { emoji } = body;
    if (!emoji || !['🔥', '💪', '👏'].includes(emoji)) {
      throw new BadRequestException('Invalid emoji');
    }

    const event = await this.activityEventModel.findById(eventId).exec();
    if (!event) {
      throw new NotFoundException('Event not found');
    }

    if (!event.reactions) {
      event.reactions = {};
    }

    const userId = req.user.id;
    const currentReactions = event.reactions[emoji] || [];

    const userIndex = currentReactions.indexOf(userId);
    if (userIndex >= 0) {
      currentReactions.splice(userIndex, 1);
    } else {
      currentReactions.push(userId);
    }

    event.reactions[emoji] = currentReactions;
    await event.save();

    return { ok: true, reactions: event.reactions };
  }
}
