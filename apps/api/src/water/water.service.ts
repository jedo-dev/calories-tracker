import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { WaterLog, WaterLogDocument } from './schemas/water-log.schema';
import { ActivityEvent, ActivityEventDocument } from '../social/schemas/activity-event.schema';
import { SocialService } from '../social/social.service';
import { User, UserDocument } from '../users/schemas/user.schema';

// Дневная норма воды от веса: 30 мл/кг, шаг 250, пределы 1500–4000.
// Формула продублирована на фронте (widgets/water/waterGoal.ts).
export function calcWaterGoalMl(weightKg?: number | null): number {
  if (!weightKg || weightKg <= 0) return 2000;
  const rounded = Math.round((weightKg * 30) / 250) * 250;
  return Math.min(4000, Math.max(1500, rounded));
}

@Injectable()
export class WaterService {
  constructor(
    @InjectModel(WaterLog.name) private waterModel: Model<WaterLogDocument>,
    @InjectModel(ActivityEvent.name) private activityEventModel: Model<ActivityEventDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private socialService: SocialService,
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

    const user = await this.userModel.findById(userId).select('profile.weightKg').exec();
    const goalMl = calcWaterGoalMl(user?.profile?.weightKg);

    if (totalMl >= goalMl) {
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
          payload: { totalMl, xp: 3 },
        });
        // «Закройте норму воды — +3 XP» (обещание из подсказок лиги);
        // начисляется один раз в день вместе с созданием события.
        await this.socialService.grantXpForWaterGoal(userId);
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
