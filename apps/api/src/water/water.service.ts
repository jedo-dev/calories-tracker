import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { WaterLog, WaterLogDocument } from './schemas/water-log.schema';
import { ActivityEvent, ActivityEventDocument } from '../social/schemas/activity-event.schema';

@Injectable()
export class WaterService {
  constructor(
    @InjectModel(WaterLog.name) private waterModel: Model<WaterLogDocument>,
    @InjectModel(ActivityEvent.name) private activityEventModel: Model<ActivityEventDocument>,
  ) {}

  async add(userId: string, date: string, amountMl: number): Promise<WaterLogDocument> {
    const log = new this.waterModel({
      userId: new Types.ObjectId(userId),
      date,
      amountMl,
    });
    const saved = await log.save();

    const logs = await this.waterModel
      .find({ userId: new Types.ObjectId(userId), date })
      .exec();
    const totalMl = logs.reduce((sum, l) => sum + l.amountMl, 0);

    if (totalMl >= 2000) {
      const existingEvent = await this.activityEventModel.findOne({
        userId: new Types.ObjectId(userId),
        type: 'water_goal',
        date,
      }).exec();

      if (!existingEvent) {
        await this.activityEventModel.create({
          userId: new Types.ObjectId(userId),
          type: 'water_goal',
          date,
          payload: { totalMl },
        });
      }
    }

    return saved;
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
