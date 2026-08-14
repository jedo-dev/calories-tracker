import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../users/schemas/user.schema';
import { PremiumCode, PremiumCodeDocument } from './schemas/premium-code.schema';

// Тарифы показываются на пейволле; платёжного провайдера пока нет,
// поэтому цены — витрина + замер спроса (fake door), а выдача — коды/админ.
export const PREMIUM_PLANS = [
  { id: 'month', title: 'Месяц', priceRub: 199, days: 30 },
  { id: 'year', title: 'Год', priceRub: 1490, days: 365 },
];

@Injectable()
export class PremiumService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(PremiumCode.name) private codeModel: Model<PremiumCodeDocument>,
  ) {}

  async isPremium(userId: string): Promise<boolean> {
    const user = await this.userModel.findById(userId, { premiumUntil: 1 }).lean();
    return !!user?.premiumUntil && user.premiumUntil > new Date();
  }

  async getStatus(userId: string) {
    const user = await this.userModel.findById(userId, { premiumUntil: 1 }).lean();
    const premiumUntil = user?.premiumUntil ?? null;
    return {
      premium: !!premiumUntil && premiumUntil > new Date(),
      premiumUntil,
      plans: PREMIUM_PLANS,
    };
  }

  /**
   * Продлевает подписку на N дней: от текущего конца, если она активна,
   * иначе — от сегодняшнего дня. Единая точка для кодов, админа и будущей платёжки.
   */
  async grantDays(userId: string, days: number) {
    if (!Number.isFinite(days) || days === 0) {
      throw new BadRequestException('Некорректное число дней');
    }
    const user = await this.userModel.findById(userId, { premiumUntil: 1 }).lean();
    if (!user) throw new NotFoundException('Пользователь не найден');
    const now = Date.now();
    const base =
      user.premiumUntil && user.premiumUntil.getTime() > now ? user.premiumUntil.getTime() : now;
    const premiumUntil = new Date(base + days * 24 * 3600_000);
    await this.userModel.updateOne({ _id: userId }, { $set: { premiumUntil } });
    return { premium: premiumUntil > new Date(), premiumUntil };
  }

  // Активация премиум-кода: та же анти-гоночная схема, что у AI-промокодов
  async redeemCode(userId: string, rawCode: string) {
    const code = (rawCode || '').trim().toUpperCase();
    if (!code) throw new BadRequestException('Введите код');

    const promo = await this.codeModel.findOne({ code }).lean();
    if (!promo) throw new NotFoundException('Код не найден');
    if (promo.expiresAt && promo.expiresAt < new Date()) {
      throw new BadRequestException('Срок действия кода истёк');
    }
    if (promo.usedBy?.includes(userId)) {
      throw new BadRequestException('Код уже активирован');
    }
    if (promo.maxUses > 0 && (promo.usedBy?.length ?? 0) >= promo.maxUses) {
      throw new BadRequestException('Лимит активаций кода исчерпан');
    }

    const claimed = await this.codeModel.findOneAndUpdate(
      {
        code,
        usedBy: { $ne: userId },
        ...(promo.maxUses > 0 ? { [`usedBy.${promo.maxUses - 1}`]: { $exists: false } } : {}),
      },
      { $push: { usedBy: userId } },
      { new: true },
    );
    if (!claimed) throw new BadRequestException('Код уже активирован');

    const result = await this.grantDays(userId, promo.days);
    return { addedDays: promo.days, ...result };
  }

  async createCode(body: any) {
    const code = String(body?.code || '').trim().toUpperCase();
    const days = Number(body?.days);
    if (!/^[A-Z0-9-]{4,32}$/.test(code)) {
      throw new BadRequestException('Код: 4–32 символа, латиница/цифры/дефис');
    }
    if (!Number.isFinite(days) || days < 1 || days > 3650) {
      throw new BadRequestException('Дней: от 1 до 3650');
    }
    const maxUses = Number.isFinite(Number(body?.maxUses)) ? Math.max(0, Number(body.maxUses)) : 1;
    const expiresAt = body?.expiresAt ? new Date(body.expiresAt) : undefined;
    try {
      await this.codeModel.create({ code, days, maxUses, expiresAt });
    } catch (err: any) {
      if (err?.code === 11000) throw new BadRequestException('Такой код уже существует');
      throw err;
    }
    return { ok: true, code, days, maxUses };
  }
}
