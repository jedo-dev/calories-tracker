import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { StatsController } from './stats.controller';
import { Entry, EntrySchema } from '../entries/schemas/entry.schema';
import { WorkoutSession, WorkoutSessionSchema } from '../workouts/schemas/workout-session.schema';
import { WeightLog, WeightLogSchema } from '../weight/schemas/weight-log.schema';
import { WaterLog, WaterLogSchema } from '../water/schemas/water-log.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Entry.name, schema: EntrySchema },
      { name: WorkoutSession.name, schema: WorkoutSessionSchema },
      { name: WeightLog.name, schema: WeightLogSchema },
      { name: WaterLog.name, schema: WaterLogSchema },
    ]),
  ],
  controllers: [StatsController],
})
export class StatsModule {}
