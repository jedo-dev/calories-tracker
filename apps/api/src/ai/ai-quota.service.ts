import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  AiBalance,
  AiBalanceDocument,
  AiPromoCode,
  AiPromoCodeDocument,
  AiQuota,
  AiQuotaDocument,
} from './schemas/ai-quota.schema';

export interface QuotaState {
  monthlyLimit: number;
  usedThisMonth: number;
  bonusTokens: number;
  remaining: number;
}

@Injectable()
export class AiQuotaService {
  constructor(
    @InjectModel(AiQuota.name) private quotaModel: Model<AiQuotaDocument>,
    @InjectModel(AiBalance.name) private balanceModel: Model<AiBalanceDocument>,
    @InjectModel(AiPromoCode.name) private promoModel: Model<AiPromoCodeDocument>,
    private readonly config: ConfigService,
  ) {}

  private get monthlyLimit(): number {
    const raw = Number(this.config.get<string>('AI_MONTHLY_LIMIT'));
    return Number.isFinite(raw) && raw > 0 ? raw : 10;
  }

  private currentMonth(): string {
    return new Date().toISOString().slice(0, 7); // YYYY-MM
  }

  async getQuota(userId: string): Promise<QuotaState> {
    const [quota, balance] = await Promise.all([
      this.quotaModel.findOne({ userId, month: this.currentMonth() }).lean(),
      this.balanceModel.findOne({ userId }).lean(),
    ]);
    const used = quota?.used ?? 0;
    const bonus = balance?.bonusTokens ?? 0;
    const limit = this.monthlyLimit;
    return {
      monthlyLimit: limit,
      usedThisMonth: used,
      bonusTokens: bonus,
      remaining: Math.max(0, limit - used) + bonus,
    };
  }

  // Списывает одно распознавание: сначала бесплатный месячный лимит, потом бонусы.
  // Возвращает источник списания (для возврата при сбое), бросает 403, если пусто.
  async consumeOne(userId: string): Promise<'free' | 'bonus'> {
    const month = this.currentMonth();
    const limit = this.monthlyLimit;

    // Атомарный инкремент в пределах бесплатного лимита
    const fromFree = await this.quotaModel.findOneAndUpdate(
      { userId, month, used: { $lt: limit } },
      { $inc: { used: 1 } },
      { new: true },
    );
    if (fromFree) return 'free';

    // Месячного документа может ещё не быть — создаём с used=1
    const created = await this.quotaModel
      .findOneAndUpdate(
        { userId, month },
        { $setOnInsert: { used: 1 } },
        { upsert: true, new: false },
      )
      .then((prev) => prev === null) // null = документ только что создан
      .catch(() => false); // гонка на unique-индексе — лимит уже занят
    if (created && limit > 0) return 'free';

    // Бесплатный лимит исчерпан — пробуем бонусные токены
    const fromBonus = await this.balanceModel.findOneAndUpdate(
      { userId, bonusTokens: { $gt: 0 } },
      { $inc: { bonusTokens: -1 } },
      { new: true },
    );
    if (fromBonus) return 'bonus';

    throw new ForbiddenException('AI_LIMIT_EXHAUSTED');
  }

  // Возврат списания, если распознавание упало по вине провайдера
  async refundOne(userId: string, source: 'free' | 'bonus'): Promise<void> {
    if (source === 'bonus') {
      await this.balanceModel.updateOne({ userId }, { $inc: { bonusTokens: 1 } });
      return;
    }
    await this.quotaModel.updateOne(
      { userId, month: this.currentMonth(), used: { $gt: 0 } },
      { $inc: { used: -1 } },
    );
  }

  async redeemPromo(userId: string, rawCode: string): Promise<{ addedTokens: number; quota: QuotaState }> {
    const code = rawCode.trim().toUpperCase();
    if (!code) throw new BadRequestException('Empty promo code');

    const promo = await this.promoModel.findOne({ code }).lean();
    if (!promo) throw new NotFoundException('PROMO_NOT_FOUND');
    if (promo.expiresAt && promo.expiresAt < new Date()) {
      throw new BadRequestException('PROMO_EXPIRED');
    }
    if (promo.usedBy?.includes(userId)) {
      throw new BadRequestException('PROMO_ALREADY_USED');
    }
    if (promo.maxUses > 0 && (promo.usedBy?.length ?? 0) >= promo.maxUses) {
      throw new BadRequestException('PROMO_LIMIT_REACHED');
    }

    // Атомарно занимаем слот активации (защита от даблкликов и гонок)
    const claimed = await this.promoModel.findOneAndUpdate(
      {
        code,
        usedBy: { $ne: userId },
        ...(promo.maxUses > 0 ? { [`usedBy.${promo.maxUses - 1}`]: { $exists: false } } : {}),
      },
      { $push: { usedBy: userId } },
      { new: true },
    );
    if (!claimed) throw new BadRequestException('PROMO_ALREADY_USED');

    await this.balanceModel.findOneAndUpdate(
      { userId },
      { $inc: { bonusTokens: promo.tokens } },
      { upsert: true },
    );

    return { addedTokens: promo.tokens, quota: await this.getQuota(userId) };
  }
}
