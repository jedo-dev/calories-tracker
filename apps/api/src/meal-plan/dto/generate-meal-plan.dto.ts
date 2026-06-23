import { IsString, IsOptional, IsBoolean, IsInt, IsArray, Min, Max, IsEnum, Matches } from 'class-validator';
import { Type } from 'class-transformer';

export class GenerateMealPlanDto {
  @IsString()
  @IsEnum(['day', 'week'])
  mode: 'day' | 'week';

  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  @IsOptional()
  startDate?: string;

  @IsInt()
  @Min(2)
  @Max(6)
  @IsOptional()
  mealCount?: number;

  @IsBoolean()
  @IsOptional()
  includePublicRecipes?: boolean;

  @IsBoolean()
  @IsOptional()
  preferQuick?: boolean;

  @IsBoolean()
  @IsOptional()
  considerEaten?: boolean;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  excludedTags?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  excludedProductNames?: string[];

  @IsInt()
  @Min(500)
  @Max(10000)
  @IsOptional()
  kcalTarget?: number;

  @IsInt()
  @Min(0)
  @Max(500)
  @IsOptional()
  proteinTargetG?: number;
}
