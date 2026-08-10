import { IsEnum, IsNumber, IsOptional, Matches, Max, Min } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsEnum(['🦊', '😉', '💪', '😊', '🧢', '😜'])
  avatarEmoji?: string;

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

  // Диапазоны как у weightKg: targetWeightKg=0 раньше давал деление на 0
  // в прогнозе веса (progressPct → Infinity).
  @IsOptional()
  @IsNumber()
  @Min(30)
  @Max(300)
  startWeightKg?: number;

  @IsOptional()
  @IsNumber()
  @Min(30)
  @Max(300)
  targetWeightKg?: number;

  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  targetDate?: string;
}
