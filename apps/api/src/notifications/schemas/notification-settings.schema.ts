import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type NotificationSettingsDocument = NotificationSettings & Document;

// Настройки пушей одного пользователя. Всё выключено по умолчанию (opt-in):
// enabled ставится в true только когда пользователь сам включил тумблер и
// выдал разрешение браузера. Типы уведомлений включены по умолчанию, но
// работают только при enabled=true.
@Schema({ timestamps: true })
export class NotificationSettings {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, unique: true, index: true })
  userId: Types.ObjectId;

  @Prop({ default: false })
  enabled: boolean;

  // Напоминания о еде: обед (если день пустой) и вечер (если день так и остался пустым)
  @Prop({ default: true })
  mealReminders: boolean;

  @Prop({ default: true })
  waterReminder: boolean;

  // «Стрик под угрозой» — вечером, если серия ≥ 2 дней и сегодня ничего не записано
  @Prop({ default: true })
  streakReminder: boolean;

  // Итоги недели, воскресенье вечером
  @Prop({ default: true })
  weeklyReport: boolean;

  // Тихие часы в локальном времени пользователя, HH:mm (интервал через полночь)
  @Prop({ default: '21:30' })
  quietFrom: string;

  @Prop({ default: '09:00' })
  quietTo: string;

  // Date.prototype.getTimezoneOffset() клиента (минуты, UTC − локальное время).
  // Обновляется при каждой подписке/сохранении настроек.
  @Prop({ default: 0 })
  tzOffsetMinutes: number;

  // Анти-спам: что уже отправляли в эту локальную дату (дневной лимит + дедуп по типу)
  @Prop()
  sentDate?: string;

  @Prop({ type: [String], default: [] })
  sentTypes: string[];
}

export const NotificationSettingsSchema = SchemaFactory.createForClass(NotificationSettings);
