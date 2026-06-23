import { IsString, IsNumber, IsOptional, Min, Max } from 'class-validator';

export class UpdateProductDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  brand?: string;

  @IsNumber()
  @Min(0)
  @Max(10000)
  @IsOptional()
  kcalPer100g?: number;

  @IsNumber()
  @Min(0)
  @Max(1000)
  @IsOptional()
  proteinPer100g?: number;

  @IsNumber()
  @Min(0)
  @Max(1000)
  @IsOptional()
  fatPer100g?: number;

  @IsNumber()
  @Min(0)
  @Max(1000)
  @IsOptional()
  carbPer100g?: number;
}
