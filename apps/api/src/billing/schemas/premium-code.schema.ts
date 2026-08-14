import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

// Премиум-код на N дней подписки. Пока нет платёжного провайдера — это
// основной канал выдачи Plus (ручная продажа, подарки, промо). Создаётся
// админом через POST /billing/codes.
export type PremiumCodeDocument = PremiumCode & Document;

@Schema({ timestamps: true })
export class PremiumCode {
  // Хранится в верхнем регистре
  @Prop({ required: true, unique: true, index: true })
  code: string;

  @Prop({ required: true })
  days: number;

  // 0 = без ограничения по числу активаций
  @Prop({ default: 1 })
  maxUses: number;

  @Prop({ type: [String], default: [] })
  usedBy: string[];

  @Prop()
  expiresAt?: Date;
}

export const PremiumCodeSchema = SchemaFactory.createForClass(PremiumCode);
