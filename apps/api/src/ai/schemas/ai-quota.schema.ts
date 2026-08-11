import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

// Использование бесплатного месячного лимита AI-распознаваний
export type AiQuotaDocument = AiQuota & Document;

@Schema({ timestamps: true })
export class AiQuota {
  @Prop({ required: true, index: true })
  userId: string;

  // Месяц в формате YYYY-MM — лимит сбрасывается сменой месяца
  @Prop({ required: true })
  month: string;

  @Prop({ default: 0 })
  used: number;
}

export const AiQuotaSchema = SchemaFactory.createForClass(AiQuota);
AiQuotaSchema.index({ userId: 1, month: 1 }, { unique: true });

// Бонусные токены (промокоды, награды) — не сгорают со сменой месяца
export type AiBalanceDocument = AiBalance & Document;

@Schema({ timestamps: true })
export class AiBalance {
  @Prop({ required: true, unique: true, index: true })
  userId: string;

  @Prop({ default: 0 })
  bonusTokens: number;
}

export const AiBalanceSchema = SchemaFactory.createForClass(AiBalance);

// Промокод на бонусные токены. Создаётся вручную в Mongo (см. docs/ai-quota.md)
export type AiPromoCodeDocument = AiPromoCode & Document;

@Schema({ timestamps: true })
export class AiPromoCode {
  // Хранится в верхнем регистре
  @Prop({ required: true, unique: true, index: true })
  code: string;

  @Prop({ required: true })
  tokens: number;

  // 0 = без ограничения по числу активаций
  @Prop({ default: 0 })
  maxUses: number;

  @Prop({ type: [String], default: [] })
  usedBy: string[];

  @Prop()
  expiresAt?: Date;
}

export const AiPromoCodeSchema = SchemaFactory.createForClass(AiPromoCode);
