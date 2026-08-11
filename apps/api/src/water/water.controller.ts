import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards, Request, BadRequestException } from '@nestjs/common';
import { WaterService } from './water.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { requireIsoDate } from '../common/utils/query';

@Controller('water')
@UseGuards(JwtAuthGuard)
export class WaterController {
  constructor(private waterService: WaterService) {}

  @Get()
  async get(@Query('date') date: string, @Request() req: any) {
    // Без даты Mongoose выбрасывал undefined из фильтра → отдавалась ВСЯ история.
    return this.waterService.getByDate(req.user.id, requireIsoDate(date));
  }

  @Post()
  async add(@Body() body: { date: string; amountMl: number }, @Request() req: any) {
    const amount = Number(body?.amountMl);
    if (!Number.isFinite(amount) || amount <= 0 || amount > 5000) {
      throw new BadRequestException('Некорректный объём воды');
    }
    return this.waterService.add(req.user.id, requireIsoDate(body?.date), amount);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req: any) {
    await this.waterService.removeLog(id, req.user.id);
    return { ok: true };
  }
}
