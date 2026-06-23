import { Controller, Get, Post, Body, Query, UseGuards, Request } from '@nestjs/common';
import { WeightService } from './weight.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('weight')
@UseGuards(JwtAuthGuard)
export class WeightController {
  constructor(private weightService: WeightService) {}

  @Post()
  async log(@Body() body: { date: string; weightKg: number }, @Request() req: any) {
    return this.weightService.log(req.user.id, body.date, body.weightKg);
  }

  @Get()
  async getHistory(@Query('limit') limit: string, @Request() req: any) {
    const limitNum = limit ? parseInt(limit, 10) : 90;
    return this.weightService.getHistory(req.user.id, limitNum);
  }

  @Get('latest')
  async getLatest(@Request() req: any) {
    return this.weightService.getLatest(req.user.id);
  }

  @Get('prediction')
  async getPrediction(@Request() req: any) {
    return this.weightService.getPrediction(req.user.id);
  }
}
