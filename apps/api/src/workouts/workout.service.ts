import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { WorkoutCategory, WorkoutCategoryDocument } from './schemas/workout-category.schema';
import { Exercise, ExerciseDocument } from './schemas/exercise.schema';
import { WorkoutSession, WorkoutSessionDocument } from './schemas/workout-session.schema';
import { WorkoutLog, WorkoutLogDocument } from './schemas/workout-log.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import { ActivityEvent, ActivityEventDocument } from '../social/schemas/activity-event.schema';
import { CreateWorkoutSessionDto } from './dto/create-workout-session.dto';
import { AddExerciseToSessionDto } from './dto/add-exercise.dto';

@Injectable()
export class WorkoutService {
  constructor(
    @InjectModel(WorkoutCategory.name) private categoryModel: Model<WorkoutCategoryDocument>,
    @InjectModel(Exercise.name) private exerciseModel: Model<ExerciseDocument>,
    @InjectModel(WorkoutSession.name) private sessionModel: Model<WorkoutSessionDocument>,
    @InjectModel(WorkoutLog.name) private logModel: Model<WorkoutLogDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(ActivityEvent.name) private activityEventModel: Model<ActivityEventDocument>,
  ) {}

  // Categories
  async getCategories(): Promise<WorkoutCategoryDocument[]> {
    return this.categoryModel.find().sort({ sortOrder: 1 }).exec();
  }

  // Exercises
  async getExercisesByCategory(categoryId?: string): Promise<ExerciseDocument[]> {
    const filter = categoryId ? { categoryId: new Types.ObjectId(categoryId) } : {};
    return this.exerciseModel.find(filter).sort({ name: 1 }).exec();
  }

  async getExerciseById(id: string): Promise<ExerciseDocument> {
    const exercise = await this.exerciseModel.findById(id).exec();
    if (!exercise) throw new NotFoundException('Exercise not found');
    return exercise;
  }

  // Sessions
  async createSession(dto: CreateWorkoutSessionDto, userId: string): Promise<WorkoutSessionDocument> {
    let categoryName: string | undefined;
    if (dto.categoryId) {
      const cat = await this.categoryModel.findById(dto.categoryId).exec();
      categoryName = cat?.name;
    }

    const session = new this.sessionModel({
      userId: new Types.ObjectId(userId),
      date: dto.date,
      categoryId: dto.categoryId ? new Types.ObjectId(dto.categoryId) : undefined,
      categoryName,
      name: dto.name || categoryName || 'Тренировка',
      startedAt: new Date(),
    });

    return session.save();
  }

  async getSessionById(sessionId: string, userId: string): Promise<WorkoutSessionDocument> {
    const session = await this.sessionModel.findById(sessionId).exec();
    if (!session) throw new NotFoundException('Session not found');
    if (session.userId.toString() !== userId) throw new ForbiddenException('Access denied');
    return session;
  }

  async getSessionsByDate(date: string, userId: string): Promise<WorkoutSessionDocument[]> {
    return this.sessionModel
      .find({ userId: new Types.ObjectId(userId), date })
      .sort({ createdAt: -1 })
      .exec();
  }

  async getSessionLogs(sessionId: string): Promise<WorkoutLogDocument[]> {
    return this.logModel.find({ sessionId: new Types.ObjectId(sessionId) }).sort({ createdAt: 1 }).exec();
  }

  async finishSession(sessionId: string, userId: string): Promise<WorkoutSessionDocument> {
    const session = await this.getSessionById(sessionId, userId);
    const logs = await this.logModel.find({ sessionId: new Types.ObjectId(sessionId) }).exec();

    const totalCalories = logs.reduce((sum, l) => sum + l.caloriesBurned, 0);
    const totalDuration = logs.reduce((sum, l) => sum + l.durationSec, 0);

    session.totalCaloriesBurned = Math.round(totalCalories * 100) / 100;
    session.totalDurationSec = totalDuration;
    session.exerciseCount = logs.length;
    session.finishedAt = new Date();

    const saved = await session.save();

    await this.activityEventModel.create({
      userId: new Types.ObjectId(userId),
      type: 'workout_completed',
      date: session.date,
      payload: {
        workoutName: session.name,
        caloriesBurned: saved.totalCaloriesBurned,
        durationSec: saved.totalDurationSec,
        exerciseCount: saved.exerciseCount,
      },
    });

    return saved;
  }

