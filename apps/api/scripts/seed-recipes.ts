import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { getModelToken } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { RECIPES, IngredientInput } from '../data/seed/recipes-data';

// ─── Interfaces ───────────────────────────────────────────────────────────────

interface ProductDoc {
  _id: Types.ObjectId;
  name: string;
  nameNormalized: string;
  kcalPer100g: number;
  proteinPer100g: number;
  fatPer100g: number;
  carbPer100g: number;
  source: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function round(v: number): number {
  return Math.round(v * 100) / 100;
}

function normalizeName(name: string): string {
  return name.trim().replace(/\s+/g, ' ').toLowerCase();
}

const productCache = new Map<string, ProductDoc>();

function findProduct(name: string): ProductDoc | undefined {
  return productCache.get(normalizeName(name));
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule);

  const recipeModel = app.get(getModelToken('Recipe'));
  const productModel = app.get(getModelToken('Product'));
  const userModel = app.get(getModelToken('User'));

  // 1. Find or create test user
  const testEmail = 'megamanok99@gmail.com';
  let user = await userModel.findOne({ email: testEmail });
  if (!user) {
    console.log(`User ${testEmail} not found, creating...`);
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash('testtest', 10);
    user = await userModel.create({
      email: testEmail,
      password: hashedPassword,
      username: 'megamanok',
      displayName: 'MegaManok',
      avatarEmoji: '🦊',
      isPublicProfile: true,
    });
    console.log(`Created user: ${user.email} (${user._id})`);
  } else {
    console.log(`Found user: ${user.email} (${user._id})`);
  }
  const userId = user._id as Types.ObjectId;

  // 2. Load all products into cache
  const allProducts: ProductDoc[] = await productModel.find({}).lean();
  for (const p of allProducts) {
    productCache.set(normalizeName(p.name), p as unknown as ProductDoc);
  }
  console.log(`Loaded ${allProducts.length} products into cache`);

  // 3. Create missing products for ingredients that don't exist
  const missingProductNames = new Set<string>();
  for (const recipe of RECIPES) {
    for (const ing of recipe.ingredients) {
      if (!findProduct(ing.productName)) {
        missingProductNames.add(ing.productName);
      }
    }
  }

  if (missingProductNames.size > 0) {
    console.log(`\n${missingProductNames.size} products missing, creating seed products...`);
    for (const name of missingProductNames) {
      const nameNorm = normalizeName(name);
      const existing = await productModel.findOne({ nameNormalized: nameNorm });
      if (existing) {
        productCache.set(nameNorm, existing as unknown as ProductDoc);
        continue;
      }
      // Create a placeholder product with approximate values
      // These will be used as ingredient references
      const approxKcal = estimateKcal(name);
      const created = await productModel.create({
        name,
        nameNormalized: nameNorm,
        kcalPer100g: approxKcal.kcal,
        proteinPer100g: approxKcal.protein,
        fatPer100g: approxKcal.fat,
        carbPer100g: approxKcal.carb,
        source: 'CUSTOM_SEED',
        sourceId: `recipe-seed-${nameNorm.replace(/\s+/g, '-')}`,
        createdBy: userId,
        verified: false,
      });
      productCache.set(nameNorm, created as unknown as ProductDoc);
      console.log(`  [+] ${name}: ${approxKcal.kcal} ккал`);
    }
  }

  // 4. Seed recipes
  console.log(`\n=== Seeding ${RECIPES.length} recipes ===\n`);

  let created = 0;
  let updated = 0;
  let skipped = 0;
  let errors = 0;

