import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { SocialService } from '../social/social.service';
import { FastingSession, FastingSessionDocument } from './schemas/fasting-session.schema';

// XP за фаст, завершённый по цели, — в одном ряду с водой (+3) и тренировкой (+5)
const FASTING_XP = 5;
const MIN_TARGET_HOURS = 8;
const MAX_TARGET_HOURS = 48;

@Injectable()
export class FastingService {
  constructor(
    @InjectModel(FastingSession.name)
    private sessionModel: Model<FastingSessionDocument>,
    private socialService: SocialService,
  ) {}

  async getState(userId: string) {
    const active = await this.sessionModel
      .findOne({ userId: new Types.ObjectId(userId), endedAt: null })
      .lean();
    return {
      active: active
        ? {
            id: String(active._id),
            startedAt: active.startedAt,
            targetHours: active.targetHours,
          }
        : null,
      xpReward: FASTING_XP,
    };
  }

  async start(userId: string, targetHoursRaw: any) {
    const targetHours = Number(targetHoursRaw);
    if (
      !Number.isFinite(targetHours) ||
      targetHours < MIN_TARGET_HOURS ||
      targetHours > MAX_TARGET_HOURS
    ) {
      throw new BadRequestException(
        `Цель фаста — от ${MIN_TARGET_HOURS} до ${MAX_TARGET_HOURS} часов`,
      );
    }
    const existing = await this.sessionModel
      .findOne({ userId: new Types.ObjectId(userId), endedAt: null })
      .lean();
    if (existing) {
      throw new BadRequestException('Фаст уже запущен');
    }
    await this.sessionModel.create({
      userId: new Types.ObjectId(userId),
      startedAt: new Date(),
      targetHours,
      endedAt: null,
    });
    return this.getState(userId);
  }

  async stop(userId: string) {
    const now = new Date();
    // Атомарно: закрыть можно только ещё активную сессию, двойной stop не пройдёт
    const session = await this.sessionModel
      .findOneAndUpdate(
        { userId: new Types.ObjectId(userId), endedAt: null },
        { $set: { endedAt: now } },
        { new: true },
      )
      .exec();
    if (!session) {
      throw new BadRequestException('Нет активного фаста');
    }
    const elapsedHours = (now.getTime() - session.startedAt.getTime()) / 3600_000;
    const completed = elapsedHours >= session.targetHours;
    if (completed) {
      session.completed = true;
      await session.save();
      await this.socialService.addXp(userId, FASTING_XP);
    }
    return {
      completed,
      elapsedHours: Math.round(elapsedHours * 10) / 10,
      targetHours: session.targetHours,
      xpGranted: completed ? FASTING_XP : 0,
    };
  }

  async history(userId: string, limit = 30) {
    const sessions = await this.sessionModel
      .find({ userId: new Types.ObjectId(userId), endedAt: { $ne: null } })
      .sort({ startedAt: -1 })
      .limit(Math.min(100, limit))
      .lean();
    return sessions.map((s) => ({
      id: String(s._id),
      startedAt: s.startedAt,
      endedAt: s.endedAt,
      targetHours: s.targetHours,
      elapsedHours:
        s.endedAt != null
          ? Math.round(((s.endedAt.getTime() - s.startedAt.getTime()) / 3600_000) * 10) / 10
          : 0,
      completed: s.completed,
    }));
  }
}
