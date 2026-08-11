import { Body, Controller, Post, ValidationPipe } from '@nestjs/common';
import { AiService } from './ai.service';
import { FoodPhotoDto } from './dto/food-photo.dto';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('food-photo')
  async recognizeFoodPhoto(@Body(ValidationPipe) dto: FoodPhotoDto) {
    return this.aiService.recognizeFoodPhoto(dto.imageBase64, dto.mediaType);
  }
}