  async deleteSession(sessionId: string, userId: string): Promise<void> {
    const session = await this.getSessionById(sessionId, userId);
    await this.logModel.deleteMany({ sessionId: new Types.ObjectId(sessionId) }).exec();
    await session.deleteOne();
  }

  // Exercise logs
  async addExerciseToSession(
    sessionId: string,
    dto: AddExerciseToSessionDto,
    userId: string,
  ): Promise<WorkoutLogDocument> {
    const session = await this.getSessionById(sessionId, userId);
    const exercise = await this.exerciseModel.findById(dto.exerciseId).exec();
    if (!exercise) throw new NotFoundException('Exercise not found');

    const user = await this.userModel.findById(userId).exec();
    const userWeightKg = user?.profile?.weightKg || 70;

    const sets = dto.sets ?? exercise.defaultSets;
    const reps = dto.reps ?? exercise.defaultReps;
    const durationSec = dto.durationSec ?? (exercise.defaultDurationSec || this.estimateDuration(exercise.type, sets, reps));
    const caloriesBurned = this.calculateCalories(exercise.metValue, userWeightKg, durationSec);

    const log = new this.logModel({
      sessionId: new Types.ObjectId(sessionId),
      userId: new Types.ObjectId(userId),
      exerciseId: new Types.ObjectId(dto.exerciseId),
      exerciseName: exercise.name,
      gifUrl: exercise.gifUrl,
      sets,
      reps,
      weightKg: dto.weightKg || null,
      durationSec,
      caloriesBurned: Math.round(caloriesBurned * 100) / 100,
    });

    const saved = await log.save();

    // Update session totals
    const allLogs = await this.logModel.find({ sessionId: new Types.ObjectId(sessionId) }).exec();
    session.totalCaloriesBurned = Math.round(allLogs.reduce((s, l) => s + l.caloriesBurned, 0) * 100) / 100;
    session.totalDurationSec = allLogs.reduce((s, l) => s + l.durationSec, 0);
    session.exerciseCount = allLogs.length;
    await session.save();

    return saved;
  }

  async removeExerciseFromSession(logId: string, userId: string): Promise<void> {
    const log = await this.logModel.findById(logId).exec();
    if (!log) throw new NotFoundException('Log not found');
    if (log.userId.toString() !== userId) throw new ForbiddenException('Access denied');

    const sessionId = log.sessionId;
    await log.deleteOne();

    // Recalculate session totals
    const session = await this.sessionModel.findById(sessionId).exec();
    if (session) {
      const remainingLogs = await this.logModel.find({ sessionId }).exec();
      session.totalCaloriesBurned = Math.round(remainingLogs.reduce((s, l) => s + l.caloriesBurned, 0) * 100) / 100;
      session.totalDurationSec = remainingLogs.reduce((s, l) => s + l.durationSec, 0);
      session.exerciseCount = remainingLogs.length;
      await session.save();
    }
  }

  // History
  async getHistory(userId: string, limit = 30): Promise<WorkoutSessionDocument[]> {
    return this.sessionModel
      .find({ userId: new Types.ObjectId(userId), finishedAt: { $ne: null } })
      .sort({ finishedAt: -1 })
      .limit(limit)
      .exec();
  }

  // Calorie calculation: MET × weight(kg) × duration(hours)
  private calculateCalories(metValue: number, weightKg: number, durationSec: number): number {
    const durationHours = durationSec / 3600;
    return metValue * weightKg * durationHours;
  }

  // Estimate duration from sets/reps if not provided
  private estimateDuration(type: string, sets: number, reps: number): number {
    if (type === 'cardio') return 300; // 5 min default for cardio
    // ~3 sec per rep + 60 sec rest between sets
    return sets * reps * 3 + (sets - 1) * 60;
  }
}