  for (const def of RECIPES) {
    try {
      const nameNorm = normalizeName(def.name);

      // Calculate ingredient nutrition
      const ingredients = def.ingredients.map((ing) => {
        const product = findProduct(ing.productName);
        const kcalPer100g = product ? product.kcalPer100g : estimateKcal(ing.productName).kcal;
        const proteinPer100g = product ? product.proteinPer100g : estimateKcal(ing.productName).protein;
        const fatPer100g = product ? product.fatPer100g : estimateKcal(ing.productName).fat;
        const carbPer100g = product ? product.carbPer100g : estimateKcal(ing.productName).carb;
        const factor = ing.grams / 100;
        return {
          productId: product ? product._id : undefined,
          productName: ing.productName,
          grams: ing.grams,
          kcalPer100g,
          proteinPer100g,
          fatPer100g,
          carbPer100g,
          kcal: round(kcalPer100g * factor),
          protein: round(proteinPer100g * factor),
          fat: round(fatPer100g * factor),
          carb: round(carbPer100g * factor),
        };
      });

      // Calculate totals from ingredients
      const totalKcal = round(ingredients.reduce((s, i) => s + i.kcal, 0));
      const totalProtein = round(ingredients.reduce((s, i) => s + i.protein, 0));
      const totalFat = round(ingredients.reduce((s, i) => s + i.fat, 0));
      const totalCarb = round(ingredients.reduce((s, i) => s + i.carb, 0));

      const weight = def.totalCookedWeightG;
      const kcalPer100g = round(totalKcal / weight * 100);
      const proteinPer100g = round(totalProtein / weight * 100);
      const fatPer100g = round(totalFat / weight * 100);
      const carbPer100g = round(totalCarb / weight * 100);

      // Sanity check: sum of macros per 100g should be <= 100
      const macrosSum = proteinPer100g + fatPer100g + carbPer100g;
      if (macrosSum > 100) {
        console.log(`  [!] SKIP "${def.name}": macros sum ${macrosSum.toFixed(1)} > 100g`);
        skipped++;
        continue;
      }

      // Sanity check: kcal should roughly match macros
      const expectedKcal = proteinPer100g * 4 + fatPer100g * 9 + carbPer100g * 4;
      if (kcalPer100g > 0 && expectedKcal > 0) {
        const diff = Math.abs(kcalPer100g - expectedKcal);
        const pctDiff = (diff / expectedKcal) * 100;
        if (pctDiff > 40) {
          console.log(`  [!] WARN "${def.name}": kcal ${kcalPer100g} vs expected ${Math.round(expectedKcal)} (${pctDiff.toFixed(0)}% diff)`);
        }
      }

      // Upsert by userId + nameNormalized
      const existing = await recipeModel.findOne({ userId, nameNormalized: nameNorm });

      const recipeData = {
        userId,
        name: def.name.trim().replace(/\s+/g, ' '),
        nameNormalized: nameNorm,
        description: def.description,
        mealTypes: def.mealTypes,
        tags: def.tags,
        servingName: def.servingName,
        servingGrams: def.servingGrams,
        totalCookedWeightG: weight,
        calculationMode: 'ingredients' as const,
        ingredients,
        kcalPer100g,
        proteinPer100g,
        fatPer100g,
        carbPer100g,
        totalKcal,
        totalProtein,
        totalFat,
        totalCarb,
        isArchived: false,
      };

      if (existing) {
        await recipeModel.updateOne({ _id: existing._id }, recipeData);
        updated++;
      } else {
        await recipeModel.create(recipeData);
        created++;
      }
    } catch (err: any) {
      errors++;
      console.error(`  [ERROR] ${def.name}: ${err.message}`);
    }
  }

  // 5. Summary
  console.log('\n=== Summary ===');
  console.log(`Recipes created: ${created}`);
  console.log(`Recipes updated: ${updated}`);
  console.log(`Recipes skipped: ${skipped}`);
  console.log(`Errors: ${errors}`);
  console.log(`Products in DB: ${await productModel.countDocuments()}`);
  console.log(`Recipes in DB for user: ${await recipeModel.countDocuments({ userId })}`);

  await app.close();
}

