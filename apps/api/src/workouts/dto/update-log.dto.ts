import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsNumber,
  IsOptional,
  Min,
  ValidateNested,
} from 'class-validator';

export class SetDetailDto {
  @IsNumber()
  @Min(1)
  setNumber: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  weightKg?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  reps?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  durationSec?: number;

  @IsBoolean()
  @IsOptional()
  done?: boolean;
}

export class UpdateLogDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SetDetailDto)
  setsDetail: SetDetailDto[];
}
