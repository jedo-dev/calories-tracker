import { BadRequestException, Body, Controller, Logger, Post, Request, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { MailService } from '../mail/mail.service';

// Пределы, чтобы письмо не раздували мусором с клиента
const MAX_MESSAGE = 2000;
const MAX_ERRORS = 20;
const MAX_ERROR_LEN = 400;

@Controller('feedback')
@UseGuards(JwtAuthGuard)
export class FeedbackController {
  private readonly logger = new Logger(FeedbackController.name);

  constructor(private mailService: MailService) {}

  @Post()
  @Throttle({ default: { ttl: 15 * 60_000, limit: 5 } })
  async send(@Body() body: any, @Request() req: any) {
    const message = String(body?.message || '').trim();
    if (message.length < 5) {
      throw new BadRequestException('Опишите проблему чуть подробнее');
    }
    if (message.length > MAX_MESSAGE) {
      throw new BadRequestException('Слишком длинное сообщение');
    }

    const meta = body?.meta || {};
    const errors: string[] = Array.isArray(meta.errors)
      ? meta.errors.slice(-MAX_ERRORS).map((e: any) => String(e).slice(0, MAX_ERROR_LEN))
      : [];
    const diagnostics = [
      `url: ${String(meta.url || '—').slice(0, 300)}`,
      `userAgent: ${String(meta.userAgent || '—').slice(0, 300)}`,
      errors.length ? `Последние ошибки:\n${errors.join('\n')}` : 'Ошибок в буфере нет',
    ].join('\n');
 this.logger.warn(`Фидбек от ${req.user.id} (почта не отправлена):\n${message}\n${diagnostics}`);
    
    const sent = await this.mailService.sendFeedbackEmail(
      { id: req.user.id, email: req.user.email, name: req.user.name },
      message,
      diagnostics,
    );
    // Без SMTP (dev) фидбек не должен пропадать молча — хотя бы в лог сервера
    if (!sent) {
      this.logger.warn(`Фидбек от ${req.user.id} (почта не отправлена):\n${message}\n${diagnostics}`);
    }
    return { ok: true };
  }
}
