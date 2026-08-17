import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Request,
  HttpException,
  HttpStatus,
  Ip,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Public } from '../common/decorators/public.decorator';

// Валидаторы обязательны: без них в findOne уходят объекты вида
// {"email":{"$ne":null}} (NoSQL-инъекция), а глобальный whitelist-пайп
// вырезал бы недекорированные поля.
class TelegramAuthDto {
  @IsString()
  @MaxLength(4096)
  initData: string;
}

class RegisterDto {
  @IsEmail()
  @MaxLength(254)
  email: string;

  @IsString()
  @MinLength(6)
  @MaxLength(128)
  password: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  username?: string;
}

class ForgotPasswordDto {
  @IsEmail()
  @MaxLength(254)
  email: string;
}

class ResetPasswordDto {
  @IsString()
  @MaxLength(128)
  token: string;

  @IsString()
  @MinLength(6)
  @MaxLength(128)
  password: string;
}

class LoginDto {
  @IsEmail()
  @MaxLength(254)
  email: string;

  @IsString()
  @MaxLength(128)
  password: string;
}

// Простейший in-memory rate-limit на брутфорс логина: 10 неудачных попыток
// на связку ip+email за 15 минут. Для одного инстанса API достаточно;
// при горизонтальном масштабировании заменить на Redis/Throttler.
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 10;
const failedAttempts = new Map<string, number[]>();

function checkRateLimit(key: string): void {
  const now = Date.now();
  const attempts = (failedAttempts.get(key) || []).filter((t) => now - t < WINDOW_MS);
  failedAttempts.set(key, attempts);
  if (attempts.length >= MAX_ATTEMPTS) {
    throw new HttpException(
      'Слишком много попыток входа. Попробуйте через 15 минут',
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }
}

function recordFailure(key: string): void {
  const attempts = failedAttempts.get(key) || [];
  attempts.push(Date.now());
  failedAttempts.set(key, attempts);
}

// Жёсткий лимит на весь auth: 30 запросов с IP за 15 минут. Дополняет
// точечный in-memory лимит логина по ip+email ниже (тот считает только
// неудачные попытки, этот — вообще все запросы к /auth/*).
@Throttle({ default: { ttl: 15 * 60_000, limit: 30 } })
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post('register')
  async register(@Body() body: RegisterDto) {
    return this.authService.register(body.email, body.password, body.username);
  }

  @Public()
  @Post('login')
  async login(@Body() body: LoginDto, @Ip() ip: string) {
    const key = `${ip}:${body.email.toLowerCase()}`;
    checkRateLimit(key);
    try {
      return await this.authService.login(body.email, body.password);
    } catch (err) {
      recordFailure(key);
      throw err;
    }
  }

  @Public()
  @Post('telegram')
  async loginWithTelegram(@Body() body: TelegramAuthDto) {
    return this.authService.loginWithTelegram(body.initData);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMe(@Request() req: any) {
    return req.user;
  }

  // Ещё жёстче общего лимита /auth: каждое письмо — работа SMTP
  @Throttle({ default: { ttl: 15 * 60_000, limit: 5 } })
  @Public()
  @Post('forgot-password')
  async forgotPassword(@Body() body: ForgotPasswordDto) {
    return this.authService.forgotPassword(body.email);
  }

  @Public()
  @Post('reset-password')
  async resetPassword(@Body() body: ResetPasswordDto) {
    return this.authService.resetPassword(body.token, body.password);
  }

  @Public()
  @Post('verify-email')
  async verifyEmail(@Body() body: any) {
    return this.authService.verifyEmail(body?.token);
  }

  @Post('resend-verification')
  @UseGuards(JwtAuthGuard)
  async resendVerification(@Request() req: any) {
    return this.authService.resendVerification(req.user.id);
  }
}
