import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { WaterLog, WaterLogDocument } from './schemas/water-log.schema';

@Injectable()
export class WaterService {
  constructor(@InjectModel(WaterLog.name) private waterModel: Model<WaterLogDocument>) {}

  async add(userId: string, date: string, amountMl: number): Promise<WaterLogDocument> {
    const log = new this.waterModel({
      userId: new Types.ObjectId(userId),
      date,
      amountMl,
    });
    return log.save();
  }

  async getByDate(userId: string, date: string): Promise<{ totalMl: number; logs: WaterLogDocument[] }> {
    const logs = await this.waterModel
      .find({ userId: new Types.ObjectId(userId), date })
      .sort({ createdAt: -1 })
      .exec();
    const totalMl = logs.reduce((sum, l) => sum + l.amountMl, 0);
    return { totalMl, logs };
  }

  async removeLog(logId: string, userId: string): Promise<void> {
    const log = await this.waterModel.findById(logId).exec();
    if (!log || log.userId.toString() !== userId) return;
    await log.deleteOne();
  }
}
