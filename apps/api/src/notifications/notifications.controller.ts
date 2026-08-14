import { Body, Controller, Delete, Get, Post, Put, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { NotificationsService } from './notifications.service';
import { PushService } from './push.service';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(
    private notificationsService: NotificationsService,
    private pushService: PushService,
  ) {}

  @Get('public-key')
  getPublicKey() {
    return { key: this.pushService.getPublicKey() };
  }

  @Get('settings')
  getSettings(@Request() req: any) {
    return this.notificationsService.getSettings(req.user.id);
  }

  @Put('settings')
  updateSettings(@Body() body: any, @Request() req: any) {
    return this.notificationsService.updateSettings(req.user.id, body);
  }

  @Post('subscribe')
  subscribe(@Body() body: any, @Request() req: any) {
    return this.notificationsService.subscribe(req.user.id, body);
  }

  @Delete('subscribe')
  unsubscribe(@Body() body: any, @Request() req: any) {
    return this.notificationsService.unsubscribe(req.user.id, body?.endpoint);
  }

  @Post('test')
  sendTest(@Request() req: any) {
    return this.notificationsService.sendTest(req.user.id);
  }
}
