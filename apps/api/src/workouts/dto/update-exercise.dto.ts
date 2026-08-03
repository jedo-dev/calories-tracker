import { IsIn, IsNumber, IsOptional, IsString, Min, MinLength } from 'class-validator';

export class UpdateExerciseDto {
  @IsString()
  @MinLength(2)
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  equipment?: string;

  @IsIn(['beginner', 'intermediate', 'advanced'])
  @IsOptional()
  difficulty?: string;

  @IsNumber()
  @Min(1)
  @IsOptional()
  defaultSets?: number;

  @IsNumber()
  @Min(1)
  @IsOptional()
  defaultReps?: number;

  @IsNumber()
  @Min(1)
  @IsOptional()
  defaultDurationSec?: number;
}
