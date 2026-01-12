import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ActivityEvent, ActivityEventDocument } from '../social/schemas/activity-event.schema';
import { Follow, FollowDocument } from '../social/schemas/follow.schema';
import { User, UserDocument } from '../users/schemas/user.schema';

@Injectable()
export class FriendsService {
  constructor(
    @InjectModel(Follow.name) private followModel: Model<FollowDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(ActivityEvent.name) private activityEventModel: Model<ActivityEventDocument>,
  ) {}

  async searchUsers(query: string, currentUserId: string, limit: number = 20) {
    const searchRegex = new RegExp(query, 'i');
    const users = await this.userModel
      .find({
        _id: { $ne: new Types.ObjectId(currentUserId) },

        $or: [{ username: searchRegex }, { displayName: searchRegex }],
      })
      .limit(limit)
      .exec();
    console.log(`users`, users, searchRegex);
    const followingIds = await this.followModel
      .find({ followerId: new Types.ObjectId(currentUserId) })
      .distinct('followingId')
      .exec();

    const followingSet = new Set(followingIds.map((id) => id.toString()));

    return users.map((user) => ({
      id: user._id.toString(),
      username: user.username,
      displayName: user.displayName || user.firstName || user.username || 'User',
      avatarEmoji: user.avatarEmoji || '🦊',
      isFollowing: followingSet.has(user._id.toString()),
    }));
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

    return follows.map((follow) => {
      const user = follow.followingId as any;
      return {
        id: user._id.toString(),
        username: user.username,
        displayName: user.displayName || user.firstName || user.username || 'User',
        avatarEmoji: user.avatarEmoji || '🦊',
      };
    });
  }

  async getFollowers(userId: string, limit: number = 50) {
    const follows = await this.followModel
      .find({ followingId: new Types.ObjectId(userId) })
      .limit(limit)
      .populate('followerId', 'username displayName firstName avatarEmoji')
      .exec();

    return follows.map((follow) => {
      const user = follow.followerId as any;
      return {
        id: user._id.toString(),
        username: user.username,
        displayName: user.displayName || user.firstName || user.username || 'User',
        avatarEmoji: user.avatarEmoji || '🦊',
      };
    });
  }
}
