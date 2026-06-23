import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Recipe, RecipeDocument } from './schemas/recipe.schema';
import { Product, ProductDocument } from '../products/schemas/product.schema';
import { Entry, EntryDocument } from '../entries/schemas/entry.schema';
import { CreateRecipeDto, IngredientDto } from './dto/create-recipe.dto';
import { UpdateRecipeDto } from './dto/update-recipe.dto';
import { QueryRecipesDto } from './dto/query-recipes.dto';

@Injectable()
export class RecipesService {
  constructor(
    @InjectModel(Recipe.name) private recipeModel: Model<RecipeDocument>,
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    @InjectModel(Entry.name) private entryModel: Model<EntryDocument>,
  ) {}

  normalizeName(name: string): string {
    return name.trim().replace(/\s+/g, ' ').toLowerCase();
  }

  escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  private round(value: number): number {
    return Math.round(value * 100) / 100;
  }

  private calculateIngredientNutrition(ingredient: IngredientDto) {
    const factor = ingredient.grams / 100;
    return {
      kcal: this.round((ingredient.kcalPer100g || 0) * factor),
      protein: this.round((ingredient.proteinPer100g || 0) * factor),
      fat: this.round((ingredient.fatPer100g || 0) * factor),
      carb: this.round((ingredient.carbPer100g || 0) * factor),
    };
  }

  private calculateRecipeNutrition(
    mode: string,
    ingredients: any[],
    totalWeight: number,
    manualKcal?: number,
    manualProtein?: number,
    manualFat?: number,
    manualCarb?: number,
  ) {
    if (mode === 'manual') {
      return {
        kcalPer100g: manualKcal || 0,
        proteinPer100g: manualProtein || 0,
        fatPer100g: manualFat || 0,
        carbPer100g: manualCarb || 0,
        totalKcal: this.round((manualKcal || 0) * totalWeight / 100),
        totalProtein: this.round((manualProtein || 0) * totalWeight / 100),
        totalFat: this.round((manualFat || 0) * totalWeight / 100),
        totalCarb: this.round((manualCarb || 0) * totalWeight / 100),
      };
    }

    const totalKcal = ingredients.reduce((sum, i) => sum + (i.kcal || 0), 0);
    const totalProtein = ingredients.reduce((sum, i) => sum + (i.protein || 0), 0);
    const totalFat = ingredients.reduce((sum, i) => sum + (i.fat || 0), 0);
    const totalCarb = ingredients.reduce((sum, i) => sum + (i.carb || 0), 0);

    if (mode === 'mixed' && manualKcal !== undefined) {
      return {
        kcalPer100g: manualKcal,
        proteinPer100g: manualProtein ?? this.round(totalProtein / totalWeight * 100),
        fatPer100g: manualFat ?? this.round(totalFat / totalWeight * 100),
        carbPer100g: manualCarb ?? this.round(totalCarb / totalWeight * 100),
        totalKcal: this.round(manualKcal * totalWeight / 100),
        totalProtein: this.round((manualProtein ?? this.round(totalProtein / totalWeight * 100)) * totalWeight / 100),
        totalFat: this.round((manualFat ?? this.round(totalFat / totalWeight * 100)) * totalWeight / 100),
        totalCarb: this.round((manualCarb ?? this.round(totalCarb / totalWeight * 100)) * totalWeight / 100),
      };
    }

    return {
      kcalPer100g: this.round(totalKcal / totalWeight * 100),
      proteinPer100g: this.round(totalProtein / totalWeight * 100),
      fatPer100g: this.round(totalFat / totalWeight * 100),
      carbPer100g: this.round(totalCarb / totalWeight * 100),
      totalKcal: this.round(totalKcal),
      totalProtein: this.round(totalProtein),
      totalFat: this.round(totalFat),
      totalCarb: this.round(totalCarb),
    };
  }

  private validateRecipe(dto: CreateRecipeDto | UpdateRecipeDto) {
    if (dto.name !== undefined && dto.name.trim().length < 2) {
      throw new BadRequestException('Name must be at least 2 characters');
    }
    if (dto.totalCookedWeightG !== undefined && dto.totalCookedWeightG <= 0) {
      throw new BadRequestException('Total cooked weight must be greater than 0');
    }
    if (dto.calculationMode === 'ingredients') {
      if (!dto.ingredients || dto.ingredients.length === 0) {
        throw new BadRequestException('At least one ingredient is required for ingredients mode');
      }
    }
  }

