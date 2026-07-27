// Mirrors exercise illustrations from wger.de (openly CC-licensed) into our S3
// so the app does not depend on external hosting, and links them to exercises.
// Matching: our RU names -> candidate EN names -> wger exercise id -> main image.
// Exercises already pointing at our S3 (own animations / previous runs) are skipped.
// Run: pnpm --filter api seed:wger-images
import { NestFactory } from '@nestjs/core';
import { getModelToken } from '@nestjs/mongoose';
import { AppModule } from '../src/app.module';
import { StorageService } from '../src/storage/storage.service';

// our exercise name -> wger English names, in priority order
const EN_CANDIDATES: Record<string, string[]> = {
  'Жим штанги лёжа': ['Bench Press', 'Barbell Bench Press'],
  'Жим гантелей лёжа': ['Dumbbell Bench Press'],
  'Разведение гантелей лёжа': ['Dumbbell Flyes', 'Dumbbell Fly', 'Flyes'],
  'Сведение рук в кроссовере': ['Cable Crossover'],
  'Отжимания на брусьях': ['Dips', 'Chest Dips'],
  'Тяга штанги в наклоне': ['Bent Over Row', 'Barbell Row', 'Bent Over Rowing'],
  'Тяга гантели в наклоне': ['One Arm Dumbbell Row', 'Dumbbell Row'],
  'Тяга верхнего блока': ['Lat Pulldown', 'Lat Pull Down'],
  'Тяга горизонтального блока': ['Seated Cable Row', 'Cable Seated Row', 'Seated Row'],
  'Становая тяга': ['Deadlift', 'Dead Lift'],
  'Выпады с гантелями': ['Dumbbell Lunges', 'Walking Lunges', 'Lunges'],
  'Жим ногами': ['Leg Press'],
  'Румынская тяга': ['Romanian Deadlift'],
  'Разгибания ног в тренажёре': ['Leg Extension', 'Leg Extensions'],
  'Сгибания ног в тренажёре': ['Leg Curl', 'Leg Curls', 'Lying Leg Curl'],
  'Подъёмы на носки': ['Standing Calf Raises', 'Calf Raises', 'Calf Raise'],
  'Жим гантелей стоя': ['Dumbbell Shoulder Press', 'Shoulder Press'],
  'Разведение гантелей в стороны': ['Lateral Raises', 'Lateral Raise', 'Side Lateral Raise'],
  'Тяга гантелей к подбородку': ['Upright Row'],
  'Махи гантелей в наклоне': ['Rear Delt Fly', 'Bent Over Lateral Raise', 'Reverse Fly'],
  'Жим Арнольда': ['Arnold Press'],
  'Сгибания рук со штангой стоя': ['Barbell Curl', 'Biceps Curl', 'Standing Biceps Curl'],
  'Молотковые сгибания': ['Hammer Curl', 'Hammer Curls', 'Bicep Hammer Curl'],
  'Французский жим': ['French Press', 'Skull Crusher', 'Lying Triceps Extension'],
  'Разгибания на трицепс на блоке': ['Tricep Pushdown', 'Triceps Pushdown', 'Cable Triceps Extension'],
  'Сгибания рук с гантелями на скамье': ['Incline Dumbbell Curl', 'Seated Dumbbell Curl'],
  'Отжимания узким хватом': ['Close Grip Push Up', 'Diamond Push Up', 'Close-Grip Push-Up'],
  'Скручивания на полу': ['Crunches', 'Crunch'],
  'Подъём ног лёжа': ['Lying Leg Raise', 'Leg Raises', 'Laying Leg Raises'],
  'Русские скручивания': ['Russian Twist'],
  'Велосипед': ['Bicycle Crunch', 'Bicycle'],
  'Подъём ног в висе': ['Hanging Leg Raise', 'Hanging Leg Raises'],
  'Обратные скручивания': ['Reverse Crunch'],
  'Ножницы': ['Scissor Kick', 'Scissors', 'Flutter Kicks'],
  'Подъём согнутых ног лёжа': ['Lying Knee Raise', 'Bent Knee Leg Raise', 'Knee Raise'],
  'Планка на прямых руках': ['High Plank', 'Hand Plank', 'Plank'],
  'Планка с прыжками': ['Plank Jack'],
  'Бег на месте': ['Jog In Place', 'Running', 'Jogging'],
  'Прыжки на скакалке': ['Jump Rope', 'Rope Skipping', 'Skipping'],
  'Бёрпи': ['Burpee', 'Burpees'],
  'Горные альпинисты': ['Mountain Climber', 'Mountain Climbers'],
  'Высокие колени': ['High Knees', 'High Knee Run'],
  'Скалолаз': ['Slow Tempo Mountain Climber', 'Mountain Climber'],
};

// node's undici gets ECONNRESET from wger.de mid-body; curl is reliable here
import { execFileSync } from 'child_process';

const UA = 'FlareonFit-local-mirror/1.0 (personal non-commercial app)';

const TRANSLIT: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z', и: 'i', й: 'y',
  к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f',
  х: 'h', ц: 'c', ч: 'ch', ш: 'sh', щ: 'sch', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya',
};

