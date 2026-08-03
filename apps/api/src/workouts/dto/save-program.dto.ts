import { Type } from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class ProgramItemDto {
  @IsString()
  exerciseId: string;

  @IsNumber()
  @Min(1)
  sets: number;

  @IsNumber()
  @Min(1)
  @IsOptional()
  reps?: number;

  @IsNumber()
  @Min(1)
  @IsOptional()
  durationSec?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  restSec?: number;
}

export class CreateProgramDto {
  @IsString()
  @MinLength(3)
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  categoryId?: string;

  @IsIn(['beginner', 'intermediate', 'advanced'])
  @IsOptional()
  level?: string;

  @IsNumber()
  @IsOptional()
  sortOrder?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProgramItemDto)
  items: ProgramItemDto[];
}

export class UpdateProgramDto {
  @IsString()
  @MinLength(3)
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  categoryId?: string;

  @IsIn(['beginner', 'intermediate', 'advanced'])
  @IsOptional()
  level?: string;

  @IsNumber()
  @IsOptional()
  sortOrder?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProgramItemDto)
  @IsOptional()
  items?: ProgramItemDto[];
}
