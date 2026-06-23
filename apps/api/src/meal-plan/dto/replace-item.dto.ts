import { IsString, IsInt, Min } from 'class-validator';

export class ReplaceItemDto {
  @IsInt()
  @Min(0)
  dayIndex: number;

  @IsInt()
  @Min(0)
  mealIndex: number;

  @IsInt()
  @Min(0)
  itemIndex: number;
}
