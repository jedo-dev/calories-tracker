import {
  IsString,
  IsNumber,
  IsOptional,
  IsMongoId,
  IsIn,
  Min,
  Matches,
} from 'class-validator';

export class CreateEntryDto {
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  date: string;

  @IsString()
  @Matches(/^\d{2}:\d{2}$/)
  @IsOptional()
  time?: string;

  @IsString()
  @IsIn(['breakfast', 'lunch', 'dinner', 'snack', 'other'])
  @IsOptional()
  mealType?: 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'other';

  @IsMongoId()
  productId: string;

  @IsNumber()
  @Min(0.01)
  grams: number;
}

