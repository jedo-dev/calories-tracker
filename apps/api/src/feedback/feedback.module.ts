import { Module } from '@nestjs/common';
import { FeedbackController } from './feedback.controller';

// Фидбек-кнопка: принимает текст беды + диагностику с клиента и шлёт
// письмом на SUPPORT_EMAIL через глобальный MailService
@Module({
  controllers: [FeedbackController],
})
export class FeedbackModule {}
