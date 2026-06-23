import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RecipesService } from './recipes.service';
import { RecipesController } from './recipes.controller';
import { Recipe, RecipeSchema } from './schemas/recipe.schema';
import { Product, ProductSchema } from '../products/schemas/product.schema';
import { Entry, EntrySchema } from '../entries/schemas/entry.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { ActivityEvent, ActivityEventSchema } from '../social/schemas/activity-event.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Recipe.name, schema: RecipeSchema },
      { name: Product.name, schema: ProductSchema },
      { name: Entry.name, schema: EntrySchema },
      { name: User.name, schema: UserSchema },
      { name: ActivityEvent.name, schema: ActivityEventSchema },
    ]),
  ],
  controllers: [RecipesController],
  providers: [RecipesService],
  exports: [RecipesService],
})
export class RecipesModule {}
