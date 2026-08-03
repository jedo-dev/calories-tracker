import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { UsersService } from '../users/users.service';

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
  ) {}

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
    };
  }
}
