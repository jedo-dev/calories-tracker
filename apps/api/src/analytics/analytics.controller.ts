import { Body, Controller, Get, Post, Query, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { AnalyticsService } from './analytics.service';

@Controller('analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AnalyticsController {
  constructor(private analyticsService: AnalyticsService) {}

  @Post('events')
  ingest(@Body() body: any, @Request() req: any) {
    return this.analyticsService.ingest(req.user.id, body?.events);
  }

  @Get('summary')
  @Roles('admin')
  summary(@Query('days') days?: string) {
    return this.analyticsService.summary(days);
  }
}
