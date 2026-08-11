import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class FoodPhotoDto {
  // base64 без data:-префикса; ~2.5MB base64 ≈ 1.9MB файла — с запасом для ужатого фото
  @IsString()
  @MaxLength(2_500_000)
  imageBase64: string;

  @IsString()
  @IsIn(['image/jpeg', 'image/png', 'image/webp'])
  @IsOptional()
  mediaType?: string;
}
