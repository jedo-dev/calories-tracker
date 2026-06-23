import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MealPlanService } from './meal-plan.service';
import { MealPlanController } from './meal-plan.controller';
import { MealPlan, MealPlanSchema } from './schemas/meal-plan.schema';
import { Recipe, RecipeSchema } from '../recipes/schemas/recipe.schema';
import { Product, ProductSchema } from '../products/schemas/product.schema';
import { Entry, EntrySchema } from '../entries/schemas/entry.schema';
import { MealTemplate, MealTemplateSchema } from '../templates/schemas/meal-template.schema';
import { ProfileModule } from '../profile/profile.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: MealPlan.name, schema: MealPlanSchema },
      { name: Recipe.name, schema: RecipeSchema },
      { name: Product.name, schema: ProductSchema },
      { name: Entry.name, schema: EntrySchema },
      { name: MealTemplate.name, schema: MealTemplateSchema },
    ]),
    ProfileModule,
  ],
  controllers: [MealPlanController],
  providers: [MealPlanService],
  exports: [MealPlanService],
})
export class MealPlanModule {}
