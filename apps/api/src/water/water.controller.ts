import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { WaterService } from './water.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('water')
@UseGuards(JwtAuthGuard)
export class WaterController {
  constructor(private waterService: WaterService) {}

  @Get()
  async get(@Query('date') date: string, @Request() req: any) {
    return this.waterService.getByDate(req.user.id, date);
  }

  @Post()
  async add(@Body() body: { date: string; amountMl: number }, @Request() req: any) {
    return this.waterService.add(req.user.id, body.date, body.amountMl);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req: any) {
    await this.waterService.removeLog(id, req.user.id);
    return { ok: true };
  }
}
