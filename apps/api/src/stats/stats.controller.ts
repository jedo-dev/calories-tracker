import { Controller, Get, Query, UseGuards, Request, ValidationPipe } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Entry, EntryDocument } from '../entries/schemas/entry.schema';
import { WorkoutSession, WorkoutSessionDocument } from '../workouts/schemas/workout-session.schema';
import { WeightLog, WeightLogDocument } from '../weight/schemas/weight-log.schema';
import { QueryStatsDto } from './dto/query-stats.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('stats')
@UseGuards(JwtAuthGuard)
export class StatsController {
  constructor(
    @InjectModel(Entry.name) private entryModel: Model<EntryDocument>,
    @InjectModel(WorkoutSession.name) private sessionModel: Model<WorkoutSessionDocument>,
    @InjectModel(WeightLog.name) private weightModel: Model<WeightLogDocument>,
  ) {}

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

  @Get('range')
  async getRangeStats(
    @Query('from') from: string,
    @Query('to') to: string,
    @Request() req: any,
  ) {
    const userId = new Types.ObjectId(req.user.id);

    const allDates: string[] = [];
    const fromDate = new Date(from);
    const toDate = new Date(to);
    for (let d = new Date(fromDate); d <= toDate; d.setDate(d.getDate() + 1)) {
      allDates.push(d.toISOString().split('T')[0]);
    }

    const [entries, workouts, weightLogs] = await Promise.all([
      this.entryModel.find({ userId, date: { $in: allDates } }).exec(),
      this.sessionModel.find({ userId, date: { $in: allDates }, finishedAt: { $ne: null } }).exec(),
      this.weightModel.find({ userId, date: { $in: allDates } }).exec(),
    ]);

    const entriesByDate = new Map<string, EntryDocument[]>();
    for (const entry of entries) {
      const list = entriesByDate.get(entry.date) || [];
      list.push(entry);
      entriesByDate.set(entry.date, list);
    }

    const workoutsByDate = new Map<string, WorkoutSessionDocument[]>();
    for (const session of workouts) {
      const list = workoutsByDate.get(session.date) || [];
      list.push(session);
      workoutsByDate.set(session.date, list);
    }

    const weightByDate = new Map<string, number>();
    for (const log of weightLogs) {
      weightByDate.set(log.date, log.weightKg);
    }

    return allDates.map((date) => {
      const dayEntries = entriesByDate.get(date) || [];
      const dayWorkouts = workoutsByDate.get(date) || [];

      return {
        date,
        entries: dayEntries.map((e) => ({
          id: e._id.toString(),
          productName: e.productName,
          grams: e.grams,
          kcal: e.kcal,
          protein: e.protein,
          fat: e.fat,
          carb: e.carb,
        })),
        workouts: dayWorkouts.map((w) => ({
          id: w._id.toString(),
          name: w.name,
          totalCaloriesBurned: w.totalCaloriesBurned,
          totalDurationSec: w.totalDurationSec,
          exerciseCount: w.exerciseCount,
        })),
        weight: weightByDate.get(date) || null,
      };
    });
  }
}
