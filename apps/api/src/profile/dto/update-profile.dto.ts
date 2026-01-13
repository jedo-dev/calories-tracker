import { IsEnum, IsNumber, IsOptional, Max, Min } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsNumber()
  @Min(30)
  @Max(300)
  weightKg?: number;

  @IsOptional()
  @IsNumber()
  @Min(120)
  @Max(230)
  heightCm?: number;

  @IsOptional()
  @IsNumber()
  @Min(10)
  @Max(100)
  age?: number;

  @IsOptional()
  @IsEnum(['male', 'female'])
  gender?: 'male' | 'female';

  @IsOptional()
  @IsEnum(['low', 'medium', 'high', 'very_high'])
  activityLevel?: 'low' | 'medium' | 'high' | 'very_high';

  @IsOptional()
  @IsEnum(['lose', 'maintain', 'gain'])
  goal?: 'lose' | 'maintain' | 'gain';
}
