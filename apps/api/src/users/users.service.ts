import { Injectable, NotFoundException, ForbiddenException, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { UserStats, UserStatsDocument } from '../social/schemas/user-stats.schema';
import { ActivityEvent, ActivityEventDocument } from '../social/schemas/activity-event.schema';
import { Follow, FollowDocument } from '../social/schemas/follow.schema';

@Injectable()
export class UsersService implements OnModuleInit {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(UserStats.name) private userStatsModel: Model<UserStatsDocument>,
    @InjectModel(ActivityEvent.name) private activityEventModel: Model<ActivityEventDocument>,
    @InjectModel(Follow.name) private followModel: Model<FollowDocument>,
  ) {}

  async onModuleInit() {
    await this.userModel
      .updateMany({ tgUserId: null }, { $unset: { tgUserId: '' } })
      .exec();

    try {
      await this.userModel.collection.dropIndex('tgUserId_1');
    } catch (error: any) {
      if (error?.codeName !== 'IndexNotFound') {
        throw error;
      }
    }

    await this.userModel.collection.createIndex(
      { tgUserId: 1 },
      {
        unique: true,
        partialFilterExpression: {
          tgUserId: { $type: 'number' },
        },
      },
    );
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email }).exec();
  }

  async findByTgUserId(tgUserId: number): Promise<UserDocument | null> {
    return this.userModel.findOne({ tgUserId }).exec();
  }

  async create(data: {
    email: string;
    password: string;
    username?: string;
    firstName?: string;
    lastName?: string;
  }): Promise<UserDocument> {
    const user = new this.userModel(data);
    return user.save();
  }

  async createOrUpdate(
    tgUserId: number,
    data: {
      username?: string;
      firstName?: string;
      lastName?: string;
    },
  ): Promise<UserDocument> {
    return this.userModel
      .findOneAndUpdate(
        { tgUserId },
        {
          tgUserId,
          ...data,
        },
        { upsert: true, new: true },
      )
      .exec();
  }

  async findById(id: string): Promise<UserDocument | null> {
    return this.userModel.findById(id).exec();
  }

  private getLeague(xpTotal: number): { name: string; color: string; minXP: number; maxXP: number } {
    if (xpTotal >= 1000) return { name: 'Diamond', color: '#B9F2FF', minXP: 1000, maxXP: Infinity };
    if (xpTotal >= 500) return { name: 'Gold', color: '#FFD700', minXP: 500, maxXP: 1000 };
    if (xpTotal >= 200) return { name: 'Silver', color: '#C0C0C0', minXP: 200, maxXP: 500 };
    return { name: 'Bronze', color: '#CD7F32', minXP: 0, maxXP: 200 };
  }

  async getPublicProfile(userId: string, currentUserId: string) {
    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isSelf = userId === currentUserId;
    if (user.isPublicProfile === false && !isSelf) {
      throw new ForbiddenException('Profile is private');
    }

    const stats = await this.userStatsModel.findOne({ userId: new Types.ObjectId(userId) }).exec();
    const league = this.getLeague(stats?.xpTotal || 0);

    const followDoc = await this.followModel.findOne({
      followerId: new Types.ObjectId(currentUserId),
      followingId: new Types.ObjectId(userId),
    }).exec();
    const isFollowing = !!followDoc;

    const recentEvents = await this.activityEventModel
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .limit(10)
      .exec();

    const publicEvents = recentEvents.map((e: any) => ({
      id: e._id.toString(),
      type: e.type,
      date: e.date,
      payload: e.payload,
      createdAt: e.createdAt,
    }));

    return {
      id: user._id.toString(),
      username: user.username,
      displayName: user.displayName || user.firstName || user.username || 'User',
      avatarEmoji: user.avatarEmoji || '🦊',
      isPublicProfile: user.isPublicProfile !== false,
      league,
      xpTotal: stats?.xpTotal || 0,
      xpWeek: stats?.xpWeek || 0,
      currentStreak: stats?.currentStreak || 0,
      bestStreak: stats?.bestStreak || 0,
      isFollowing,
      isSelf,
      recentEvents: publicEvents,
    };
  }
}

