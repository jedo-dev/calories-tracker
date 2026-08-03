import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { MealPlan, MealPlanDocument, PlanDay, PlanMeal, PlanItem } from './schemas/meal-plan.schema';
import { Recipe, RecipeDocument } from '../recipes/schemas/recipe.schema';
import { Product, ProductDocument } from '../products/schemas/product.schema';
import { Entry, EntryDocument } from '../entries/schemas/entry.schema';
import { MealTemplate, MealTemplateDocument } from '../templates/schemas/meal-template.schema';
import { ProfileService } from '../profile/profile.service';
import { GenerateMealPlanDto } from './dto/generate-meal-plan.dto';
import { ReplaceItemDto } from './dto/replace-item.dto';

interface Candidate {
  sourceType: 'recipe' | 'product';
  sourceId: string;
  name: string;
  kcalPer100g: number;
  proteinPer100g: number;
  fatPer100g: number;
  carbPer100g: number;
  servingGrams: number;
  mealTypes: string[];
  tags: string[];
  photoUrl?: string;
  authorName?: string;
  isOwn: boolean;
}

interface MealSlot {
  mealType: string;
  title: string;
  targetKcal: number;
  targetProtein: number;
}

const MEAL_SLOTS_3: MealSlot[] = [
  { mealType: 'breakfast', title: 'Завтрак', targetKcal: 0.25, targetProtein: 0.25 },
  { mealType: 'lunch', title: 'Обед', targetKcal: 0.40, targetProtein: 0.40 },
  { mealType: 'dinner', title: 'Ужин', targetKcal: 0.35, targetProtein: 0.35 },
];

const MEAL_SLOTS_4: MealSlot[] = [
  { mealType: 'breakfast', title: 'Завтрак', targetKcal: 0.25, targetProtein: 0.25 },
  { mealType: 'lunch', title: 'Обед', targetKcal: 0.35, targetProtein: 0.35 },
  { mealType: 'dinner', title: 'Ужин', targetKcal: 0.25, targetProtein: 0.25 },
  { mealType: 'snack', title: 'Перекус', targetKcal: 0.15, targetProtein: 0.15 },
];

const MEAL_SLOTS_5: MealSlot[] = [
  { mealType: 'breakfast', title: 'Завтрак', targetKcal: 0.20, targetProtein: 0.20 },
  { mealType: 'snack', title: 'Перекус (утро)', targetKcal: 0.10, targetProtein: 0.10 },
  { mealType: 'lunch', title: 'Обед', targetKcal: 0.35, targetProtein: 0.35 },
  { mealType: 'snack', title: 'Перекус (день)', targetKcal: 0.10, targetProtein: 0.10 },
  { mealType: 'dinner', title: 'Ужин', targetKcal: 0.25, targetProtein: 0.25 },
];

@Injectable()
export class MealPlanService {
  constructor(
    @InjectModel(MealPlan.name) private mealPlanModel: Model<MealPlanDocument>,
    @InjectModel(Recipe.name) private recipeModel: Model<RecipeDocument>,
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    @InjectModel(Entry.name) private entryModel: Model<EntryDocument>,
    @InjectModel(MealTemplate.name) private templateModel: Model<MealTemplateDocument>,
    private profileService: ProfileService,
  ) {}

