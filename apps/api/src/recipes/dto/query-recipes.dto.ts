import { IsString, IsOptional, IsInt, IsBoolean, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryRecipesDto {
  @IsString()
  @IsOptional()
  search?: string;

  @IsString()
  @IsOptional()
  mealType?: string;

  @IsString()
  @IsOptional()
  tag?: string;

  @IsInt()
  @Min(1)
  @Max(50)
  @Type(() => Number)
  @IsOptional()
  limit?: number = 20;

  @IsInt()
  @Min(0)
  @Type(() => Number)
  @IsOptional()
  offset?: number = 0;

  @IsBoolean()
  @Type(() => Boolean)
  @IsOptional()
  includeArchived?: boolean = false;
}
