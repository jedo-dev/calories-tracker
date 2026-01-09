import { Controller, Get, Query, UseGuards, Request, ValidationPipe } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Entry, EntryDocument } from '../entries/schemas/entry.schema';
import { QueryStatsDto } from './dto/query-stats.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('stats')
@UseGuards(JwtAuthGuard)
export class StatsController {
  constructor(@InjectModel(Entry.name) private entryModel: Model<EntryDocument>) {}

  private round(value: number): number {
    return Math.round(value * 100) / 100;
  }

  @Get('day')
  async getDayStats(@Query(ValidationPipe) query: QueryStatsDto, @Request() req: any) {
    const entries = await this.entryModel
      .find({
        userId: new Types.ObjectId(req.user.id),
        date: query.date,
      })
      .exec();

    const totals = entries.reduce(
      (acc, entry) => ({
        kcal: acc.kcal + entry.kcal,
        protein: acc.protein + entry.protein,
        fat: acc.fat + entry.fat,
        carb: acc.carb + entry.carb,
      }),
      { kcal: 0, protein: 0, fat: 0, carb: 0 },
    );

    return {
      date: query.date,
      totals: {
        kcal: this.round(totals.kcal),
        protein: this.round(totals.protein),
        fat: this.round(totals.fat),
        carb: this.round(totals.carb),
      },
      entriesCount: entries.length,
    };
  }
}

