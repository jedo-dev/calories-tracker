import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { WeightLog, WeightLogDocument } from './schemas/weight-log.schema';

@Injectable()
export class WeightService {
  constructor(@InjectModel(WeightLog.name) private weightModel: Model<WeightLogDocument>) {}

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
}
