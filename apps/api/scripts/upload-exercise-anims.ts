// Uploads animated exercise SVGs from assets/exercise-anims to S3 (MinIO)
// and points the matching Exercise.gifUrl at them.
// Run: pnpm --filter api seed:exercise-anims
import { NestFactory } from '@nestjs/core';
import { getModelToken } from '@nestjs/mongoose';
import { readFileSync } from 'fs';
import { join } from 'path';
import { AppModule } from '../src/app.module';
import { StorageService } from '../src/storage/storage.service';

// file in assets/exercise-anims -> exact Exercise.name in the DB
const ANIMATIONS: Record<string, string> = {
  'pushups.svg': 'Отжимания',
  'squat.svg': 'Приседания со штангой',
  'plank.svg': 'Планка',
  'pullups.svg': 'Подтягивания широким хватом',
  'jumping-jacks.svg': 'Jumping Jacks',
};

async function run() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const storage = app.get(StorageService);
  const exerciseModel = app.get(getModelToken('Exercise'));
  const logModel = app.get(getModelToken('WorkoutLog'));

  for (const [file, exerciseName] of Object.entries(ANIMATIONS)) {
    const path = join(__dirname, '..', 'assets', 'exercise-anims', file);
    const buffer = readFileSync(path);
    const url = await storage.uploadObject(`exercises/${file}`, buffer, 'image/svg+xml');

    const result = await exerciseModel.updateOne({ name: exerciseName }, { gifUrl: url });
    // keep denormalized copies in past workout logs in sync
    const logs = await logModel.updateMany({ exerciseName }, { gifUrl: url });
    if (result.matchedCount === 0) {
      console.log(`  [!] "${exerciseName}" not found in DB — uploaded ${url}, nothing linked`);
    } else {
      console.log(`  [+] ${exerciseName} -> ${url} (logs updated: ${logs.modifiedCount})`);
    }
  }

  await app.close();
}

run().catch((err) => {
  console.error('Upload failed:', err);
  process.exit(1);
});
