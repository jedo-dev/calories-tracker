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
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { StorageService } from '../storage/storage.service';

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
@UseGuards(JwtAuthGuard)
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
  async getPrograms(@Query('categoryId') categoryId?: string) {
    return this.workoutService.getPrograms(categoryId);
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

  @Post('programs/:id/photo')
  @UseInterceptors(imageFileInterceptor('photo'))
  async uploadProgramPhoto(@Param('id') id: string, @UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No file uploaded');
    const ext = file.mimetype.split('/')[1];
    const key = `workout-programs/${id}_${Date.now()}.${ext}`;
    const imageUrl = await this.storage.uploadObject(key, file.buffer, file.mimetype);
    const program = await this.workoutService.updateProgramImage(id, imageUrl);
    return { imageUrl: program.imageUrl };
  }

  // Exercises (all when categoryId is omitted — used by the custom workout builder)
  @Get('exercises')
  async getExercisesByCategory(@Query('categoryId') categoryId?: string) {
    return this.workoutService.getExercisesByCategory(categoryId);
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

  // Sessions
  @Post('sessions')
  async createSession(@Body(ValidationPipe) dto: CreateWorkoutSessionDto, @Request() req: any) {
    return this.workoutService.createSession(dto, req.user.id);
  }

  @Get('sessions')
  async getSessionsByDate(@Query('date') date: string, @Request() req: any) {
    return this.workoutService.getSessionsByDate(date, req.user.id);
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
  async getHistory(@Query('limit') limit: string, @Request() req: any) {
    const limitNum = limit ? parseInt(limit, 10) : 30;
    return this.workoutService.getHistory(req.user.id, limitNum);
  }
}
