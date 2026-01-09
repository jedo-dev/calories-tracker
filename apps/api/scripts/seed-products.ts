import { ConfigModule, ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { MongooseModule, getModelToken } from '@nestjs/mongoose';
import * as fs from 'fs';
import { Model } from 'mongoose';
import * as path from 'path';
import * as readline from 'readline';
import { Product, ProductSchema } from '../src/products/schemas/product.schema';

interface SeedProduct {
  name: string;
  nameNormalized: string;
  kcalPer100g: number;
  proteinPer100g: number;
  fatPer100g: number;
  carbPer100g: number;
  source: 'OFF' | 'CUSTOM_SEED';
  sourceId?: string;
}

interface Summary {
  processed: number;
  inserted: number;
  updated: number;
  skippedNoName: number;
  skippedNoKcal: number;
  missingMacros: number;
}

function normalizeName(name: string): string {
  return name.trim().replace(/\s+/g, ' ').toLowerCase();
}

function parseLine(line: string): { product: SeedProduct | null; missingMacros: boolean } {
  try {
    const data = JSON.parse(line);

    let product: Partial<SeedProduct> = {
      proteinPer100g: 0,
      fatPer100g: 0,
      carbPer100g: 0,
    };

    let missingMacros = false;

    if (data.nutriments) {
      product.name = data.product_name;
      product.kcalPer100g = data.nutriments['energy-kcal_100g'];
      product.proteinPer100g = data.nutriments['proteins_100g'] || 0;
      product.fatPer100g = data.nutriments['fat_100g'] || 0;
      product.carbPer100g = data.nutriments['carbohydrates_100g'] || 0;
      product.source = 'OFF';
      product.sourceId = data.code;
      if (!product.proteinPer100g && !product.fatPer100g && !product.carbPer100g) {
        missingMacros = true;
      }
    } else if (data.kcalPer100g !== undefined) {
      product.name = data.name;
      product.kcalPer100g = data.kcalPer100g;
      product.proteinPer100g = data.proteinPer100g || 0;
      product.fatPer100g = data.fatPer100g || 0;
      product.carbPer100g = data.carbPer100g || 0;
      product.source = 'CUSTOM_SEED';
      product.sourceId = data.sourceId;
      if (!product.proteinPer100g && !product.fatPer100g && !product.carbPer100g) {
        missingMacros = true;
      }
    } else {
      return { product: null, missingMacros: false };
    }

    if (!product.name || !product.kcalPer100g) {
      return { product: null, missingMacros: false };
    }

    product.nameNormalized = normalizeName(product.name);

    return {
      product: product as SeedProduct,
      missingMacros,
    };
  } catch (e) {
    return { product: null, missingMacros: false };
  }
}

async function seedProducts() {
  const filePath =
    process.argv[2] || process.env.SEED_FILE || path.join(__dirname, '../data/seed/products.jsonl');

  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    console.error('Please provide path to products.jsonl file');
    process.exit(1);
  }

  const summary: Summary = {
    processed: 0,
    inserted: 0,
    updated: 0,
    skippedNoName: 0,
    skippedNoKcal: 0,
    missingMacros: 0,
  };

  const app = await NestFactory.createApplicationContext({
    imports: [
      ConfigModule.forRoot(),
      MongooseModule.forRootAsync({
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => ({
          uri: configService.get<string>('MONGO_URI'),
        }),
      }),
      MongooseModule.forFeature([{ name: Product.name, schema: ProductSchema }]),
    ],
  });

  const productModel = app.get<Model<Product>>(getModelToken(Product.name));

  const fileStream = fs.createReadStream(filePath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  console.log(`Reading from: ${filePath}`);
  console.log('Processing...');

  for await (const line of rl) {
    if (!line.trim()) continue;

    summary.processed++;

    const { product: parsed, missingMacros: hasMissingMacros } = parseLine(line);

    if (!parsed) {
      summary.skippedNoName++;
      continue;
    }

    if (hasMissingMacros) {
      summary.missingMacros++;
    }

    try {
      const filter: any = {};
      if (parsed.sourceId) {
        filter.source = parsed.source;
        filter.sourceId = parsed.sourceId;
      } else {
        filter.source = parsed.source;
        filter.nameNormalized = parsed.nameNormalized;
      }

      const existing = await productModel.findOne(filter);

      const productData = {
        name: parsed.name.trim().replace(/\s+/g, ' '),
        nameNormalized: parsed.nameNormalized,
        kcalPer100g: parsed.kcalPer100g,
        proteinPer100g: parsed.proteinPer100g,
        fatPer100g: parsed.fatPer100g,
        carbPer100g: parsed.carbPer100g,
        source: parsed.source,
        ...(parsed.sourceId && { sourceId: parsed.sourceId }),
      };

      if (existing) {
        await productModel.updateOne(filter, productData);
        summary.updated++;
      } else {
        await productModel.create(productData);
        summary.inserted++;
      }
    } catch (error: any) {
      if (error.code === 11000) {
        summary.updated++;
      } else {
        console.error(`Error processing line ${summary.processed}:`, error.message);
      }
    }

    if (summary.processed % 1000 === 0) {
      console.log(
        `Processed: ${summary.processed}, Inserted: ${summary.inserted}, Updated: ${summary.updated}`,
      );
    }
  }

  await app.close();

  console.log('\n=== Summary ===');
  console.log(`Processed: ${summary.processed}`);
  console.log(`Inserted: ${summary.inserted}`);
  console.log(`Updated: ${summary.updated}`);
  console.log(`Skipped (no name): ${summary.skippedNoName}`);
  console.log(`Skipped (no kcal): ${summary.skippedNoKcal}`);
  console.log(`Missing macros: ${summary.missingMacros}`);
}

seedProducts().catch((error) => {
  console.error('Seed failed:', error);
  process.exit(1);
});
