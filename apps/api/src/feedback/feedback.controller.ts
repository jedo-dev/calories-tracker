import {
  BadRequestException,
  Body,
  Controller,
  Logger,
  Post,
  Request,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { MailService } from '../mail/mail.service';

// Пределы, чтобы письмо не раздували мусором с клиента
const MAX_MESSAGE = 2000;
const MAX_ERRORS = 20;
const MAX_ERROR_LEN = 400;

// Вложения (скрины/видео бага) идут прямо в письмо, поэтому лимиты жёсткие:
// почтовые сервера обычно режут письма больше ~25 МБ.
export const FEEDBACK_MAX_FILES = 5;
export const FEEDBACK_MAX_FILE_SIZE = 10 * 1024 * 1024;
export const FEEDBACK_MAX_TOTAL_SIZE = 20 * 1024 * 1024;
const ALLOWED_MIME = /^(image\/(jpeg|png|webp|gif|heic|heif)|video\/(mp4|quicktime|webm))$/;

@Controller('feedback')
@UseGuards(JwtAuthGuard)
export class FeedbackController {
  private readonly logger = new Logger(FeedbackController.name);

  constructor(private mailService: MailService) {}

  @Post()
  @Throttle({ default: { ttl: 15 * 60_000, limit: 5 } })
  @UseInterceptors(
    FilesInterceptor('files', FEEDBACK_MAX_FILES, {
      limits: { fileSize: FEEDBACK_MAX_FILE_SIZE, files: FEEDBACK_MAX_FILES },
      fileFilter: (_req, file, cb) => {
        if (ALLOWED_MIME.test(file.mimetype)) cb(null, true);
        else cb(new BadRequestException('Можно прикладывать только фото и видео'), false);
      },
    }),
  )
  async send(
    @Body() body: any,
    @UploadedFiles() files: Express.Multer.File[] | undefined,
    @Request() req: any,
  ) {
    const message = String(body?.message || '').trim();
    if (message.length < 5) {
      throw new BadRequestException('Опишите проблему чуть подробнее');
    }
    if (message.length > MAX_MESSAGE) {
      throw new BadRequestException('Слишком длинное сообщение');
    }

    const attachments = files || [];
    const totalSize = attachments.reduce((sum, f) => sum + f.size, 0);
    if (totalSize > FEEDBACK_MAX_TOTAL_SIZE) {
      throw new BadRequestException('Вложения слишком большие: суммарно не больше 20 МБ');
    }

    // Из multipart meta приходит JSON-строкой; из старого JSON-клиента — объектом
    let meta: any = body?.meta || {};
    if (typeof meta === 'string') {
      try {
        meta = JSON.parse(meta);
      } catch {
        meta = {};
      }
    }
    const errors: string[] = Array.isArray(meta.errors)
      ? meta.errors.slice(-MAX_ERRORS).map((e: any) => String(e).slice(0, MAX_ERROR_LEN))
      : [];
    const diagnostics = [
      `url: ${String(meta.url || '—').slice(0, 300)}`,
      `userAgent: ${String(meta.userAgent || '—').slice(0, 300)}`,
      attachments.length
        ? `Вложения: ${attachments.map((f) => `${f.originalname} (${Math.round(f.size / 1024)} КБ)`).join(', ')}`
        : 'Вложений нет',
      errors.length ? `Последние ошибки:\n${errors.join('\n')}` : 'Ошибок в буфере нет',
    ].join('\n');

    const sent = await this.mailService.sendFeedbackEmail(
      { id: req.user.id, email: req.user.email, name: req.user.name },
      message,
      diagnostics,
      attachments.map((f, i) => ({
        // Имя файла с клиента не доверяем — только расширение
        filename: `attachment-${i + 1}${extensionOf(f.originalname, f.mimetype)}`,
        content: f.buffer,
        contentType: f.mimetype,
      })),
    );
    // Без SMTP (dev) фидбек не должен пропадать молча — хотя бы в лог сервера
    if (!sent) {
      this.logger.warn(`Фидбек от ${req.user.id} (почта не отправлена):\n${message}\n${diagnostics}`);
    }
    return { ok: true };
  }
}

function extensionOf(name: string, mimetype: string): string {
  const m = /\.[a-z0-9]{1,5}$/i.exec(name || '');
  if (m) return m[0].toLowerCase();
  const byMime: Record<string, string> = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp',
    'image/gif': '.gif',
    'image/heic': '.heic',
    'image/heif': '.heif',
    'video/mp4': '.mp4',
    'video/quicktime': '.mov',
    'video/webm': '.webm',
  };
  return byMime[mimetype] || '';
}
