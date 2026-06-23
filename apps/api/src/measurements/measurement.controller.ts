import { Controller, Get, Post, Body, Query, UseGuards, Request } from '@nestjs/common';
import { MeasurementService } from './measurement.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('measurements')
@UseGuards(JwtAuthGuard)
export class MeasurementController {
  constructor(private service: MeasurementService) {}

  @Post()
  async save(@Body() body: { date: string; waistCm?: number; hipsCm?: number; chestCm?: number; bicepCm?: number; thighCm?: number }, @Request() req: any) {
    return this.service.save(req.user.id, body.date, body);
  }

  @Get()
  async getHistory(@Query('limit') limit: string, @Request() req: any) {
    return this.service.getHistory(req.user.id, limit ? parseInt(limit, 10) : 90);
  }
}
