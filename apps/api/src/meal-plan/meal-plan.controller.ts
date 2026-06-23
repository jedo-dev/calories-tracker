import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Request,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { MealPlanService } from './meal-plan.service';
import { GenerateMealPlanDto } from './dto/generate-meal-plan.dto';
import { ReplaceItemDto } from './dto/replace-item.dto';

@Controller('meal-plans')
@UseGuards(JwtAuthGuard)
export class MealPlanController {
  constructor(private mealPlanService: MealPlanService) {}

  @Post('generate')
  async generate(@Body(ValidationPipe) dto: GenerateMealPlanDto, @Request() req: any) {
    return this.mealPlanService.generate(req.user.id, dto);
  }

  @Get()
  async list(@Request() req: any) {
    return this.mealPlanService.list(req.user.id);
  }

  @Get(':id')
  async findById(@Param('id') id: string, @Request() req: any) {
    return this.mealPlanService.findById(id, req.user.id);
  }

  @Post(':id/apply')
  async apply(@Param('id') id: string, @Request() req: any) {
    return this.mealPlanService.apply(id, req.user.id);
  }

  @Post(':id/archive')
  async archive(@Param('id') id: string, @Request() req: any) {
    await this.mealPlanService.archive(id, req.user.id);
    return { ok: true };
  }

  @Post(':id/replace-item')
  async replaceItem(
    @Param('id') id: string,
    @Body(ValidationPipe) dto: ReplaceItemDto,
    @Request() req: any,
  ) {
    return this.mealPlanService.replaceItem(id, req.user.id, dto);
  }

  @Post(':id/save-template')
  async saveTemplate(
    @Param('id') id: string,
    @Body('dayIndex') dayIndex: number,
    @Request() req: any,
  ) {
    return this.mealPlanService.saveAsTemplate(id, req.user.id, dayIndex || 0);
  }
}
