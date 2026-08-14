import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AnalyticsEventDocument = AnalyticsEvent & Document;

// Сырое продуктовое событие. Храним 180 дней (TTL-индекс ниже) — дашборд
// считает агрегаты на лету, вечная история сырых событий не нужна.
@Schema()
export class AnalyticsEvent {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  // Имя события: page_view, app_open, push_enabled и т.п.
  @Prop({ required: true, index: true })
  name: string;

  // Локальная дата пользователя не нужна — для DAU/ретеншна достаточно UTC
  @Prop({ required: true, index: true })
  date: string; // YYYY-MM-DD (UTC)

  @Prop({ required: true })
  ts: Date;

  @Prop({ type: Object })
  props?: Record<string, any>;
}

export const AnalyticsEventSchema = SchemaFactory.createForClass(AnalyticsEvent);

// Основные запросы дашборда: события за период + уникальные пользователи по дням
AnalyticsEventSchema.index({ date: 1, userId: 1 });
AnalyticsEventSchema.index({ ts: 1 }, { expireAfterSeconds: 180 * 24 * 3600 });
