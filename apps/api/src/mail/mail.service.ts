import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { CONFIRM_ACCOUNT_HTML, CONFIRM_ACCOUNT_TEXT } from './templates/confirm-account';

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
    return this.configService.get<string>('MAIL_FROM') || 'FlareonFit <no-reply@flareonfit.app>';
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
      await this.transporter.sendMail({
        from: this.from,
        to,
        replyTo: this.supportEmail,
        subject: 'Аккаунт FlareonFit почти готов',
        text: render(CONFIRM_ACCOUNT_TEXT, vars),
        html: render(CONFIRM_ACCOUNT_HTML, vars),
      });
      return true;
    } catch (err: any) {
      this.logger.warn(`Не удалось отправить письмо на ${to}: ${err?.message}`);
      return false;
    }
  }
}
