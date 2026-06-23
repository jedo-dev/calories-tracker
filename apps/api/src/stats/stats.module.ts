import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { StatsController } from './stats.controller';
import { Entry, EntrySchema } from '../entries/schemas/entry.schema';
import { WorkoutSession, WorkoutSessionSchema } from '../workouts/schemas/workout-session.schema';
import { WeightLog, WeightLogSchema } from '../weight/schemas/weight-log.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Entry.name, schema: EntrySchema },
      { name: WorkoutSession.name, schema: WorkoutSessionSchema },
      { name: WeightLog.name, schema: WeightLogSchema },
    ]),
  ],
  controllers: [StatsController],
})
export class StatsModule {}
