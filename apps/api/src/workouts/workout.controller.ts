import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  ValidationPipe,
} from '@nestjs/common';
import { WorkoutService } from './workout.service';
import { CreateWorkoutSessionDto } from './dto/create-workout-session.dto';
import { AddExerciseToSessionDto } from './dto/add-exercise.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('workouts')
@UseGuards(JwtAuthGuard)
export class WorkoutController {
  constructor(private workoutService: WorkoutService) {}

  // Categories
  @Get('categories')
  async getCategories() {
    return this.workoutService.getCategories();
  }

  // Exercises
  @Get('exercises')
  async getExercisesByCategory(@Query('categoryId') categoryId: string) {
    return this.workoutService.getExercisesByCategory(categoryId);
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
