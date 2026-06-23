import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  ValidationPipe,
} from '@nestjs/common';
import { EntriesService } from './entries.service';
import { CreateEntryDto } from './dto/create-entry.dto';
import { UpdateEntryDto } from './dto/update-entry.dto';
import { QueryEntriesDto } from './dto/query-entries.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('entries')
@UseGuards(JwtAuthGuard)
export class EntriesController {
  constructor(private entriesService: EntriesService) {}

  @Get()
  async findAll(@Query(ValidationPipe) query: QueryEntriesDto, @Request() req: any) {
    return this.entriesService.listByDate(query.date, req.user.id);
  }

  @Get('recent')
  async getRecent(@Request() req: any) {
    return this.entriesService.getRecentEntries(req.user.id, 5);
  }

  @Get(':id')
  async findById(@Param('id') id: string, @Request() req: any) {
    return this.entriesService.getById(id, req.user.id);
  }

  @Post()
  async create(@Body(ValidationPipe) createEntryDto: CreateEntryDto, @Request() req: any) {
    return this.entriesService.create(createEntryDto, req.user.id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body(ValidationPipe) updateEntryDto: UpdateEntryDto,
    @Request() req: any,
  ) {
    return this.entriesService.update(id, updateEntryDto, req.user.id);
  }

  @Delete(':id')
  async delete(@Param('id') id: string, @Request() req: any) {
    await this.entriesService.delete(id, req.user.id);
    return { ok: true };
  }
}

