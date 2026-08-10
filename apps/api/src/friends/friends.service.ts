import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ActivityEvent, ActivityEventDocument } from '../social/schemas/activity-event.schema';
import { Follow, FollowDocument } from '../social/schemas/follow.schema';
import { UserStats, UserStatsDocument } from '../social/schemas/user-stats.schema';
import { User, UserDocument } from '../users/schemas/user.schema';

@Injectable()
export class FriendsService {
  constructor(
    @InjectModel(Follow.name) private followModel: Model<FollowDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(ActivityEvent.name) private activityEventModel: Model<ActivityEventDocument>,
    @InjectModel(UserStats.name) private userStatsModel: Model<UserStatsDocument>,
  ) {}

  private getLeague(xpTotal: number): { name: string; color: string } {
    if (xpTotal >= 1000) return { name: 'Diamond', color: '#B9F2FF' };
    if (xpTotal >= 500) return { name: 'Gold', color: '#FFD700' };
    if (xpTotal >= 200) return { name: 'Silver', color: '#C0C0C0' };
    return { name: 'Bronze', color: '#CD7F32' };
  }

  private async enrichWithStats(users: any[]) {
    const userIds = users.map((u) => new Types.ObjectId(u.id));
    const statsList = await this.userStatsModel
      .find({ userId: { $in: userIds } })
      .exec();
    const statsMap = new Map(statsList.map((s) => [s.userId.toString(), s]));

    return users.map((u) => {
      const stats = statsMap.get(u.id);
      const xpTotal = stats?.xpTotal || 0;
      return {
        ...u,
        xpWeek: stats?.xpWeek || 0,
        currentStreak: stats?.currentStreak || 0,
        league: this.getLeague(xpTotal),
      };
    });
  }

  async searchUsers(query: string, currentUserId: string, limit: number = 20) {
    // Экранируем спецсимволы: иначе regex-инъекция/ReDoS через строку поиска.
    const escaped = String(query ?? '').trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (!escaped) return [];
    const searchRegex = new RegExp(escaped, 'i');
    const users = await this.userModel
      .find({
        _id: { $ne: new Types.ObjectId(currentUserId) },

        $or: [{ username: searchRegex }, { displayName: searchRegex }],
      })
      .limit(limit)
      .exec();

    const followingIds = await this.followModel
      .find({ followerId: new Types.ObjectId(currentUserId) })
      .distinct('followingId')
      .exec();

    const followingSet = new Set(followingIds.map((id) => id.toString()));

    const baseUsers = users.map((user) => ({
      id: user._id.toString(),
      username: user.username,
      displayName: user.displayName || user.firstName || user.username || 'User',
      avatarEmoji: user.avatarEmoji || '🦊',
      isFollowing: followingSet.has(user._id.toString()),
    }));

    return this.enrichWithStats(baseUsers);
  }

  async follow(followerId: string, followingId: string): Promise<void> {
    if (followerId === followingId) {
      throw new Error('Cannot follow yourself');
    }

    const user = await this.userModel.findById(followingId).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const existing = await this.followModel
      .findOne({
        followerId: new Types.ObjectId(followerId),
        followingId: new Types.ObjectId(followingId),
      })
      .exec();

    if (!existing) {
      await this.followModel.create({
        followerId: new Types.ObjectId(followerId),
        followingId: new Types.ObjectId(followingId),
      });

      await this.activityEventModel.create({
        userId: new Types.ObjectId(followerId),
        type: 'follow',
        date: new Date().toISOString().split('T')[0],
        payload: { targetUserId: followingId },
      });
    }
  }

  async unfollow(followerId: string, followingId: string): Promise<void> {
    await this.followModel
      .deleteOne({
        followerId: new Types.ObjectId(followerId),
        followingId: new Types.ObjectId(followingId),
      })
      .exec();
  }

  async getFollowing(userId: string, limit: number = 50) {
    const follows = await this.followModel
      .find({ followerId: new Types.ObjectId(userId) })
      .limit(limit)
      .populate('followingId', 'username displayName firstName avatarEmoji')
      .exec();

    const baseUsers = follows.map((follow) => {
      const user = follow.followingId as any;
      return {
        id: user._id.toString(),
        username: user.username,
        displayName: user.displayName || user.firstName || user.username || 'User',
        avatarEmoji: user.avatarEmoji || '🦊',
      };
    });

    return this.enrichWithStats(baseUsers);
  }

  async getFollowers(userId: string, limit: number = 50) {
    const follows = await this.followModel
      .find({ followingId: new Types.ObjectId(userId) })
      .limit(limit)
      .populate('followerId', 'username displayName firstName avatarEmoji')
      .exec();

    const baseUsers = follows.map((follow) => {
      const user = follow.followerId as any;
      return {
        id: user._id.toString(),
        username: user.username,
        displayName: user.displayName || user.firstName || user.username || 'User',
        avatarEmoji: user.avatarEmoji || '🦊',
      };
    });

    return this.enrichWithStats(baseUsers);
  }
}
