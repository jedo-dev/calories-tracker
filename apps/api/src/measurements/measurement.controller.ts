import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { MeasurementService } from './measurement.service';
import { SaveMeasurementDto } from './dto/save-measurement.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('measurements')
@UseGuards(JwtAuthGuard)
export class MeasurementController {
  constructor(private service: MeasurementService) {}

  @Post()
  async save(@Body() body: SaveMeasurementDto, @Request() req: any) {
    return this.service.save(req.user.id, body.date, body);
  }

  @Get()
  async getHistory(@Query('limit') limit: string, @Request() req: any) {
    return this.service.getHistory(req.user.id, limit ? parseInt(limit, 10) : 90);
  }

  @Delete(':id')
  async delete(@Param('id') id: string, @Request() req: any) {
    await this.service.delete(id, req.user.id);
    return { ok: true };
  }
}
