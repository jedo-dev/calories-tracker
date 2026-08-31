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
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { WorkoutService } from './workout.service';
import { CreateWorkoutSessionDto } from './dto/create-workout-session.dto';
import { AddExerciseToSessionDto } from './dto/add-exercise.dto';
import { StartProgramDto } from './dto/start-program.dto';
import { UpdateLogDto } from './dto/update-log.dto';
import { CreateProgramDto, UpdateProgramDto } from './dto/save-program.dto';
import { CreateExerciseDto, UpdateExerciseDto } from './dto/update-exercise.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { StorageService } from '../storage/storage.service';
import { parseLimit } from '../common/utils/query';

const CONTENT_EDITORS = ['admin', 'trainer'];

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/webp'];

const imageFileInterceptor = (field: string) =>
  FileInterceptor(field, {
    limits: { fileSize: MAX_FILE_SIZE },
    fileFilter: (_req, file, cb) => {
      if (ALLOWED_MIMES.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new BadRequestException('Only JPEG, PNG, WebP images are allowed'), false);
      }
    },
  });

@Controller('workouts')
@UseGuards(JwtAuthGuard, RolesGuard)
export class WorkoutController {
  constructor(
    private workoutService: WorkoutService,
    private storage: StorageService,
  ) {}

  // Categories
  @Get('categories')
  async getCategories() {
    return this.workoutService.getCategories();
  }

  @Post('categories/:id/photo')
  @Roles(...CONTENT_EDITORS)
  @UseInterceptors(imageFileInterceptor('photo'))
  async uploadCategoryPhoto(@Param('id') id: string, @UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No file uploaded');
    const ext = file.mimetype.split('/')[1];
    const key = `workout-categories/${id}_${Date.now()}.${ext}`;
    const imageUrl = await this.storage.uploadObject(key, file.buffer, file.mimetype);
    const category = await this.workoutService.updateCategoryImage(id, imageUrl);
    return { imageUrl: category.imageUrl };
  }

  // Programs
  @Get('programs')
  async getPrograms(@Request() req: any, @Query('categoryId') categoryId?: string) {
    return this.workoutService.getPrograms(categoryId, req.user.id);
  }

  // Избранное: до 'programs/:id', иначе «favorites» распарсится как id
  @Get('programs/favorites')
  async getFavoritePrograms(@Request() req: any) {
    return this.workoutService.getFavoritePrograms(req.user.id);
  }

  @Post('programs/:id/favorite')
  async toggleFavoriteProgram(@Param('id') id: string, @Request() req: any) {
    return this.workoutService.toggleFavoriteProgram(req.user.id, id);
  }

  @Get('programs/:id')
  async getProgram(@Param('id') id: string, @Request() req: any) {
    return this.workoutService.getProgramById(id, req.user.id);
  }

  @Post('programs/:id/start')
  async startProgram(
    @Param('id') id: string,
    @Body(ValidationPipe) dto: StartProgramDto,
    @Request() req: any,
  ) {
    return this.workoutService.startProgram(id, dto, req.user.id);
  }

  // Редакторы создают глобальные программы, обычные пользователи — личные
  @Post('programs')
  async createProgram(@Body(ValidationPipe) dto: CreateProgramDto, @Request() req: any) {
    const isEditor = CONTENT_EDITORS.includes(req.user.role);
    return this.workoutService.createProgram(dto, isEditor ? null : req.user.id);
  }

  @Patch('programs/:id')
  async updateProgram(@Param('id') id: string, @Body(ValidationPipe) dto: UpdateProgramDto, @Request() req: any) {
    return this.workoutService.updateProgram(id, dto, {
      userId: req.user.id,
      isEditor: CONTENT_EDITORS.includes(req.user.role),
    });
  }

  @Delete('programs/:id')
  async deleteProgram(@Param('id') id: string, @Request() req: any) {
    await this.workoutService.deleteProgram(id, {
      userId: req.user.id,
      isEditor: CONTENT_EDITORS.includes(req.user.role),
    });
    return { ok: true };
  }

  @Post('programs/:id/photo')
  @Roles(...CONTENT_EDITORS)
  @UseInterceptors(imageFileInterceptor('photo'))
  async uploadProgramPhoto(@Param('id') id: string, @UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No file uploaded');
    const ext = file.mimetype.split('/')[1];
    const key = `workout-programs/${id}_${Date.now()}.${ext}`;
    const imageUrl = await this.storage.uploadObject(key, file.buffer, file.mimetype);
    const program = await this.workoutService.updateProgramImage(id, imageUrl);
    return { imageUrl: program.imageUrl };
  }

  // Статистика по группам мышц для карты тела: какие мышцы и в какие дни
  // тренировались за период. Названия мышц — сырые строки из Exercise,
  // нормализация в слаги происходит на клиенте.
  @Get('muscles/stats')
  async getMuscleStats(@Query('days') days: string | undefined, @Request() req: any) {
    const daysNum = Math.min(Math.max(parseInt(days || '30', 10) || 30, 1), 365);
    return this.workoutService.getMuscleStats(req.user.id, daysNum);
  }