// ASCII-only S3 keys: some HTTP clients do not percent-encode Cyrillic paths
function translit(name: string): string {
  return name
    .toLowerCase()
    .split('')
    .map((ch) => (TRANSLIT[ch] !== undefined ? TRANSLIT[ch] : ch))
    .join('')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function curlBuffer(url: string, attempts = 3): Buffer | null {
  for (let i = 0; i < attempts; i++) {
    try {
      const out = execFileSync('curl', ['-sfL', '--max-time', '30', '-A', UA, url], {
        maxBuffer: 20 * 1024 * 1024,
      });
      if (out.length > 0) return out;
    } catch {
      // retry after a pause
    }
    if (i < attempts - 1) execFileSync('ping', ['-n', '2', '127.0.0.1'], { stdio: 'ignore' });
  }
  return null;
}

function fetchAllPages(baseUrl: string): any[] {
  const items: any[] = [];
  let next: string | null = baseUrl;
  while (next) {
    const buf = curlBuffer(next);
    if (!buf) break;
    const data: any = JSON.parse(buf.toString('utf8'));
    items.push(...(data.results || []));
    next = data.next;
  }
  return items;
}

async function run() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const storage = app.get(StorageService);
  const exerciseModel = app.get(getModelToken('Exercise'));
  const logModel = app.get(getModelToken('WorkoutLog'));

  console.log('Загружаю каталог wger...');
  const images = fetchAllPages('https://wger.de/api/v2/exerciseimage/?format=json&limit=100');
  const translations = fetchAllPages('https://wger.de/api/v2/exercise-translation/?format=json&limit=200&language=2');

  const imageByExercise = new Map<number, string>();
  for (const img of images) {
    if (img.image && (img.is_main || !imageByExercise.has(img.exercise))) {
      imageByExercise.set(img.exercise, img.image);
    }
  }
  const idsByName = new Map<string, number[]>();
  for (const tr of translations) {
    const key = (tr.name || '').toLowerCase().trim();
    if (!key) continue;
    if (!idsByName.has(key)) idsByName.set(key, []);
    idsByName.get(key)!.push(tr.exercise);
  }
  console.log(`Картинок: ${imageByExercise.size}, переводов (en): ${translations.length}\n`);

  const findImage = (candidates: string[]): string | null => {
    // exact name first, then prefix/substring — but only exercises that have an image
    for (const cand of candidates) {
      const ids = idsByName.get(cand.toLowerCase()) || [];
      for (const id of ids) if (imageByExercise.has(id)) return imageByExercise.get(id)!;
    }
    for (const cand of candidates) {
      const needle = cand.toLowerCase();
      for (const [name, ids] of idsByName) {
        if (name.startsWith(needle) || name.includes(needle)) {
          for (const id of ids) if (imageByExercise.has(id)) return imageByExercise.get(id)!;
        }
      }
    }
    return null;
  };

  const ownPrefix = storage.publicUrlPrefix();
  const exercises = await exerciseModel.find().exec();
  let mirrored = 0;
  let skipped = 0;

  for (const ex of exercises) {
    const isOurs = typeof ex.gifUrl === 'string' && ex.gifUrl.startsWith(ownPrefix);
    // re-mirror old Cyrillic-keyed wger objects to ASCII keys; keep own animations
    const isLegacyCyrillicKey = isOurs && ex.gifUrl.includes('/exercises/wger/') && /[а-яё]/i.test(ex.gifUrl);
    if (isOurs && !isLegacyCyrillicKey) {
      skipped++; // own animation or already mirrored
      continue;
    }
    const oldUrl = isLegacyCyrillicKey ? ex.gifUrl : null;
    const candidates = EN_CANDIDATES[ex.name];
    if (!candidates) {
      console.log(`  [?] ${ex.name}: нет карты соответствия, пропускаю`);
      continue;
    }
    const sourceUrl = findImage(candidates);
    if (!sourceUrl) {
      console.log(`  [?] ${ex.name}: иллюстрация на wger не найдена`);
      continue;
    }

    const buffer = curlBuffer(sourceUrl);
    if (!buffer) {
      console.log(`  [!] ${ex.name}: не удалось скачать ${sourceUrl}`);
      continue;
    }
    const ext = (sourceUrl.split('.').pop() || 'png').toLowerCase().replace(/[^a-z0-9]/g, '') || 'png';
    const mime = ext === 'gif' ? 'image/gif' : ext === 'webp' ? 'image/webp' : ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : 'image/png';
    const slug = translit(ex.name);
    const url = await storage.uploadObject(`exercises/wger/${slug}.${ext}`, buffer, mime);

    ex.gifUrl = url;
    await ex.save();
    if (oldUrl) await storage.deleteObjectByUrl(oldUrl);
    await logModel.updateMany({ exerciseId: ex._id }, { gifUrl: url });
    mirrored++;
    console.log(`  [+] ${ex.name} -> ${url} (${Math.round(buffer.length / 1024)} КБ)`);
  }

  console.log(`\nГотово: скачано и привязано ${mirrored}, пропущено (своя анимация/уже есть) ${skipped}.`);
  await app.close();
}

run().catch((err) => {
  console.error('Mirror failed:', err);
  process.exit(1);
});
