import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PushSubscriptionDocument = PushSubscription & Document;

// Одна браузерная подписка Web Push. У пользователя их может быть несколько
// (телефон + десктоп). endpoint уникален глобально — это ключ подписки в
// пуш-сервисе браузера.
@Schema({ timestamps: true })
export class PushSubscription {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ required: true, unique: true })
  endpoint: string;

  @Prop({ type: { p256dh: String, auth: String }, required: true, _id: false })
  keys: { p256dh: string; auth: string };

  @Prop()
  userAgent?: string;
}

export const PushSubscriptionSchema = SchemaFactory.createForClass(PushSubscription);
