import { Body, Controller, Get, Post, Query, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { parseLimit } from '../common/utils/query';
import { FastingService } from './fasting.service';

@Controller('fasting')
@UseGuards(JwtAuthGuard)
export class FastingController {
  constructor(private fastingService: FastingService) {}

  @Get('current')
  getCurrent(@Request() req: any) {
    return this.fastingService.getState(req.user.id);
  }

  @Post('start')
  start(@Body() body: any, @Request() req: any) {
    return this.fastingService.start(req.user.id, body?.targetHours);
  }

  @Post('stop')
  stop(@Request() req: any) {
    return this.fastingService.stop(req.user.id);
  }

  @Get('history')
  history(@Query('limit') limitRaw: string, @Request() req: any) {
    return this.fastingService.history(req.user.id, parseLimit(limitRaw, 30, 100));
  }
}
