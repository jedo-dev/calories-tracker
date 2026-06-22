import { IsString, IsNumber, IsOptional, Min } from 'class-validator';

export class AddExerciseToSessionDto {
  @IsString()
  exerciseId: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  sets?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  reps?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  weightKg?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  durationSec?: number;
}
