import { Controller, Get, Post, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { TemplateService } from './template.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('templates')
@UseGuards(JwtAuthGuard)
export class TemplateController {
  constructor(private templateService: TemplateService) {}

  @Get()
  async list(@Request() req: any) {
    return this.templateService.list(req.user.id);
  }

  @Post()
  async create(
    @Body() body: { name: string; items: any[]; mealType?: string },
    @Request() req: any,
  ) {
    return this.templateService.create(req.user.id, body.name, body.items, body.mealType);
  }

  @Post('from-entries')
  async createFromEntries(
    @Body() body: { name: string; entries: any[]; mealType?: string },
    @Request() req: any,
  ) {
    return this.templateService.createFromEntries(req.user.id, body.name, body.entries, body.mealType);
  }

  @Delete(':id')
  async delete(@Param('id') id: string, @Request() req: any) {
    await this.templateService.delete(id, req.user.id);
    return { ok: true };
  }
}
