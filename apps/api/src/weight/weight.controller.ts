import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { WeightService } from './weight.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { parseLimit } from '../common/utils/query';

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
    const limitNum = parseLimit(limit, 90);
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

  @Delete(':id')
  async delete(@Param('id') id: string, @Request() req: any) {
    await this.weightService.delete(id, req.user.id);
    return { ok: true };
  }
}