  private async syncLinkedProduct(recipe: RecipeDocument): Promise<void> {
    const productData = {
      name: recipe.name,
      nameNormalized: recipe.nameNormalized,
      kcalPer100g: recipe.kcalPer100g,
      proteinPer100g: recipe.proteinPer100g,
      fatPer100g: recipe.fatPer100g,
      carbPer100g: recipe.carbPer100g,
      source: 'RECIPE',
      sourceId: recipe._id.toString(),
      createdBy: recipe.userId,
    };

    if (recipe.linkedProductId) {
      const existing = await this.productModel.findById(recipe.linkedProductId);
      if (existing) {
        existing.set(productData);
        await existing.save();
        return;
      }
    }

    const product = new this.productModel(productData);
    const saved = await product.save();
    recipe.linkedProductId = saved._id as Types.ObjectId;
    await recipe.save();
  }

  async create(createRecipeDto: CreateRecipeDto, userId: string): Promise<RecipeDocument> {
    this.validateRecipe(createRecipeDto);

    const ingredients = (createRecipeDto.ingredients || []).map((ing) => {
      const nutrition = this.calculateIngredientNutrition(ing);
      return {
        productId: ing.productId ? new Types.ObjectId(ing.productId) : undefined,
        productName: ing.productName,
        grams: ing.grams,
        kcalPer100g: ing.kcalPer100g || 0,
        proteinPer100g: ing.proteinPer100g || 0,
        fatPer100g: ing.fatPer100g || 0,
        carbPer100g: ing.carbPer100g || 0,
        ...nutrition,
      };
    });

    const nutrition = this.calculateRecipeNutrition(
      createRecipeDto.calculationMode,
      ingredients,
      createRecipeDto.totalCookedWeightG,
      createRecipeDto.kcalPer100g,
      createRecipeDto.proteinPer100g,
      createRecipeDto.fatPer100g,
      createRecipeDto.carbPer100g,
    );

    const recipe = new this.recipeModel({
      userId: new Types.ObjectId(userId),
      name: createRecipeDto.name.trim().replace(/\s+/g, ' '),
      nameNormalized: this.normalizeName(createRecipeDto.name),
      description: createRecipeDto.description,
      photoUrl: createRecipeDto.photoUrl,
      mealTypes: createRecipeDto.mealTypes || [],
      tags: createRecipeDto.tags || [],
      servingName: createRecipeDto.servingName,
      servingGrams: createRecipeDto.servingGrams,
      totalCookedWeightG: createRecipeDto.totalCookedWeightG,
      calculationMode: createRecipeDto.calculationMode,
      ingredients,
      ...nutrition,
      isArchived: false,
    });

    const saved = await recipe.save();
    await this.syncLinkedProduct(saved);
    return saved;
  }

  async findAll(query: QueryRecipesDto, userId: string): Promise<RecipeDocument[]> {
    const { search, mealType, tag, limit = 20, offset = 0, includeArchived } = query;
    const filter: any = { userId: new Types.ObjectId(userId) };

    if (!includeArchived) {
      filter.isArchived = false;
    }

    if (search && search.trim()) {
      const escaped = this.escapeRegex(this.normalizeName(search));
      filter.nameNormalized = { $regex: escaped };
    }

    if (mealType) {
      filter.mealTypes = mealType;
    }

    if (tag) {
      filter.tags = tag;
    }

    return this.recipeModel
      .find(filter)
      .sort({ updatedAt: -1 })
      .skip(offset)
      .limit(limit)
      .exec();
  }

  async findById(id: string, userId: string): Promise<RecipeDocument> {
    const recipe = await this.recipeModel.findById(id).exec();
    if (!recipe) {
      throw new NotFoundException('Recipe not found');
    }
    if (recipe.userId.toString() !== userId) {
      throw new ForbiddenException('Access denied');
    }
    return recipe;
  }

