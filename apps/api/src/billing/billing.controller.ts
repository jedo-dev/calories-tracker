import { Body, Controller, Get, Param, Post, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { PremiumService } from './premium.service';

@Controller('billing')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BillingController {
  constructor(private premiumService: PremiumService) {}

  @Get('status')
  getStatus(@Request() req: any) {
    return this.premiumService.getStatus(req.user.id);
  }

  @Post('redeem')
  redeem(@Body() body: any, @Request() req: any) {
    return this.premiumService.redeemCode(req.user.id, body?.code);
  }

  // Админ: выдать/продлить подписку пользователю вручную
  @Post('grant/:userId')
  @Roles('admin')
  grant(@Param('userId') userId: string, @Body() body: any) {
    return this.premiumService.grantDays(userId, Number(body?.days));
  }

  // Админ: создать премиум-код (продажа вручную, подарки, промо)
  @Post('codes')
  @Roles('admin')
  createCode(@Body() body: any) {
    return this.premiumService.createCode(body);
  }
}
