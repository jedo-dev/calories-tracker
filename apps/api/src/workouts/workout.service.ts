import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { WorkoutCategory, WorkoutCategoryDocument } from './schemas/workout-category.schema';
import { Exercise, ExerciseDocument } from './schemas/exercise.schema';
import { WorkoutSession, WorkoutSessionDocument } from './schemas/workout-session.schema';
import { WorkoutLog, WorkoutLogDocument, WorkoutSetDetail } from './schemas/workout-log.schema';
import { WorkoutProgram, WorkoutProgramDocument, WorkoutProgramItem } from './schemas/workout-program.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import { ActivityEvent, ActivityEventDocument } from '../social/schemas/activity-event.schema';
import { CreateWorkoutSessionDto } from './dto/create-workout-session.dto';
import { AddExerciseToSessionDto } from './dto/add-exercise.dto';
import { StartProgramDto } from './dto/start-program.dto';
import { UpdateLogDto } from './dto/update-log.dto';

export interface LastPerformance {
  weightKg: number | null;
  reps: number | null;
  sets: number;
  date: string | null;
  bestSet: { weightKg: number | null; reps: number | null } | null;
}

export interface FinishSummary {
  durationSec: number;
  totalVolumeKg: number;
  kcal: number;
  exercisesDone: number;
  prs: { exerciseName: string; weightKg: number; reps: number | null }[];
}

@Injectable()
export class WorkoutService {
  constructor(
    @InjectModel(WorkoutCategory.name) private categoryModel: Model<WorkoutCategoryDocument>,
    @InjectModel(Exercise.name) private exerciseModel: Model<ExerciseDocument>,
    @InjectModel(WorkoutSession.name) private sessionModel: Model<WorkoutSessionDocument>,
    @InjectModel(WorkoutLog.name) private logModel: Model<WorkoutLogDocument>,
    @InjectModel(WorkoutProgram.name) private programModel: Model<WorkoutProgramDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(ActivityEvent.name) private activityEventModel: Model<ActivityEventDocument>,
  ) {}

  // Categories
  async getCategories(): Promise<WorkoutCategoryDocument[]> {
    return this.categoryModel.find().sort({ sortOrder: 1 }).exec();
  }

  async updateCategoryImage(categoryId: string, imageUrl: string): Promise<WorkoutCategoryDocument> {
    const category = await this.categoryModel.findById(categoryId).exec();
    if (!category) throw new NotFoundException('Category not found');
    category.imageUrl = imageUrl;
    return category.save();
  }

  // Programs
  async getPrograms(categoryId?: string) {
    const filter = categoryId ? { categoryId: new Types.ObjectId(categoryId) } : {};
    const programs = await this.programModel.find(filter).sort({ sortOrder: 1, name: 1 }).exec();
    const exerciseIds = [...new Set(programs.flatMap((p) => p.items.map((i) => i.exerciseId.toString())))];
    const exercises = await this.exerciseModel.find({ _id: { $in: exerciseIds } }).exec();
    const exerciseMap = new Map(exercises.map((e) => [String(e._id), e]));

    return programs.map((p) => {
      const { durationSec, kcal } = this.estimateProgramTotals(p.items, exerciseMap, 70);
      return {
        _id: p._id,
        name: p.name,
        description: p.description,
        imageUrl: p.imageUrl,
        categoryId: p.categoryId,
        level: p.level,
        sortOrder: p.sortOrder,
        exerciseCount: p.items.length,
        estimatedDurationSec: durationSec,
        estimatedKcal: kcal,
      };
    });
  }

  async getProgramById(programId: string, userId: string) {
    const program = await this.programModel.findById(programId).exec();
    if (!program) throw new NotFoundException('Program not found');

    const userWeightKg = await this.getUserWeight(userId);
    const exercises = await this.exerciseModel
      .find({ _id: { $in: program.items.map((i) => i.exerciseId) } })
      .exec();
    const exerciseMap = new Map(exercises.map((e) => [String(e._id), e]));
    const { durationSec, kcal } = this.estimateProgramTotals(program.items, exerciseMap, userWeightKg);

    const items = [...program.items]
      .sort((a, b) => a.order - b.order)
      .map((item) => {
        const ex = exerciseMap.get(item.exerciseId.toString());
        return {
          exerciseId: item.exerciseId,
          order: item.order,
          sets: item.sets,
          reps: item.reps ?? null,
          durationSec: item.durationSec ?? null,
          restSec: item.restSec,
          exercise: ex
            ? {
                _id: ex._id,
                name: ex.name,
                description: ex.description,
                gifUrl: ex.gifUrl,
                type: ex.type,
                muscleGroups: ex.muscleGroups,
                difficulty: ex.difficulty,
                equipment: ex.equipment,
              }
            : null,
        };
      })
      .filter((i) => i.exercise);

    return {
      _id: program._id,
      name: program.name,
      description: program.description,
      imageUrl: program.imageUrl,
      categoryId: program.categoryId,
      level: program.level,
      exerciseCount: items.length,
      estimatedDurationSec: durationSec,
      estimatedKcal: kcal,
      items,
    };
  }

