import { IsString, IsOptional, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryUserRecipesDto {
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
}
