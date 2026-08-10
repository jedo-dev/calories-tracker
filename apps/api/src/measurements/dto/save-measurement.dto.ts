import { IsNumber, IsOptional, Matches, Max, Min } from 'class-validator';

// Явный DTO вместо сырого body: раньше {...body} уходил в findOneAndUpdate
// целиком, и передав userId в теле можно было «переписать» запись на другого
// пользователя (mass-assignment). Глобальный whitelist теперь вырезает лишнее.
export class SaveMeasurementDto {
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  date: string;

  @IsOptional()
  @IsNumber()
  @Min(20)
  @Max(300)
  waistCm?: number;

  @IsOptional()
  @IsNumber()
  @Min(20)
  @Max(300)
  hipsCm?: number;

  @IsOptional()
  @IsNumber()
  @Min(20)
  @Max(300)
  chestCm?: number;

  @IsOptional()
  @IsNumber()
  @Min(10)
  @Max(150)
  bicepCm?: number;

  @IsOptional()
  @IsNumber()
  @Min(20)
  @Max(200)
  thighCm?: number;
}
