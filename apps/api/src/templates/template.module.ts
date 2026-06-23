import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TemplateService } from './template.service';
import { TemplateController } from './template.controller';
import { MealTemplate, MealTemplateSchema } from './schemas/meal-template.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: MealTemplate.name, schema: MealTemplateSchema }])],
  controllers: [TemplateController],
  providers: [TemplateService],
  exports: [TemplateService],
})
export class TemplateModule {}
