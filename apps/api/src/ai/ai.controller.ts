import { Body, Controller, Get, Post, Request, ValidationPipe } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AiQuotaService } from './ai-quota.service';
import { AiService } from './ai.service';
import { FoodPhotoDto } from './dto/food-photo.dto';
import { RedeemPromoDto } from './dto/redeem-promo.dto';

@Controller('ai')
export class AiController {
  constructor(
    private readonly aiService: AiService,
    private readonly quotaService: AiQuotaService,
  ) {}

  // Токены AI-провайдера платные: даже в рамках квоты не даём дёргать
  // распознавание в цикле
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  @Post('food-photo')
  async recognizeFoodPhoto(@Body(ValidationPipe) dto: FoodPhotoDto, @Request() req: any) {
    // Сначала списываем лимит: не даём бесплатно жечь токены провайдера.
    // Если распознавание упало по вине провайдера — возвращаем попытку.
    const source = await this.quotaService.consumeOne(req.user.id);
    try {
      return await this.aiService.recognizeFoodPhoto(dto.imageBase64, dto.mediaType);
    } catch (err) {
      await this.refundSilently(req.user.id, source);
      throw err;
    }
  }

  @Get('quota')
  async getQuota(@Request() req: any) {
    return this.quotaService.getQuota(req.user.id);
  }

  // Промокоды не должны перебираться брутфорсом
  @Throttle({ default: { ttl: 15 * 60_000, limit: 10 } })
  @Post('promo')
  async redeemPromo(@Body(ValidationPipe) dto: RedeemPromoDto, @Request() req: any) {
    return this.quotaService.redeemPromo(req.user.id, dto.code);
  }

  private async refundSilently(userId: string, source: 'free' | 'bonus') {
    try {
      await this.quotaService.refundOne(userId, source);
    } catch {
      // возврат не критичен
    }
  }
}
