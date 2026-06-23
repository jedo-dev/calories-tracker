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
    
    // Filter outliers: remove values that differ more than 10% from median
    const weights = sorted.map(e => e.weightKg).sort((a, b) => a - b);
    const median = weights[Math.floor(weights.length / 2)];
    const filtered = sorted.filter(e => {
      const deviation = Math.abs(e.weightKg - median) / median;
      return deviation < 0.1; // Allow max 10% deviation
    });

    // Also filter by daily change: max 2kg per day
    const cleanEntries: typeof sorted = [filtered[0]];
    for (let i = 1; i < filtered.length; i++) {
      const prev = cleanEntries[cleanEntries.length - 1];
      const curr = filtered[i];
      const dayDiff = Math.abs(
        (new Date(curr.date).getTime() - new Date(prev.date).getTime()) / (1000 * 60 * 60 * 24)
      );
      const weightDiff = Math.abs(curr.weightKg - prev.weightKg);
      const dailyChange = dayDiff > 0 ? weightDiff / dayDiff : 0;
      
      if (dailyChange <= 2) { // Max 2kg per day change
        cleanEntries.push(curr);
      }
    }

    if (cleanEntries.length < 2) {
      return { available: false, reason: 'Not enough valid data after filtering outliers' };
    }

    const latest = cleanEntries[cleanEntries.length - 1];
    const currentWeight = latest.weightKg;
    const targetWeight = user.profile.targetWeightKg;
    const startWeight = user.profile.startWeightKg || cleanEntries[0].weightKg;

    const hasOutliers = cleanEntries.length < sorted.length;
    const outlierWarning = hasOutliers ? 'Обнаружены неточные данные. Прогноз может быть менее точным.' : null;

    const weightDiff = currentWeight - cleanEntries[0].weightKg;
    const daysDiff = cleanEntries.length > 1 
      ? (new Date(cleanEntries[cleanEntries.length - 1].date).getTime() - new Date(cleanEntries[0].date).getTime()) / (1000 * 60 * 60 * 24)
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
      daysTracked: cleanEntries.length,
      outlierWarning,
    };
  }
}
