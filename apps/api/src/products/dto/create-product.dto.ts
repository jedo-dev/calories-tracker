import { IsString, IsNumber, IsOptional, Min, Max, IsNotEmpty } from 'class-validator';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  brand?: string;

  @IsString()
  @IsOptional()
  barcode?: string;

  @IsNumber()
  @Min(0)
  @Max(10000)
  kcalPer100g: number;

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

