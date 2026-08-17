import { BadRequestException, Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { UsersService } from '../users/users.service';
import { MailService } from '../mail/mail.service';

interface TelegramInitData {
  query_id?: string;
  user?: string;
  auth_date: string;
  hash: string;
  [key: string]: string | undefined;
}

interface TelegramUser {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
}

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private mailService: MailService,
  ) {}

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  /**
   * Выдаёт пользователю токен активации и шлёт письмо со ссылкой.
   * Без настроенного SMTP почта считается подтверждённой сразу — dev и
   * ранний прод не должны блокировать регистрацию.
   */
  private async issueVerification(user: any): Promise<void> {
    if (!this.mailService.isConfigured) {
      user.emailVerified = true;
      await user.save();
      return;
    }
    const token = crypto.randomBytes(32).toString('hex');
    user.verifyTokenHash = this.hashToken(token);
    user.verifyTokenExpires = new Date(Date.now() + 24 * 3600_000);
    await user.save();

    const appUrl = (this.configService.get<string>('APP_URL') || 'http://localhost:5173').replace(/\/$/, '');
    const link = `${appUrl}/verify-email?token=${token}`;
    // Fire-and-forget: медленный SMTP не должен задерживать ответ регистрации
    void this.mailService.sendVerificationEmail(
      user.email,
      link,
      user.displayName || user.firstName || user.username,
    );
  }

  async verifyEmail(token: string) {
    if (!token || typeof token !== 'string' || token.length > 128) {
      throw new BadRequestException('Некорректная ссылка активации');
    }
    const user = await this.usersService.findByVerifyTokenHash(this.hashToken(token));
    if (!user || !user.verifyTokenExpires || user.verifyTokenExpires < new Date()) {
      throw new BadRequestException('Ссылка активации недействительна или устарела');
    }
    user.emailVerified = true;
    user.verifyTokenHash = undefined;
    user.verifyTokenExpires = undefined;
    await user.save();
    return { ok: true };
  }

  /**
   * Запрос сброса пароля. Всегда отвечает ok — по ответу нельзя выяснить,
   * зарегистрирован ли email (user enumeration).
   */
  async forgotPassword(email: string) {
    const user = await this.usersService.findByEmail(email);
    if (user && this.mailService.isConfigured) {
      const token = crypto.randomBytes(32).toString('hex');
      user.resetTokenHash = this.hashToken(token);
      user.resetTokenExpires = new Date(Date.now() + 60 * 60_000);
      await user.save();

      const appUrl = (this.configService.get<string>('APP_URL') || 'http://localhost:5173').replace(/\/$/, '');
      const link = `${appUrl}/reset-password?token=${token}`;
      void this.mailService.sendPasswordResetEmail(
        user.email,
        link,
        user.displayName || user.username,
      );
    }
    return { ok: true };
  }

  async resetPassword(token: string, password: string) {
    if (!token || typeof token !== 'string' || token.length > 128) {
      throw new BadRequestException('Некорректная ссылка сброса');
    }
    const user = await this.usersService.findByResetTokenHash(this.hashToken(token));
    if (!user || !user.resetTokenExpires || user.resetTokenExpires < new Date()) {
      throw new BadRequestException('Ссылка сброса недействительна или устарела');
    }
    user.password = await bcrypt.hash(password, 10);
    user.resetTokenHash = undefined;
    user.resetTokenExpires = undefined;
    // Пароль сменён по ссылке из письма — значит, почта подтверждена
    user.emailVerified = true;
    await user.save();
    return { ok: true };
  }

  async resendVerification(userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) throw new UnauthorizedException();
    if (user.emailVerified) return { ok: true, alreadyVerified: true };
    await this.issueVerification(user);
    return { ok: true };
  }

  async register(email: string, password: string, username?: string) {
    const existing = await this.usersService.findByEmail(email);
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await this.usersService.create({
      email,
      password: hashedPassword,
      username: username || email.split('@')[0],
    });

    await this.issueVerification(user);

    const payload = { sub: user._id.toString(), email: user.email };
    const token = this.jwtService.sign(payload);

    return {
      token,
      user: {
        id: user._id.toString(),
        email: user.email,
        username: user.username,
      },
    };
  }

  async login(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Неверный email или пароль');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Неверный email или пароль');
    }

    const payload = { sub: user._id.toString(), email: user.email };
    const token = this.jwtService.sign(payload);

    return {
      token,
      user: {
        id: user._id.toString(),
        email: user.email,
        username: user.username,
      },
    };
  }

  async verifyTelegramInitData(initData: string): Promise<TelegramUser> {
    const botToken = this.configService.get<string>('TELEGRAM_BOT_TOKEN');
    if (!botToken) {
      throw new UnauthorizedException('TELEGRAM_BOT_TOKEN not configured');
    }

    const urlParams = new URLSearchParams(initData);
    const hash = urlParams.get('hash');
    if (!hash) {
      throw new UnauthorizedException('Invalid initData: missing hash');
    }

    urlParams.delete('hash');

    const dataCheckString = Array.from(urlParams.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');

    const secretKey = crypto
      .createHmac('sha256', 'WebAppData')
      .update(botToken)
      .digest();

    const calculatedHash = crypto
      .createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex');

    if (calculatedHash !== hash) {
      throw new UnauthorizedException('Invalid initData: hash mismatch');
    }

    const authDate = parseInt(urlParams.get('auth_date') || '0', 10);
    const now = Math.floor(Date.now() / 1000);
    const hoursDiff = (now - authDate) / 3600;

    if (hoursDiff > 24) {
      throw new UnauthorizedException('InitData expired (older than 24 hours)');
    }

    const userStr = urlParams.get('user');
    if (!userStr) {
      throw new UnauthorizedException('Invalid initData: missing user');
    }

    const user: TelegramUser = JSON.parse(userStr);
    return user;
  }

  async loginWithTelegram(initData: string) {
    const telegramUser = await this.verifyTelegramInitData(initData);

    const user = await this.usersService.createOrUpdate(telegramUser.id, {
      username: telegramUser.username,
      firstName: telegramUser.first_name,
      lastName: telegramUser.last_name,
    });

    const payload = { sub: user._id.toString(), tgUserId: user.tgUserId };
    const token = this.jwtService.sign(payload);

    return {
      token,
      user: {
        id: user._id.toString(),
        tgUserId: user.tgUserId,
        username: user.username,
      },
    };
  }

  async validateUser(userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      return null;
    }
    return {
      id: user._id.toString(),
      email: user.email,
      tgUserId: user.tgUserId,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role || 'user',
      emailVerified: user.emailVerified !== false,
    };
  }
}
