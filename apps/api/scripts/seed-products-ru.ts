import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { getModelToken } from '@nestjs/mongoose';
import { products } from '../data/products-full';
import * as crypto from 'crypto';

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const productModel = app.get(getModelToken('Product'));

  console.log(`Seeding ${products.length} products...\n`);

  let created = 0;
  let skipped = 0;
  let errors = 0;

  for (const p of products) {
    const nameNormalized = p.name.trim().replace(/\s+/g, ' ').toLowerCase();
    const sourceId = crypto.createHash('md5').update(nameNormalized).digest('hex').slice(0, 12);

    try {
      const existing = await productModel.findOne({ source: 'CUSTOM_SEED', sourceId });
      if (existing) {
        skipped++;
        continue;
      }

      await productModel.create({
        ...p,
        nameNormalized,
        source: 'CUSTOM_SEED',
        sourceId,
      });
      created++;
    } catch (err: any) {
      if (err.code === 11000) {
        skipped++;
      } else {
        errors++;
        console.error(`Error: ${p.name}: ${err.message}`);
      }
    }
  }

  console.log(`\nDone! Created: ${created}, Skipped: ${skipped}, Errors: ${errors}`);
  console.log(`Total in DB: ${await productModel.countDocuments()}`);
  await app.close();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
