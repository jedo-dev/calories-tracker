import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../users/schemas/user.schema';

export interface ProfileData {
  weightKg?: number;
  heightCm?: number;
  age?: number;
  gender?: 'male' | 'female';
  activityLevel?: 'low' | 'medium' | 'high' | 'very_high';
  goal?: 'lose' | 'maintain' | 'gain';
}

export interface Targets {
  kcalTarget: number;
  proteinTargetG: number;
  fatTargetG: number;
  carbTargetG: number;
}

@Injectable()
export class ProfileService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async getProfile(userId: string): Promise<{ user: any; profile: ProfileData | null; targets: Targets | null }> {
    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new Error('User not found');
    }

    const profile = user.profile || null;
    const targets = profile && this.isProfileComplete(profile) ? this.calculateTargets(profile) : null;

    return {
      user: {
        id: user._id.toString(),
        username: user.username,
        displayName: user.displayName,
        avatarEmoji: user.avatarEmoji,
      },
      profile,
      targets,
    };
  }

  async updateProfile(userId: string, profileData: ProfileData): Promise<{ user: any; profile: ProfileData; targets: Targets | null }> {
    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new Error('User not found');
    }

    user.profile = {
      ...user.profile,
      ...profileData,
      updatedAt: new Date(),
    };

    await user.save();

    const profile = user.profile;
    const targets = this.isProfileComplete(profile) ? this.calculateTargets(profile) : null;

    return {
      user: {
        id: user._id.toString(),
        username: user.username,
        displayName: user.displayName,
        avatarEmoji: user.avatarEmoji,
      },
      profile,
      targets,
    };
  }

  private isProfileComplete(profile: ProfileData | undefined): boolean {
    if (!profile) return false;
    return !!(
      profile.weightKg &&
      profile.heightCm &&
      profile.age &&
      profile.gender &&
      profile.activityLevel &&
      profile.goal
    );
  }

  private calculateTargets(profile: ProfileData): Targets {
    const { weightKg, heightCm, age, gender, activityLevel, goal } = profile;

    if (!weightKg || !heightCm || !age || !gender || !activityLevel || !goal) {
      throw new Error('Profile incomplete');
    }

    // Mifflin-St Jeor BMR
    let bmr: number;
    if (gender === 'male') {
      bmr = 10 * weightKg + 6.25 * heightCm - 5 * age + 5;
    } else {
      bmr = 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
    }

    // Activity multiplier
    const multipliers: Record<string, number> = {
      low: 1.2,
      medium: 1.375,
      high: 1.55,
      very_high: 1.725,
    };

    const multiplier = multipliers[activityLevel] || 1.2;
    let tdee = bmr * multiplier;

    // Goal adjustment
    if (goal === 'lose') {
      tdee = tdee - 300;
    } else if (goal === 'gain') {
      tdee = tdee + 300;
    }

    // Clamp min target: 1200
    const kcalTarget = Math.max(1200, Math.round(tdee));

    // БЖУ targets
    const proteinTargetG = Math.round(weightKg * 1.6);
    const fatTargetG = Math.round(weightKg * 0.9);

    // Carbs: remaining calories
    const remainingKcal = kcalTarget - (proteinTargetG * 4 + fatTargetG * 9);
    const carbTargetG = Math.max(0, Math.round(remainingKcal / 4));

    return {
      kcalTarget,
      proteinTargetG,
      fatTargetG,
      carbTargetG,
    };
  }
}