// Approximate nutrition for missing products
function estimateKcal(name: string): { kcal: number; protein: number; fat: number; carb: number } {
  const n = name.toLowerCase();
  // Grains/pasta
  if (n.includes('овсян') || n.includes('овес')) return { kcal: 352, protein: 12.3, fat: 6.2, carb: 61.8 };
  if (n.includes('гречк')) return { kcal: 343, protein: 12.6, fat: 3.3, carb: 71.5 };
  if (n.includes('рис')) return { kcal: 344, protein: 6.7, fat: 0.7, carb: 78.9 };
  if (n.includes('пшен')) return { kcal: 378, protein: 11.5, fat: 3.3, carb: 69.3 };
  if (n.includes('манн')) return { kcal: 333, protein: 10.3, fat: 1.0, carb: 73.3 };
  if (n.includes('ячнев')) return { kcal: 324, protein: 10.4, fat: 1.3, carb: 71.7 };
  if (n.includes('перлов')) return { kcal: 352, protein: 9.3, fat: 1.1, carb: 77.7 };
  if (n.includes('кукурузн')) return { kcal: 337, protein: 8.3, fat: 1.2, carb: 75.0 };
  if (n.includes('булгур')) return { kcal: 342, protein: 12.3, fat: 1.3, carb: 75.9 };
  if (n.includes('киноа')) return { kcal: 368, protein: 14.1, fat: 6.1, carb: 64.2 };
  if (n.includes('макарон') || n.includes('спагет') || n.includes('фузил') || n.includes('лист.*лазан')) return { kcal: 350, protein: 11.0, fat: 1.5, carb: 72.0 };
  if (n.includes('вермишел')) return { kcal: 348, protein: 11.0, fat: 1.5, carb: 71.0 };
  // Bread
  if (n.includes('хлеб')) return { kcal: 250, protein: 8.0, fat: 1.0, carb: 50.0 };
  if (n.includes('булочк')) return { kcal: 280, protein: 8.5, fat: 3.0, carb: 52.0 };
  if (n.includes('хлебц')) return { kcal: 300, protein: 10.0, fat: 2.0, carb: 60.0 };
  // Sweeteners
  if (n === 'сахар') return { kcal: 387, protein: 0, fat: 0, carb: 99.8 };
  if (n.includes('мёд') || n.includes('мед')) return { kcal: 329, protein: 0.8, fat: 0, carb: 81.5 };
  // Nuts
  if (n.includes('орех.*грец')) return { kcal: 654, protein: 15.2, fat: 65.2, carb: 13.7 };
  if (n.includes('миндал')) return { kcal: 579, protein: 21.2, fat: 49.9, carb: 21.6 };
  if (n.includes('арахис.*паст')) return { kcal: 588, protein: 25.0, fat: 50.0, carb: 20.0 };
  // Fruits
  if (n.includes('банан')) return { kcal: 89, protein: 1.1, fat: 0.3, carb: 22.8 };
  if (n.includes('яблок')) return { kcal: 52, protein: 0.3, fat: 0.2, carb: 13.8 };
  if (n.includes('клубник')) return { kcal: 32, protein: 0.7, fat: 0.3, carb: 7.7 };
  if (n.includes('черник')) return { kcal: 57, protein: 0.7, fat: 0.3, carb: 14.5 };
  if (n.includes('вишн')) return { kcal: 50, protein: 1.0, fat: 0.3, carb: 12.2 };
  if (n.includes('кураг')) return { kcal: 215, protein: 5.2, fat: 0.3, carb: 51.0 };
  if (n.includes('изюм')) return { kcal: 299, protein: 3.1, fat: 0.5, carb: 79.2 };
  if (n.includes('лимон')) return { kcal: 29, protein: 1.1, fat: 0.3, carb: 9.3 };
  // Vegetables
  if (n.includes('тыкв')) return { kcal: 26, protein: 1.0, fat: 0.1, carb: 6.5 };
  if (n.includes('кабач')) return { kcal: 17, protein: 1.2, fat: 0.3, carb: 3.1 };
  if (n.includes('баклаж')) return { kcal: 25, protein: 1.0, fat: 0.1, carb: 5.9 };
  if (n.includes('брокколи')) return { kcal: 34, protein: 2.8, fat: 0.4, carb: 6.6 };
  if (n.includes('цветн.*капуст')) return { kcal: 25, protein: 1.9, fat: 0.3, carb: 5.0 };
  if (n.includes('шампиньон')) return { kcal: 22, protein: 3.1, fat: 0.3, carb: 3.3 };
  if (n.includes('редис')) return { kcal: 16, protein: 0.7, fat: 0.1, carb: 3.4 };
  if (n.includes('огурец.*солё') || n.includes('огурец.*солен')) return { kcal: 11, protein: 0.8, fat: 0.1, carb: 1.6 };
  if (n.includes('салат.*айсберг')) return { kcal: 14, protein: 0.9, fat: 0.1, carb: 2.9 };
  if (n.includes('чеснок')) return { kcal: 149, protein: 6.4, fat: 0.5, carb: 33.1 };
  if (n.includes('нут')) return { kcal: 364, protein: 19.3, fat: 6.0, carb: 60.6 };
  if (n.includes('фасоль')) return { kcal: 333, protein: 21.0, fat: 1.4, carb: 60.3 };
  if (n.includes('горох.*колот')) return { kcal: 323, protein: 23.0, fat: 1.6, carb: 57.5 };
  // Meat/canned
  if (n.includes('тушёнк') || n.includes('тушенк')) return { kcal: 190, protein: 16.0, fat: 13.0, carb: 0 };
  if (n.includes('тунец.*консерв')) return { kcal: 116, protein: 25.5, fat: 1.0, carb: 0 };
  if (n.includes('кукуруз') && !n.includes('крупа')) return { kcal: 86, protein: 3.2, fat: 1.2, carb: 19.0 };
  if (n.includes('горошек.*зелё') || n.includes('горошек.*зелен')) return { kcal: 55, protein: 3.6, fat: 0.2, carb: 8.8 };
  // Dairy
  if (n.includes('ряженк')) return { kcal: 54, protein: 2.9, fat: 2.5, carb: 4.2 };
  if (n.includes('йогурт')) return { kcal: 60, protein: 4.3, fat: 1.5, carb: 6.2 };
  if (n.includes('кефир')) return { kcal: 40, protein: 3.0, fat: 1.0, carb: 4.0 };
  // Other
  if (n.includes('масло.*подсол')) return { kcal: 899, protein: 0, fat: 99.9, carb: 0 };
  if (n.includes('мука')) return { kcal: 342, protein: 10.3, fat: 1.1, carb: 72.0 };
  if (n.includes('сметана')) return { kcal: 116, protein: 2.7, fat: 10.0, carb: 3.9 };
  if (n.includes('сгущёнк') || n.includes('сгущенк')) return { kcal: 328, protein: 7.2, fat: 8.5, carb: 56.0 };
  if (n.includes('соев.*соус')) return { kcal: 53, protein: 8.1, fat: 0, carb: 4.9 };
  if (n.includes('баранин')) return { kcal: 203, protein: 16.5, fat: 15.0, carb: 0 };
  if (n.includes('копчёност') || n.includes('копченост')) return { kcal: 300, protein: 15.0, fat: 25.0, carb: 2.0 };
  // Default fallback
  return { kcal: 100, protein: 5.0, fat: 3.0, carb: 15.0 };
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
