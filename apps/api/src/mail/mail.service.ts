import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { CONFIRM_ACCOUNT_HTML, CONFIRM_ACCOUNT_TEXT } from './templates/confirm-account';
import { RESET_PASSWORD_HTML, RESET_PASSWORD_TEXT } from './templates/reset-password';

// Подстановка {{KEY}} → значение по всему шаблону
function render(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? '');
}

// Отправка почты через SMTP (env SMTP_*). Без настроек сервис молчит с
// warning — регистрация в dev не должна упираться в почтовый сервер.
@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor(private configService: ConfigService) {
    const host = this.configService.get<string>('SMTP_HOST');
    const user = this.configService.get<string>('SMTP_USER');
    const pass = this.configService.get<string>('SMTP_PASS');
    if (!host) {
      this.logger.warn('SMTP_HOST не задан — отправка писем отключена');
      return;
    }
    const port = Number(this.configService.get<string>('SMTP_PORT')) || 465;
    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: user && pass ? { user, pass } : undefined,
    });
  }

  get isConfigured(): boolean {
    return this.transporter !== null;
  }

  private get from(): string {
    const raw = this.configService.get<string>('MAIL_FROM') || 'FlareonFit <no-reply@flareonfit.app>';
    // В GitHub Secrets значение приходит буквально: обёрточные кавычки и
    // случайный \r\n из вставки ломают SMTP-команду MAIL FROM (555 5.5.2).
    // dotenv локально кавычки снимает сам, поэтому локально это не всплывает.
    return raw.replace(/[\r\n]/g, '').trim().replace(/^"(.*)"$/, '$1');
  }

  // Успешную отправку тоже пишем в лог: без этого «письмо не дошло» не
  // отличить от «письмо не отправлялось». accepted/rejected и ответ SMTP —
  // единственное, что видно с нашей стороны до попадания в ящик получателя.
  private logSent(info: nodemailer.SentMessageInfo): void {
    const to = Array.isArray(info.envelope?.to) ? info.envelope.to.join(', ') : '?';
    this.logger.log(
      `Письмо отправлено → ${to}; accepted=${JSON.stringify(info.accepted)} rejected=${JSON.stringify(info.rejected)} id=${info.messageId} smtp="${String(info.response || '').replace(/[\r\n]/g, ' ')}"`,
    );
  }

  private get supportEmail(): string {
    return this.configService.get<string>('SUPPORT_EMAIL') || 'megamanok99@gmail.com';
  }

  private get appUrl(): string {
    return (this.configService.get<string>('APP_URL') || 'http://localhost:5173').replace(/\/$/, '');
  }

  async sendVerificationEmail(to: string, link: string, userName?: string): Promise<boolean> {
    if (!this.transporter) return false;
    const vars = {
      USER_NAME: userName || 'друг',
      CONFIRM_URL: link,
      // Картинки письма лежат в статике web-приложения (public/email/) —
      // почтовым клиентам нужны абсолютные https-ссылки
      ASSETS: `${this.appUrl}/email`,
      SUPPORT_EMAIL: this.supportEmail,
      // Транзакционное письмо — «отписка» ведёт в настройки профиля
      UNSUBSCRIBE_URL: `${this.appUrl}/profile`,
    };
    try {
      const info = await this.transporter.sendMail({
        from: this.from,
        to,
        replyTo: this.supportEmail,
        subject: 'Аккаунт FlareonFit почти готов',
        text: render(CONFIRM_ACCOUNT_TEXT, vars),
        html: render(CONFIRM_ACCOUNT_HTML, vars),
      });
      this.logSent(info);
      return true;
    } catch (err: any) {
      this.logger.warn(`Не удалось отправить письмо на ${to}: ${err?.message}`);
      return false;
    }
  }

  /** Письмо фидбека от пользователя на почту поддержки (SUPPORT_EMAIL) */
  async sendFeedbackEmail(
    user: { id: string; email?: string; name?: string },
    message: string,
    diagnostics: string,
    attachments: { filename: string; content: Buffer; contentType: string }[] = [],
  ): Promise<boolean> {
    if (!this.transporter) return false;
    // Имя идёт в заголовок письма — переводы строк там запрещены SMTP
    const who = (user.name || user.email || user.id).replace(/[\r\n]/g, ' ').slice(0, 80);
    try {
      const info = await this.transporter.sendMail({
        from: this.from,
        to: this.supportEmail,
        replyTo: user.email || undefined,
        subject: `FlareonFit: фидбек от ${who}`,
        text: `${message}\n\n--- Диагностика ---\nuserId: ${user.id}\nemail: ${user.email || '—'}\n${diagnostics}`,
        attachments,
      });
      this.logSent(info);
      return true;
    } catch (err: any) {
      this.logger.warn(`Не удалось отправить фидбек: ${err?.message}`);
      return false;
    }
  }

  async sendPasswordResetEmail(to: string, link: string, userName?: string): Promise<boolean> {
    if (!this.transporter) return false;
    const vars = {
      USER_NAME: userName || 'друг',
      RESET_URL: link,
      SUPPORT_EMAIL: this.supportEmail,
    };
    try {
      const info = await this.transporter.sendMail({
        from: this.from,
        to,
        replyTo: this.supportEmail,
        subject: 'Сброс пароля — FlareonFit',
        text: render(RESET_PASSWORD_TEXT, vars),
        html: render(RESET_PASSWORD_HTML, vars),
      });
      this.logSent(info);
      return true;
    } catch (err: any) {
      this.logger.warn(`Не удалось отправить письмо на ${to}: ${err?.message}`);
      return false;
    }
  }
}