  private getToday(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  private addDays(dateStr: string, days: number): string {
    const d = new Date(dateStr + 'T00:00:00Z');
    d.setUTCDate(d.getUTCDate() + days);
    return d.toISOString().split('T')[0];
  }

  private round(v: number): number {
    return Math.round(v * 100) / 100;
  }

  private getMealSlots(count: number): MealSlot[] {
    if (count <= 3) return MEAL_SLOTS_3;
    if (count === 4) return MEAL_SLOTS_4;
    return MEAL_SLOTS_5;
  }

  private async collectCandidates(userId: string, settings: GenerateMealPlanDto): Promise<Candidate[]> {
    const candidates: Candidate[] = [];

    // Own recipes
    const ownRecipes = await this.recipeModel.find({
      userId: new Types.ObjectId(userId),
      isArchived: false,
    }).lean();

    for (const r of ownRecipes) {
      candidates.push({
        sourceType: 'recipe',
        sourceId: r._id.toString(),
        name: r.name,
        kcalPer100g: r.kcalPer100g,
        proteinPer100g: r.proteinPer100g,
        fatPer100g: r.fatPer100g,
        carbPer100g: r.carbPer100g,
        servingGrams: r.servingGrams || r.totalCookedWeightG || 200,
        mealTypes: r.mealTypes || [],
        tags: r.tags || [],
        photoUrl: r.photoUrl,
        authorName: r.authorSnapshot?.displayName,
        isOwn: true,
      });
    }

    // Public recipes
    if (settings.includePublicRecipes !== false) {
      const publicRecipes = await this.recipeModel.find({
        visibility: 'public',
        isArchived: false,
        userId: { $ne: new Types.ObjectId(userId) },
      }).limit(200).lean();

      for (const r of publicRecipes) {
        candidates.push({
          sourceType: 'recipe',
          sourceId: r._id.toString(),
          name: r.name,
          kcalPer100g: r.kcalPer100g,
          proteinPer100g: r.proteinPer100g,
          fatPer100g: r.fatPer100g,
          carbPer100g: r.carbPer100g,
          servingGrams: r.servingGrams || r.totalCookedWeightG || 200,
          mealTypes: r.mealTypes || [],
          tags: r.tags || [],
          photoUrl: r.photoUrl,
          authorName: r.authorSnapshot?.displayName,
          isOwn: false,
        });
      }
    }

    // Products as fallback
    const products = await this.productModel.find({}).limit(300).lean();
    for (const p of products) {
      candidates.push({
        sourceType: 'product',
        sourceId: p._id.toString(),
        name: p.name,
        kcalPer100g: p.kcalPer100g,
        proteinPer100g: p.proteinPer100g,
        fatPer100g: p.fatPer100g,
        carbPer100g: p.carbPer100g,
        servingGrams: 100,
        mealTypes: [],
        tags: [],
        photoUrl: undefined,
        authorName: undefined,
        isOwn: true,
      });
    }

    return candidates;
  }

  private filterCandidates(candidates: Candidate[], settings: GenerateMealPlanDto): Candidate[] {
    const excludedTags = new Set((settings.excludedTags || []).map(t => t.toLowerCase()));
    const excludedProducts = new Set((settings.excludedProductNames || []).map(n => n.toLowerCase()));

    return candidates.filter(c => {
      // Exclude absurd nutrition
      const macrosSum = c.proteinPer100g + c.fatPer100g + c.carbPer100g;
      if (macrosSum > 100) return false;
      if (c.kcalPer100g <= 0) return false;

      // Exclude by tags
      if (c.tags.some(t => excludedTags.has(t.toLowerCase()))) return false;

      // Exclude by product name
      if (excludedProducts.has(c.name.toLowerCase())) return false;

      // Prefer quick
      if (settings.preferQuick && c.sourceType === 'recipe') {
        // Give preference but don't hard-filter
      }

      return true;
    });
  }

  private scoreCandidate(
    candidate: Candidate,
    targetKcal: number,
    targetProtein: number,
    mealType: string,
    usedNames: Set<string>,
    preferQuick: boolean,
  ): number {
    let score = 50;

    // MealType match bonus
    if (candidate.mealTypes.includes(mealType)) score += 20;
    else if (candidate.mealTypes.length > 0) score -= 10;

    // Own recipe bonus
    if (candidate.isOwn) score += 10;

    // Has photo bonus
    if (candidate.photoUrl) score += 5;

    // Penalize duplicates
    if (usedNames.has(candidate.name)) score -= 30;

    // Prefer quick (recipes with fewer ingredients are "quicker")
    if (preferQuick && candidate.tags.includes('быстро')) score += 10;

    // Nutrition fit — how well does a serving fit the target
    const servingKcal = (candidate.kcalPer100g * candidate.servingGrams) / 100;
    const servingProtein = (candidate.proteinPer100g * candidate.servingGrams) / 100;
    const kcalDiff = Math.abs(servingKcal - targetKcal) / targetKcal;
    const proteinDiff = Math.abs(servingProtein - targetProtein) / Math.max(targetProtein, 1);

    if (kcalDiff < 0.3) score += 15;
    else if (kcalDiff < 0.5) score += 5;
    else score -= 10;

    if (proteinDiff < 0.3) score += 10;
    else if (proteinDiff > 0.7) score -= 5;

    return score;
  }

  private selectItemForMeal(
    candidates: Candidate[],
    meal: MealSlot,
    totalKcalTarget: number,
    totalProteinTarget: number,
    usedNames: Set<string>,
    preferQuick: boolean,
  ): PlanItem | null {
    const targetKcal = totalKcalTarget * meal.targetKcal;
    const targetProtein = totalProteinTarget * meal.targetProtein;

    // Score and sort candidates
    const scored = candidates
      .map(c => ({
        candidate: c,
        score: this.scoreCandidate(c, targetKcal, targetProtein, meal.mealType, usedNames, preferQuick),
      }))
      .sort((a, b) => b.score - a.score);

    // Pick from top candidates with some randomness
    const topN = Math.min(10, scored.length);
    const pickIndex = Math.floor(Math.random() * topN);
    const picked = scored[pickIndex];
    if (!picked) return null;

    const c = picked.candidate;

    // Adjust portion size to better hit targets
    let grams = c.servingGrams;
    const servingKcal = (c.kcalPer100g * grams) / 100;

    if (servingKcal > 0 && targetKcal > 0) {
      const ratio = targetKcal / servingKcal;
      grams = Math.round(grams * Math.min(Math.max(ratio, 0.5), 2.0));
      // Clamp to reasonable range
      grams = Math.max(50, Math.min(600, grams));
    }

    const factor = grams / 100;
    usedNames.add(c.name);

    return {
      sourceType: c.sourceType,
      sourceId: new Types.ObjectId(c.sourceId),
      name: c.name,
      grams,
      kcal: this.round(c.kcalPer100g * factor),
      protein: this.round(c.proteinPer100g * factor),
      fat: this.round(c.fatPer100g * factor),
      carb: this.round(c.carbPer100g * factor),
      photoUrl: c.photoUrl,
      authorName: c.authorName,
    };
  }

  private generateExplanation(
    settings: GenerateMealPlanDto,
    remainingKcal: number,
    remainingProtein: number,
    mode: string,
    goal: string,
  ): string[] {
    const explanation: string[] = [];

    if (mode === 'day' && settings.considerEaten && remainingKcal < (settings.kcalTarget || 2000)) {
      explanation.push(`План подобран под остаток ${Math.round(remainingKcal)} ккал`);
      if (remainingProtein > 50) {
        explanation.push(`Белка осталось ${Math.round(remainingProtein)}г — добавлены белковые блюда`);
      }
    } else {
      explanation.push(`План рассчитан на ${settings.kcalTarget || 2000} ккал`);
    }

    if (goal === 'lose') {
      explanation.push('Выбраны низкокалорийные блюда для похудения');
    } else if (goal === 'gain') {
      explanation.push('Добавлены питательные блюда для набора массы');
    }

    if (settings.preferQuick) {
      explanation.push('Приоритет быстрым блюдам');
    }

    if (!settings.includePublicRecipes) {
      explanation.push('Использованы только ваши рецепты');
    }

    return explanation;
  }

  async generate(userId: string, dto: GenerateMealPlanDto): Promise<MealPlanDocument> {
    const today = this.getToday();
    const startDate = dto.startDate || today;
    const endDate = dto.mode === 'day' ? startDate : this.addDays(startDate, 6);

    // Get profile targets
    const { targets, profile } = await this.profileService.getProfile(userId);
    const kcalTarget = dto.kcalTarget || targets?.kcalTarget || 2000;
    const proteinTargetG = dto.proteinTargetG || targets?.proteinTargetG || 100;
    const fatTargetG = targets?.fatTargetG || 60;
    const carbTargetG = targets?.carbTargetG || 250;
    const goal = profile?.goal || 'maintain';

    // Get already eaten for today (if day mode + considerEaten)
    let remainingKcal = kcalTarget;
    let remainingProtein = proteinTargetG;

    if (dto.mode === 'day' && dto.considerEaten) {
      const entries = await this.entryModel.find({
        userId: new Types.ObjectId(userId),
        date: startDate,
      }).lean();

      const eaten = entries.reduce(
        (acc, e) => ({
          kcal: acc.kcal + (e.kcal || 0),
          protein: acc.protein + (e.protein || 0),
        }),
        { kcal: 0, protein: 0 },
      );

      remainingKcal = Math.max(200, kcalTarget - eaten.kcal);
      remainingProtein = Math.max(20, proteinTargetG - eaten.protein);
    }

    // Collect and filter candidates
    const allCandidates = await this.collectCandidates(userId, dto);
    const filtered = this.filterCandidates(allCandidates, dto);

    if (filtered.length === 0) {
      throw new BadRequestException('Нет доступных рецептов или продуктов для составления плана');
    }

    const mealCount = dto.mealCount || 3;
    const slots = this.getMealSlots(mealCount);
    const explanation = this.generateExplanation(dto, remainingKcal, remainingProtein, dto.mode, goal);
    const usedNames = new Set<string>();

    // Generate days
    const days: PlanDay[] = [];
    const totalDays = dto.mode === 'day' ? 1 : 7;

    for (let d = 0; d < totalDays; d++) {
      const date = this.addDays(startDate, d);
      const dayKcal = dto.mode === 'day' ? remainingKcal : kcalTarget;
      const dayProtein = dto.mode === 'day' ? remainingProtein : proteinTargetG;

      // Reset used names for each day to allow some repetition across days
      if (d > 0) usedNames.clear();

      const meals: PlanMeal[] = [];

      for (const slot of slots) {
        const items: PlanItem[] = [];

        // Select one main item
        const item = this.selectItemForMeal(
          filtered, slot, dayKcal, dayProtein, usedNames, dto.preferQuick || false,
        );
        if (item) items.push(item);

        const mealKcal = items.reduce((s, i) => s + i.kcal, 0);
        const mealProtein = items.reduce((s, i) => s + i.protein, 0);
        const mealFat = items.reduce((s, i) => s + i.fat, 0);
        const mealCarb = items.reduce((s, i) => s + i.carb, 0);

        meals.push({
          mealType: slot.mealType,
          title: slot.title,
          items,
          totalKcal: this.round(mealKcal),
          totalProtein: this.round(mealProtein),
          totalFat: this.round(mealFat),
          totalCarb: this.round(mealCarb),
        });
      }

      const dayTotalKcal = meals.reduce((s, m) => s + m.totalKcal, 0);
      const dayTotalProtein = meals.reduce((s, m) => s + m.totalProtein, 0);
      const dayTotalFat = meals.reduce((s, m) => s + m.totalFat, 0);
      const dayTotalCarb = meals.reduce((s, m) => s + m.totalCarb, 0);

      days.push({
        date,
        meals,
        totalKcal: this.round(dayTotalKcal),
        totalProtein: this.round(dayTotalProtein),
        totalFat: this.round(dayTotalFat),
        totalCarb: this.round(dayTotalCarb),
      });
    }

    // Calculate score
    const avgKcal = days.reduce((s, d) => s + d.totalKcal, 0) / days.length;
    const kcalDiff = Math.abs(avgKcal - kcalTarget) / kcalTarget;
    const score = Math.round(Math.max(0, 100 - kcalDiff * 100));

    const plan = new this.mealPlanModel({
      userId: new Types.ObjectId(userId),
      dateFrom: startDate,
      dateTo: endDate,
      mode: dto.mode,
      status: 'draft',
      title: dto.mode === 'day' ? `План на ${startDate}` : `План на неделю ${startDate}`,
      settings: {
        kcalTarget,
        proteinTargetG,
        fatTargetG,
        carbTargetG,
        mealCount,
        includePublicRecipes: dto.includePublicRecipes !== false,
        preferQuick: dto.preferQuick || false,
        excludedTags: dto.excludedTags || [],
        excludedProductNames: dto.excludedProductNames || [],
        goal,
        considerEaten: dto.considerEaten || false,
      },
      days,
      score,
      explanation,
    });

    return plan.save();
  }

  async list(userId: string): Promise<any[]> {
    return this.mealPlanModel
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();
  }

  async findById(id: string, userId: string): Promise<MealPlanDocument> {
    const plan = await this.mealPlanModel.findById(id).exec();
    if (!plan) throw new NotFoundException('План не найден');
    if (plan.userId.toString() !== userId) throw new ForbiddenException('Доступ запрещён');
    return plan;
  }

  async apply(id: string, userId: string): Promise<{ created: number }> {
    const plan = await this.findById(id, userId);

    if (plan.status === 'applied') {
      throw new BadRequestException('План уже применён');
    }

    let created = 0;

    for (const day of plan.days) {
      for (const meal of day.meals) {
        for (const item of meal.items) {
          const entry = new this.entryModel({
            userId: new Types.ObjectId(userId),
            date: day.date,
            mealType: meal.mealType,
            productId: item.sourceType === 'product' ? item.sourceId : undefined,
            productName: item.name,
            grams: item.grams,
            kcalPer100g: this.round(item.kcal / (item.grams / 100)),
            proteinPer100g: this.round(item.protein / (item.grams / 100)),
            fatPer100g: this.round(item.fat / (item.grams / 100)),
            carbPer100g: this.round(item.carb / (item.grams / 100)),
            kcal: item.kcal,
            protein: item.protein,
            fat: item.fat,
            carb: item.carb,
          });
          await entry.save();
          created++;
        }
      }
    }

    plan.status = 'applied';
    await plan.save();

    return { created };
  }

  async archive(id: string, userId: string): Promise<void> {
    const plan = await this.findById(id, userId);
    plan.status = 'archived';
    await plan.save();
  }

  async replaceItem(id: string, userId: string, dto: ReplaceItemDto): Promise<MealPlanDocument> {
    const plan = await this.findById(id, userId);

    const day = plan.days[dto.dayIndex];
    if (!day) throw new BadRequestException('День не найден');

    const meal = day.meals[dto.mealIndex];
    if (!meal) throw new BadRequestException('Приём пищи не найден');

    const oldItem = meal.items[dto.itemIndex];
    if (!oldItem) throw new BadRequestException('Элемент не найден');

    // Find replacement
    const allCandidates = await this.collectCandidates(userId, {
      mode: plan.mode,
      includePublicRecipes: plan.settings.includePublicRecipes,
      preferQuick: plan.settings.preferQuick,
      excludedTags: plan.settings.excludedTags,
      excludedProductNames: plan.settings.excludedProductNames,
    });
    const filtered = this.filterCandidates(allCandidates, {
      mode: plan.mode,
      includePublicRecipes: plan.settings.includePublicRecipes,
      excludedTags: plan.settings.excludedTags,
      excludedProductNames: plan.settings.excludedProductNames,
    });

    // Find candidates that are not the current item
    const alternatives = filtered
      .filter(c => c.sourceId !== oldItem.sourceId?.toString() && c.name !== oldItem.name)
      .map(c => ({
        candidate: c,
        score: this.scoreCandidate(
          c,
          meal.totalKcal / meal.items.length,
          meal.totalProtein / meal.items.length,
          meal.mealType,
          new Set([oldItem.name]),
          plan.settings.preferQuick,
        ),
      }))
      .sort((a, b) => b.score - a.score);

    if (alternatives.length === 0) {
      throw new BadRequestException('Нет альтернатив для замены');
    }

    const replacement = alternatives[0].candidate;
    const grams = Math.max(50, Math.min(600, oldItem.grams));
    const factor = grams / 100;

    const newItem: PlanItem = {
      sourceType: replacement.sourceType,
      sourceId: new Types.ObjectId(replacement.sourceId),
      name: replacement.name,
      grams,
      kcal: this.round(replacement.kcalPer100g * factor),
      protein: this.round(replacement.proteinPer100g * factor),
      fat: this.round(replacement.fatPer100g * factor),
      carb: this.round(replacement.carbPer100g * factor),
      photoUrl: replacement.photoUrl,
      authorName: replacement.authorName,
    };

    meal.items[dto.itemIndex] = newItem;

    // Recalculate meal totals
    meal.totalKcal = this.round(meal.items.reduce((s, i) => s + i.kcal, 0));
    meal.totalProtein = this.round(meal.items.reduce((s, i) => s + i.protein, 0));
    meal.totalFat = this.round(meal.items.reduce((s, i) => s + i.fat, 0));
    meal.totalCarb = this.round(meal.items.reduce((s, i) => s + i.carb, 0));

    // Recalculate day totals
    day.totalKcal = this.round(day.meals.reduce((s, m) => s + m.totalKcal, 0));
    day.totalProtein = this.round(day.meals.reduce((s, m) => s + m.totalProtein, 0));
    day.totalFat = this.round(day.meals.reduce((s, m) => s + m.totalFat, 0));
    day.totalCarb = this.round(day.meals.reduce((s, m) => s + m.totalCarb, 0));

    return plan.save();
  }

  // One template per meal so each keeps its meal type (breakfast/lunch/...)
  async saveAsTemplate(id: string, userId: string, dayIndex: number = 0): Promise<MealTemplateDocument[]> {
    const plan = await this.findById(id, userId);

    const day = plan.days[dayIndex];
    if (!day) throw new BadRequestException('День не найден');

    const templates: MealTemplateDocument[] = [];
    for (const meal of day.meals) {
      if (!meal.items.length) continue;

      const items = meal.items.map(item => ({
        productId: item.sourceType === 'product' ? item.sourceId : undefined,
        productName: item.name,
        grams: item.grams,
        kcal: item.kcal,
        kcalPer100g: this.round(item.kcal / (item.grams / 100)),
      }));

      const template = await new this.templateModel({
        userId: new Types.ObjectId(userId),
        name: `${meal.title} · план ${day.date}`,
        mealType: meal.mealType || 'other',
        items,
        totalKcal: this.round(meal.totalKcal),
      }).save();
      templates.push(template);
    }

    if (!templates.length) throw new BadRequestException('В этом дне нет блюд для сохранения');
    return templates;
  }
}
