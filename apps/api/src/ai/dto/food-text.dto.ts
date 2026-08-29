import { IsString, MaxLength, MinLength } from 'class-validator';

export class FoodTextDto {
  // Надиктованное или набранное описание приёма пищи.
  // 1000 символов хватает на длинное перечисление, но не даёт скармливать простыни.
  @IsString()
  @MinLength(2)
  @MaxLength(1000)
  text: string;
}