  async updateProgramImage(programId: string, imageUrl: string): Promise<WorkoutProgramDocument> {
    const program = await this.programModel.findById(programId).exec();
    if (!program) throw new NotFoundException('Program not found');
    program.imageUrl = imageUrl;
    return program.save();
  }

  async startProgram(programId: string, dto: StartProgramDto, userId: string) {
    const program = await this.programModel.findById(programId).exec();
    if (!program) throw new NotFoundException('Program not found');

    const userWeightKg = await this.getUserWeight(userId);
    const exercises = await this.exerciseModel
      .find({ _id: { $in: program.items.map((i) => i.exerciseId) } })
      .exec();
    const exerciseMap = new Map(exercises.map((e) => [String(e._id), e]));

    let categoryName: string | undefined;
    if (program.categoryId) {
      const cat = await this.categoryModel.findById(program.categoryId).exec();
      categoryName = cat?.name;
    }

    const session = await new this.sessionModel({
      userId: new Types.ObjectId(userId),
      date: dto.date,
      categoryId: program.categoryId,
      categoryName,
      name: program.name,
      programId: program._id,
      programName: program.name,
      startedAt: new Date(),
    }).save();

    const lastWeights = await this.getLastPerformance(
      userId,
      program.items.map((i) => i.exerciseId.toString()),
    );

    const sortedItems = [...program.items].sort((a, b) => a.order - b.order);
    const logs: WorkoutLogDocument[] = [];
    for (const item of sortedItems) {
      const exercise = exerciseMap.get(item.exerciseId.toString());
      if (!exercise) continue;

      const durationSec =
        item.durationSec ??
        exercise.defaultDurationSec ??
        this.estimateDuration(exercise.type, item.sets, item.reps ?? exercise.defaultReps);
      const caloriesBurned = this.calculateCalories(exercise.metValue, userWeightKg, durationSec);
      const lastWeight = lastWeights[item.exerciseId.toString()]?.weightKg ?? null;

      const log = await new this.logModel({
        sessionId: session._id,
        userId: new Types.ObjectId(userId),
        exerciseId: item.exerciseId,
        exerciseName: exercise.name,
        gifUrl: exercise.gifUrl,
        sets: item.sets,
        reps: item.reps ?? 0,
        weightKg: lastWeight,
        durationSec,
        caloriesBurned: Math.round(caloriesBurned * 100) / 100,
        setsDetail: this.buildSetsDetail(item, lastWeight),
        restSec: item.restSec,
        order: item.order,
      }).save();
      logs.push(log);
    }

    await this.recalcSessionTotals(String(session._id));
    const freshSession = await this.sessionModel.findById(session._id).exec();
    return { session: freshSession, logs };
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

  async finishSession(sessionId: string, userId: string) {
    const session = await this.getSessionById(sessionId, userId);
    const logs = await this.logModel.find({ sessionId: new Types.ObjectId(sessionId) }).exec();

    const totalCalories = logs.reduce((sum, l) => sum + l.caloriesBurned, 0);
    const totalDuration = logs.reduce((sum, l) => sum + l.durationSec, 0);

    session.totalCaloriesBurned = Math.round(totalCalories * 100) / 100;
    session.totalDurationSec = totalDuration;
    session.exerciseCount = logs.length;
    session.finishedAt = new Date();

    const prs = await this.detectPersonalRecords(userId, sessionId, logs);

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

    const doneSets = logs.flatMap((l) => (l.setsDetail || []).filter((s) => s.done));
    const totalVolumeKg = doneSets.reduce(
      (sum, s) => sum + (s.weightKg || 0) * (s.reps || 0),
      0,
    );
    const realDurationSec =
      saved.startedAt && saved.finishedAt
        ? Math.max(0, Math.round((saved.finishedAt.getTime() - saved.startedAt.getTime()) / 1000))
        : saved.totalDurationSec;

    const summary: FinishSummary = {
      durationSec: realDurationSec,
      totalVolumeKg: Math.round(totalVolumeKg * 10) / 10,
      kcal: saved.totalCaloriesBurned,
      exercisesDone: logs.filter((l) => (l.setsDetail || []).some((s) => s.done)).length || logs.length,
      prs,
    };

    return { session: saved, summary };
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
    await this.getSessionById(sessionId, userId);
    const exercise = await this.exerciseModel.findById(dto.exerciseId).exec();
    if (!exercise) throw new NotFoundException('Exercise not found');

    const userWeightKg = await this.getUserWeight(userId);

    const sets = dto.sets ?? exercise.defaultSets;
    const reps = dto.reps ?? exercise.defaultReps;
    const durationSec = dto.durationSec ?? (exercise.defaultDurationSec || this.estimateDuration(exercise.type, sets, reps));
    const caloriesBurned = this.calculateCalories(exercise.metValue, userWeightKg, durationSec);

    const existingCount = await this.logModel.countDocuments({ sessionId: new Types.ObjectId(sessionId) }).exec();
    const lastPerf = await this.getLastPerformance(userId, [dto.exerciseId], sessionId);
    const lastWeight = dto.weightKg ?? lastPerf[dto.exerciseId]?.weightKg ?? null;

    const log = new this.logModel({
      sessionId: new Types.ObjectId(sessionId),
      userId: new Types.ObjectId(userId),
      exerciseId: new Types.ObjectId(dto.exerciseId),
      exerciseName: exercise.name,
      gifUrl: exercise.gifUrl,
      sets,
      reps,
      weightKg: lastWeight,
      durationSec,
      caloriesBurned: Math.round(caloriesBurned * 100) / 100,
      setsDetail: this.buildSetsDetail(
        { sets, reps, durationSec: dto.durationSec },
        lastWeight,
      ),
      restSec: dto.restSec ?? 60,
      order: existingCount,
    });

    const saved = await log.save();
    await this.recalcSessionTotals(sessionId);
    return saved;
  }

  async updateLog(logId: string, dto: UpdateLogDto, userId: string): Promise<WorkoutLogDocument> {
    const log = await this.logModel.findById(logId).exec();
    if (!log) throw new NotFoundException('Log not found');
    if (log.userId.toString() !== userId) throw new ForbiddenException('Access denied');

    const exercise = await this.exerciseModel.findById(log.exerciseId).exec();
    const userWeightKg = await this.getUserWeight(userId);

    log.setsDetail = dto.setsDetail.map((s) => ({
      setNumber: s.setNumber,
      weightKg: s.weightKg ?? null,
      reps: s.reps ?? null,
      durationSec: s.durationSec ?? null,
      done: s.done ?? false,
      completedAt: s.done ? new Date() : undefined,
    })) as WorkoutSetDetail[];

    // Keep aggregate fields in sync — stats and the activity feed read them.
    log.sets = log.setsDetail.length;
    const repsValues = log.setsDetail.map((s) => s.reps).filter((r): r is number => r != null && r > 0);
    log.reps = repsValues.length ? Math.round(repsValues.reduce((a, b) => a + b, 0) / repsValues.length) : log.reps;
    const weights = log.setsDetail.map((s) => s.weightKg).filter((w): w is number => w != null && w > 0);
    log.weightKg = weights.length ? Math.max(...weights) : log.weightKg;

    const explicitDuration = log.setsDetail.reduce((sum, s) => sum + (s.durationSec || 0), 0);
    if (explicitDuration > 0) {
      log.durationSec = explicitDuration;
    } else if (exercise) {
      log.durationSec = this.estimateDuration(exercise.type, log.sets, log.reps || exercise.defaultReps);
    }
    if (exercise) {
      log.caloriesBurned =
        Math.round(this.calculateCalories(exercise.metValue, userWeightKg, log.durationSec) * 100) / 100;
    }

    const saved = await log.save();
    await this.recalcSessionTotals(log.sessionId.toString());
    return saved;
  }

  async getLastPerformance(
    userId: string,
    exerciseIds: string[],
    excludeSessionId?: string,
  ): Promise<Record<string, LastPerformance>> {
    if (!exerciseIds.length) return {};
    const match: Record<string, any> = {
      userId: new Types.ObjectId(userId),
      exerciseId: { $in: exerciseIds.map((id) => new Types.ObjectId(id)) },
    };
    if (excludeSessionId) {
      match.sessionId = { $ne: new Types.ObjectId(excludeSessionId) };
    }

    const rows = await this.logModel
      .aggregate([
        { $match: match },
        { $sort: { createdAt: -1 } },
        { $group: { _id: '$exerciseId', log: { $first: '$$ROOT' } } },
      ])
      .exec();

    const result: Record<string, LastPerformance> = {};
    for (const row of rows) {
      const log = row.log;
      const doneSets = (log.setsDetail || []).filter((s: WorkoutSetDetail) => s.done);
      const sourceSets = doneSets.length ? doneSets : log.setsDetail || [];
      let bestSet: LastPerformance['bestSet'] = null;
      for (const s of sourceSets) {
        if (s.weightKg != null && (!bestSet || (s.weightKg || 0) > (bestSet.weightKg || 0))) {
          bestSet = { weightKg: s.weightKg, reps: s.reps ?? null };
        }
      }
      if (!bestSet && log.weightKg != null) {
        bestSet = { weightKg: log.weightKg, reps: log.reps || null };
      }
      result[String(row._id)] = {
        weightKg: log.weightKg ?? null,
        reps: log.reps || null,
        sets: log.sets || 0,
        date: log.createdAt ? new Date(log.createdAt).toISOString().slice(0, 10) : null,
        bestSet,
      };
    }
    return result;
  }

  async removeExerciseFromSession(logId: string, userId: string): Promise<void> {
    const log = await this.logModel.findById(logId).exec();
    if (!log) throw new NotFoundException('Log not found');
    if (log.userId.toString() !== userId) throw new ForbiddenException('Access denied');

    const sessionId = log.sessionId;
    await log.deleteOne();
    await this.recalcSessionTotals(sessionId.toString());
  }

  // History
  async getHistory(userId: string, limit = 30): Promise<WorkoutSessionDocument[]> {
    return this.sessionModel
      .find({ userId: new Types.ObjectId(userId), finishedAt: { $ne: null } })
      .sort({ finishedAt: -1 })
      .limit(limit)
      .exec();
  }

  private async getUserWeight(userId: string): Promise<number> {
    const user = await this.userModel.findById(userId).exec();
    return user?.profile?.weightKg || 70;
  }

  private buildSetsDetail(
    item: Pick<WorkoutProgramItem, 'sets' | 'reps' | 'durationSec'>,
    lastWeight: number | null,
  ): WorkoutSetDetail[] {
    return Array.from({ length: item.sets }, (_, i) => ({
      setNumber: i + 1,
      weightKg: lastWeight,
      reps: item.reps ?? null,
      durationSec: item.durationSec ?? null,
      done: false,
      completedAt: undefined,
    })) as WorkoutSetDetail[];
  }

  private estimateProgramTotals(
    items: WorkoutProgramItem[],
    exerciseMap: Map<string, ExerciseDocument>,
    weightKg: number,
  ): { durationSec: number; kcal: number } {
    let durationSec = 0;
    let kcal = 0;
    for (const item of items) {
      const exercise = exerciseMap.get(item.exerciseId.toString());
      if (!exercise) continue;
      const itemDuration =
        item.durationSec ??
        exercise.defaultDurationSec ??
        this.estimateDuration(exercise.type, item.sets, item.reps ?? exercise.defaultReps);
      durationSec += itemDuration + item.restSec * Math.max(0, item.sets - 1);
      kcal += this.calculateCalories(exercise.metValue, weightKg, itemDuration);
    }
    return { durationSec, kcal: Math.round(kcal) };
  }

  private async recalcSessionTotals(sessionId: string): Promise<void> {
    const session = await this.sessionModel.findById(sessionId).exec();
    if (!session) return;
    const logs = await this.logModel.find({ sessionId: new Types.ObjectId(sessionId) }).exec();
    session.totalCaloriesBurned = Math.round(logs.reduce((s, l) => s + l.caloriesBurned, 0) * 100) / 100;
    session.totalDurationSec = logs.reduce((s, l) => s + l.durationSec, 0);
    session.exerciseCount = logs.length;
    await session.save();
  }

  private async detectPersonalRecords(
    userId: string,
    sessionId: string,
    logs: WorkoutLogDocument[],
  ): Promise<FinishSummary['prs']> {
    const prs: FinishSummary['prs'] = [];
    for (const log of logs) {
      const doneSets = (log.setsDetail || []).filter((s) => s.done && s.weightKg != null && s.weightKg > 0);
      if (!doneSets.length) continue;
      const best = doneSets.reduce((a, b) => ((b.weightKg || 0) > (a.weightKg || 0) ? b : a));

      const [historicMax] = await this.logModel
        .aggregate([
          {
            $match: {
              userId: new Types.ObjectId(userId),
              exerciseId: log.exerciseId,
              sessionId: { $ne: new Types.ObjectId(sessionId) },
            },
          },
          { $unwind: { path: '$setsDetail', preserveNullAndEmptyArrays: true } },
          {
            $group: {
              _id: null,
              maxSetWeight: { $max: '$setsDetail.weightKg' },
              maxLogWeight: { $max: '$weightKg' },
            },
          },
        ])
        .exec();

      const prevMax = Math.max(historicMax?.maxSetWeight || 0, historicMax?.maxLogWeight || 0);
      if ((best.weightKg || 0) > prevMax) {
        prs.push({ exerciseName: log.exerciseName, weightKg: best.weightKg as number, reps: best.reps ?? null });
      }
    }
    return prs;
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