  // Exercises. Without limit returns the full catalog (legacy builder callers);
  // admin/editor callers pass search+limit+offset for server-side paging.
  @Get('exercises')
  async getExercisesByCategory(
    @Query('categoryId') categoryId?: string,
    @Query('search') search?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const limitNum = limit ? Math.min(Math.max(parseInt(limit, 10) || 0, 0), 100) : undefined;
    const offsetNum = offset ? Math.max(parseInt(offset, 10) || 0, 0) : undefined;
    return this.workoutService.getExercisesByCategory(categoryId, search, limitNum, offsetNum);
  }

  // Last performance per exercise — must be declared before 'exercises/:id'
  @Get('exercises/last')
  async getLastPerformance(
    @Query('ids') ids: string,
    @Query('excludeSessionId') excludeSessionId: string | undefined,
    @Request() req: any,
  ) {
    const exerciseIds = (ids || '').split(',').map((s) => s.trim()).filter(Boolean);
    return this.workoutService.getLastPerformance(req.user.id, exerciseIds, excludeSessionId);
  }

  @Get('exercises/:id')
  async getExercise(@Param('id') id: string) {
    return this.workoutService.getExerciseById(id);
  }

  @Post('exercises')
  @Roles(...CONTENT_EDITORS)
  async createExercise(@Body(ValidationPipe) dto: CreateExerciseDto) {
    return this.workoutService.createExercise(dto);
  }

  @Patch('exercises/:id')
  @Roles(...CONTENT_EDITORS)
  async updateExercise(@Param('id') id: string, @Body(ValidationPipe) dto: UpdateExerciseDto) {
    return this.workoutService.updateExercise(id, dto);
  }

  @Delete('exercises/:id')
  @Roles(...CONTENT_EDITORS)
  async deleteExercise(@Param('id') id: string) {
    await this.workoutService.deleteExercise(id);
    return { ok: true };
  }

  @Post('exercises/:id/photo')
  @Roles(...CONTENT_EDITORS)
  @UseInterceptors(imageFileInterceptor('photo'))
  async uploadExercisePhoto(@Param('id') id: string, @UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No file uploaded');
    const ext = file.mimetype.split('/')[1];
    const key = `exercises/uploads/${id}_${Date.now()}.${ext}`;
    const gifUrl = await this.storage.uploadObject(key, file.buffer, file.mimetype);
    const exercise = await this.workoutService.updateExerciseImage(id, gifUrl);
    return { gifUrl: exercise.gifUrl };
  }

  // Sessions
  @Post('sessions')
  async createSession(@Body(ValidationPipe) dto: CreateWorkoutSessionDto, @Request() req: any) {
    return this.workoutService.createSession(dto, req.user.id);
  }

  @Get('sessions')
  async getSessionsByDate(@Query('date') date: string, @Request() req: any) {
    return this.workoutService.getSessionsByDate(date, req.user.id);
  }

  @Get('sessions/:id/detail')
  async getSessionDetail(@Param('id') id: string, @Request() req: any) {
    return this.workoutService.getSessionDetail(id, req.user.id);
  }

  @Get('sessions/:id')
  async getSession(@Param('id') id: string, @Request() req: any) {
    return this.workoutService.getSessionById(id, req.user.id);
  }

  @Post('sessions/:id/finish')
  async finishSession(@Param('id') id: string, @Request() req: any) {
    return this.workoutService.finishSession(id, req.user.id);
  }

  @Delete('sessions/:id')
  async deleteSession(@Param('id') id: string, @Request() req: any) {
    await this.workoutService.deleteSession(id, req.user.id);
    return { ok: true };
  }

  // Exercise logs within session
  @Get('sessions/:id/logs')
  async getSessionLogs(@Param('id') id: string, @Request() req: any) {
    await this.workoutService.getSessionById(id, req.user.id);
    return this.workoutService.getSessionLogs(id);
  }

  @Post('sessions/:id/exercises')
  async addExercise(
    @Param('id') sessionId: string,
    @Body(ValidationPipe) dto: AddExerciseToSessionDto,
    @Request() req: any,
  ) {
    return this.workoutService.addExerciseToSession(sessionId, dto, req.user.id);
  }

  @Patch('logs/:id')
  async updateLog(
    @Param('id') logId: string,
    @Body(ValidationPipe) dto: UpdateLogDto,
    @Request() req: any,
  ) {
    return this.workoutService.updateLog(logId, dto, req.user.id);
  }

  @Delete('logs/:id')
  async removeExercise(@Param('id') logId: string, @Request() req: any) {
    await this.workoutService.removeExerciseFromSession(logId, req.user.id);
    return { ok: true };
  }

  // History
  @Get('history')
  async getHistory(
    @Query('limit') limit: string,
    @Query('offset') offset: string,
    @Request() req: any,
  ) {
    const limitNum = parseLimit(limit, 30);
    const offsetNum = Math.max(0, parseInt(offset || '0', 10) || 0);
    return this.workoutService.getHistory(req.user.id, limitNum, offsetNum);
  }
}
