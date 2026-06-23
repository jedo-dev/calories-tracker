import {
  IsString,
  IsNumber,
  IsOptional,
  IsArray,
  IsIn,
  IsBoolean,
  Min,
  Max,
  IsNotEmpty,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';

export class IngredientDto {
  @IsString()
  @IsOptional()
  productId?: string;

  @IsString()
  @IsNotEmpty()
  productName: string;

  @IsNumber()
  @Min(0.01)
  grams: number;

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

export class CreateRecipeDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  photoUrl?: string;

  @IsArray()
  @IsIn(['breakfast', 'lunch', 'dinner', 'snack', 'other'], { each: true })
  @IsOptional()
  mealTypes?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @IsString()
  @IsOptional()
  servingName?: string;

  @IsNumber()
  @Min(1)
  @IsOptional()
  servingGrams?: number;

  @IsNumber()
  @Min(1)
  totalCookedWeightG: number;

  @IsIn(['manual', 'ingredients', 'mixed'])
  calculationMode: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => IngredientDto)
  @IsOptional()
  ingredients?: IngredientDto[];

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
