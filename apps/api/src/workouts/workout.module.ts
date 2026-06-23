import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { WorkoutService } from './workout.service';
import { WorkoutController } from './workout.controller';
import { WorkoutCategory, WorkoutCategorySchema } from './schemas/workout-category.schema';
import { Exercise, ExerciseSchema } from './schemas/exercise.schema';
import { WorkoutSession, WorkoutSessionSchema } from './schemas/workout-session.schema';
import { WorkoutLog, WorkoutLogSchema } from './schemas/workout-log.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { ActivityEvent, ActivityEventSchema } from '../social/schemas/activity-event.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: WorkoutCategory.name, schema: WorkoutCategorySchema },
      { name: Exercise.name, schema: ExerciseSchema },
      { name: WorkoutSession.name, schema: WorkoutSessionSchema },
      { name: WorkoutLog.name, schema: WorkoutLogSchema },
      { name: User.name, schema: UserSchema },
      { name: ActivityEvent.name, schema: ActivityEventSchema },
    ]),
  ],
  controllers: [WorkoutController],
  providers: [WorkoutService],
  exports: [WorkoutService],
})
export class WorkoutModule {}
