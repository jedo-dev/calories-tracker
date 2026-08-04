import { IsArray, IsIn, IsNumber, IsOptional, IsString, Min, MinLength } from 'class-validator';

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
  categoryId?: string;

  @IsIn(['strength', 'cardio', 'flexibility'])
  @IsOptional()
  type?: string;

  @IsNumber()
  @Min(0.1)
  @IsOptional()
  metValue?: number;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  muscleGroups?: string[];

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

export class CreateExerciseDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsString()
  categoryId: string;

  @IsIn(['strength', 'cardio', 'flexibility'])
  type: string;

  @IsNumber()
  @Min(0.1)
  metValue: number;

  @IsString()
  @IsOptional()
  description?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  muscleGroups?: string[];

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