  async update(id: string, updateRecipeDto: UpdateRecipeDto, userId: string): Promise<RecipeDocument> {
    const recipe = await this.findById(id, userId);
    this.validateRecipe(updateRecipeDto);

    const updateData: any = {};

    if (updateRecipeDto.name !== undefined) {
      updateData.name = updateRecipeDto.name.trim().replace(/\s+/g, ' ');
      updateData.nameNormalized = this.normalizeName(updateRecipeDto.name);
    }
    if (updateRecipeDto.description !== undefined) updateData.description = updateRecipeDto.description;
    if (updateRecipeDto.photoUrl !== undefined) updateData.photoUrl = updateRecipeDto.photoUrl;
    if (updateRecipeDto.mealTypes !== undefined) updateData.mealTypes = updateRecipeDto.mealTypes;
    if (updateRecipeDto.tags !== undefined) updateData.tags = updateRecipeDto.tags;
    if (updateRecipeDto.servingName !== undefined) updateData.servingName = updateRecipeDto.servingName;
    if (updateRecipeDto.servingGrams !== undefined) updateData.servingGrams = updateRecipeDto.servingGrams;
    if (updateRecipeDto.totalCookedWeightG !== undefined) updateData.totalCookedWeightG = updateRecipeDto.totalCookedWeightG;
    if (updateRecipeDto.calculationMode !== undefined) updateData.calculationMode = updateRecipeDto.calculationMode;

    if (updateRecipeDto.ingredients !== undefined) {
      updateData.ingredients = updateRecipeDto.ingredients.map((ing) => {
        const nutrition = this.calculateIngredientNutrition(ing);
        return {
          productId: ing.productId ? new Types.ObjectId(ing.productId) : undefined,
          productName: ing.productName,
          grams: ing.grams,
          kcalPer100g: ing.kcalPer100g || 0,
          proteinPer100g: ing.proteinPer100g || 0,
          fatPer100g: ing.fatPer100g || 0,
          carbPer100g: ing.carbPer100g || 0,
          ...nutrition,
        };
      });
    }

    const mode = updateData.calculationMode || recipe.calculationMode;
    const ingredients = updateData.ingredients || recipe.ingredients;
    const totalWeight = updateData.totalCookedWeightG || recipe.totalCookedWeightG;

    const nutrition = this.calculateRecipeNutrition(
      mode,
      ingredients,
      totalWeight,
      updateRecipeDto.kcalPer100g ?? recipe.kcalPer100g,
      updateRecipeDto.proteinPer100g ?? recipe.proteinPer100g,
      updateRecipeDto.fatPer100g ?? recipe.fatPer100g,
      updateRecipeDto.carbPer100g ?? recipe.carbPer100g,
    );

    Object.assign(updateData, nutrition);
    recipe.set(updateData);
    const saved = await recipe.save();
    await this.syncLinkedProduct(saved);
    return saved;
  }

  async archive(id: string, userId: string): Promise<RecipeDocument> {
    const recipe = await this.findById(id, userId);
    recipe.set({ isArchived: true });
    const saved = await recipe.save();

    if (saved.linkedProductId) {
      const product = await this.productModel.findById(saved.linkedProductId);
      if (product) {
        product.set({ name: `[Архив] ${product.name}` });
        await product.save();
      }
    }

    return saved;
  }

  async unarchive(id: string, userId: string): Promise<RecipeDocument> {
    const recipe = await this.findById(id, userId);
    recipe.set({ isArchived: false });
    const saved = await recipe.save();
    await this.syncLinkedProduct(saved);
    return saved;
  }

  async duplicate(id: string, userId: string): Promise<RecipeDocument> {
    const original = await this.findById(id, userId);
    const obj = original.toObject();
    delete (obj as any)._id;
    delete (obj as any).createdAt;
    delete (obj as any).updatedAt;

    const duplicate = new this.recipeModel({
      ...obj,
      name: `${original.name} (копия)`,
      nameNormalized: this.normalizeName(`${original.name} (копия)`),
      linkedProductId: undefined,
      isArchived: false,
    });

    const saved = await duplicate.save();
    await this.syncLinkedProduct(saved);
    return saved;
  }

  async createEntry(
    recipeId: string,
    body: { date: string; time?: string; mealType?: string; grams: number },
    userId: string,
  ): Promise<EntryDocument> {
    const recipe = await this.findById(recipeId, userId);

    const factor = body.grams / 100;
    const entry = new this.entryModel({
      userId: new Types.ObjectId(userId),
      date: body.date,
      time: body.time,
      mealType: body.mealType || 'other',
      productId: recipe.linkedProductId,
      productName: recipe.name,
      grams: body.grams,
      kcalPer100g: recipe.kcalPer100g,
      proteinPer100g: recipe.proteinPer100g,
      fatPer100g: recipe.fatPer100g,
      carbPer100g: recipe.carbPer100g,
      kcal: this.round(recipe.kcalPer100g * factor),
      protein: this.round(recipe.proteinPer100g * factor),
      fat: this.round(recipe.fatPer100g * factor),
      carb: this.round(recipe.carbPer100g * factor),
    });

    return entry.save();
  }

  async updatePhoto(id: string, photoUrl: string, userId: string): Promise<RecipeDocument> {
    const recipe = await this.findById(id, userId);
    recipe.set({ photoUrl });
    return recipe.save();
  }

  async deletePhoto(id: string, userId: string): Promise<RecipeDocument> {
    const recipe = await this.findById(id, userId);
    recipe.set({ photoUrl: undefined });
    return recipe.save();
  }
}
