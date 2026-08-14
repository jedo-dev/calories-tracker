import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type FastingSessionDocument = FastingSession & Document;

// Сессия интервального голодания. Активная сессия — endedAt == null,
// у пользователя может быть максимум одна активная.
@Schema({ timestamps: true })
export class FastingSession {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  startedAt: Date;

  // Цель в часах (16:8 → 16, 18:6 → 18 и т.д.)
  @Prop({ required: true })
  targetHours: number;

  @Prop({ type: Date, default: null })
  endedAt: Date | null;

  // Дотянул ли фаст до цели на момент завершения
  @Prop({ default: false })
  completed: boolean;
}

export const FastingSessionSchema = SchemaFactory.createForClass(FastingSession);

// Поиск активной сессии и история — основные запросы
FastingSessionSchema.index({ userId: 1, endedAt: 1 });
FastingSessionSchema.index({ userId: 1, startedAt: -1 });
