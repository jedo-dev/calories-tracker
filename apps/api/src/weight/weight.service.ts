import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { WeightLog, WeightLogDocument } from './schemas/weight-log.schema';
import { User, UserDocument } from '../users/schemas/user.schema';

@Injectable()
export class WeightService {
  constructor(
    @InjectModel(WeightLog.name) private weightModel: Model<WeightLogDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async log(userId: string, date: string, weightKg: number): Promise<WeightLogDocument> {
    return this.weightModel.findOneAndUpdate(
      { userId: new Types.ObjectId(userId), date },
      { weightKg },
      { upsert: true, new: true },
    ).exec();
  }

  async getHistory(userId: string, limit = 90): Promise<WeightLogDocument[]> {
    return this.weightModel
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ date: -1 })
      .limit(limit)
      .exec();
  }

  async getLatest(userId: string): Promise<WeightLogDocument | null> {
    return this.weightModel
      .findOne({ userId: new Types.ObjectId(userId) })
      .sort({ date: -1 })
      .exec();
  }

  async getPrediction(userId: string): Promise<any> {
    const user = await this.userModel.findById(userId).exec();
    if (!user || !user.profile?.targetWeightKg) {
      return { available: false, reason: 'No target weight set' };
    }

    const entries = await this.weightModel
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ date: -1 })
      .limit(14)
      .exec();

    if (entries.length < 3) {
      return { available: false, reason: 'Need at least 3 weight entries' };
    }

    const sorted = entries.reverse();
    const latest = sorted[sorted.length - 1];
    const currentWeight = latest.weightKg;
    const targetWeight = user.profile.targetWeightKg;
    const startWeight = user.profile.startWeightKg || sorted[0].weightKg;

    const weightDiff = currentWeight - sorted[0].weightKg;
    const daysDiff = sorted.length > 1 
      ? (new Date(sorted[sorted.length - 1].date).getTime() - new Date(sorted[0].date).getTime()) / (1000 * 60 * 60 * 24)
      : 7;
    const weeklyTrend = daysDiff > 0 ? (weightDiff / daysDiff) * 7 : 0;

    const remainingWeight = targetWeight - currentWeight;
    const isGoalBelow = targetWeight < currentWeight;

    let estimatedDays: number | null = null;
    let estimatedDate: string | null = null;
    let pace: 'too_fast' | 'normal' | 'too_slow' | 'stalled' = 'normal';

    if (Math.abs(weeklyTrend) < 0.05) {
      pace = 'stalled';
      estimatedDays = null;
    } else {
      const movingInRightDirection = isGoalBelow ? weeklyTrend < 0 : weeklyTrend > 0;
      if (!movingInRightDirection) {
        pace = 'too_slow';
        estimatedDays = null;
      } else {
        estimatedDays = Math.round(Math.abs(remainingWeight / weeklyTrend) * 7);
        estimatedDate = new Date(Date.now() + estimatedDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

        if (Math.abs(weeklyTrend) > 1.0) {
          pace = 'too_fast';
        } else if (Math.abs(weeklyTrend) < 0.2) {
          pace = 'too_slow';
        } else {
          pace = 'normal';
        }
      }
    }

    const progressPct = startWeight && targetWeight
      ? Math.min(100, Math.round(Math.abs(startWeight - currentWeight) / Math.abs(startWeight - targetWeight) * 100))
      : 0;

    return {
      available: true,
      currentWeight,
      targetWeight,
      startWeight,
      weeklyTrend: Math.round(weeklyTrend * 100) / 100,
      pace,
      estimatedDays,
      estimatedDate,
      progressPct,
      daysTracked: entries.length,
    };
  }
}
