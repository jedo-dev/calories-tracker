import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Entry, EntryDocument } from '../entries/schemas/entry.schema';
import { ProfileService, Targets } from '../profile/profile.service';
import { User, UserDocument } from '../users/schemas/user.schema';

export interface DashboardData {
  date: string;
  consumed: {
    kcal: number;
    protein: number;
    fat: number;
    carb: number;
  };
  targets: Targets | null;
  progress: {
    kcalPct: number;
    proteinPct: number;
    fatPct: number;
    carbPct: number;
  } | null;
}

@Injectable()
export class DashboardService {
  constructor(
    @InjectModel(Entry.name) private entryModel: Model<EntryDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private profileService: ProfileService,
  ) {}

  async getDayDashboard(userId: string, date: string): Promise<DashboardData> {
    // Get consumed from entries
    const entries = await this.entryModel
      .find({
        userId: new Types.ObjectId(userId),
        date: date,
      })
      .exec();

    const consumed = entries.reduce(
      (acc, entry) => ({
        kcal: acc.kcal + entry.kcal,
        protein: acc.protein + entry.protein,
        fat: acc.fat + entry.fat,
        carb: acc.carb + entry.carb,
      }),
      { kcal: 0, protein: 0, fat: 0, carb: 0 },
    );

    // Round consumed values
    const round = (value: number) => Math.round(value * 100) / 100;
    const consumedRounded = {
      kcal: round(consumed.kcal),
      protein: round(consumed.protein),
      fat: round(consumed.fat),
      carb: round(consumed.carb),
    };

    // Get targets from profile
    const { targets } = await this.profileService.getProfile(userId);

    // Calculate progress
    let progress = null;
    if (targets) {
      progress = {
        kcalPct: Math.min(consumedRounded.kcal / targets.kcalTarget, 1),
        proteinPct: Math.min(consumedRounded.protein / targets.proteinTargetG, 1),
        fatPct: Math.min(consumedRounded.fat / targets.fatTargetG, 1),
        carbPct: Math.min(consumedRounded.carb / targets.carbTargetG, 1),
      };
    }

    return {
      date,
      consumed: consumedRounded,
      targets,
      progress,
    };
  }
}
