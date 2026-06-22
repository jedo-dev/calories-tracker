import { IsString, IsOptional, IsNumber } from 'class-validator';

export class CreateWorkoutSessionDto {
  @IsString()
  date: string;

  @IsString()
  @IsOptional()
  categoryId?: string;

  @IsString()
  @IsOptional()
  name?: string;
}
