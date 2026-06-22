import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { getModelToken } from '@nestjs/mongoose';

const categories = [
  { name: 'Грудь', emoji: '💪', description: 'Верхняя часть тела — грудные мышцы', sortOrder: 1 },
  { name: 'Спина', emoji: '🔙', description: 'Широчайшие, трапеции, разгибатели', sortOrder: 2 },
  { name: 'Ноги', emoji: '🦵', description: 'Квадрицепсы, бицепс бедра, ягодицы, икры', sortOrder: 3 },
  { name: 'Плечи', emoji: '🏋️', description: 'Дельтовидные мышцы и трапеции', sortOrder: 4 },
  { name: 'Руки', emoji: '💪', description: 'Бицепс, трицепс, предплечья', sortOrder: 5 },
  { name: 'Пресс', emoji: '🔥', description: 'Мышцы кора и стабилизаторы', sortOrder: 6 },
  { name: 'Кардио', emoji: '❤️', description: 'Выносливость и сжигание калорий', sortOrder: 7 },
];

// GIF URLs — используются проверенные источники wger.de (open source)
// Если GIF не загрузится, на фронте есть onError fallback

const exercisesByCategory: Record<string, any[]> = {
  'Грудь': [
    {
      name: 'Жим штанги лёжа',
      description: 'Король упражнений на грудь. Развивает массу и силу грудных мышц, передних дельт и трицепсов.',
      gifUrl: 'https://static.wger.de/media/exercise-images/192/Barbell-bench-press-1.png',
      type: 'strength',
      metValue: 6.0,
      muscleGroups: ['Большая грудная', 'Трицепс', 'Передняя дельта'],
      difficulty: 'intermediate',
      equipment: 'Штанга, скамья',
      defaultSets: 4,
      defaultReps: 10,
    },
    {
      name: 'Жим гантелей лёжа',
      description: 'Большая амплитуда движения по сравнению со штангой. Хорошо растягивает грудные мышцы.',
      gifUrl: 'https://static.wger.de/media/exercise-images/193/Dumbbell-bench-press-1.png',
      type: 'strength',
      metValue: 5.5,
      muscleGroups: ['Большая грудная', 'Трицепс', 'Передняя дельта'],
      difficulty: 'beginner',
      equipment: 'Гантели, скамья',
      defaultSets: 3,
      defaultReps: 12,
    },
    {
      name: 'Разведение гантелей лёжа',
      description: 'Изолирующее упражнение для растяжки и проработки грудных мышц.',
      gifUrl: 'https://static.wger.de/media/exercise-images/195/Dumbbell-flyes-1.png',
      type: 'strength',
      metValue: 4.5,
      muscleGroups: ['Большая грудная'],
      difficulty: 'beginner',
      equipment: 'Гантели, скамья',
      defaultSets: 3,
      defaultReps: 12,
    },
    {
      name: 'Отжимания',
      description: 'Базовое упражнение с собственным весом. Можно выполнять где угодно.',
      gifUrl: 'https://static.wger.de/media/exercise-images/182/Push-ups-1.png',
      type: 'strength',
      metValue: 8.0,
      muscleGroups: ['Большая грудная', 'Трицепс', 'Передняя дельта', 'Пресс'],
      difficulty: 'beginner',
      equipment: null,
      defaultSets: 3,
      defaultReps: 15,
    },
    {
      name: 'Сведение рук в кроссовере',
      description: 'Изолирующее упражнение. Постоянное напряжение на протяжении всей амплитуды.',
      gifUrl: 'https://static.wger.de/media/exercise-images/98/Cable-crossover-1.png',
      type: 'strength',
      metValue: 4.0,
      muscleGroups: ['Большая грудная'],
      difficulty: 'intermediate',
      equipment: 'Кроссовер',
      defaultSets: 3,
      defaultReps: 15,
    },
    {
      name: 'Отжимания на брусьях',
      description: 'Отличное упражнение для нижней части груди и трицепсов.',
      gifUrl: 'https://static.wger.de/media/exercise-images/196/Dips-1.png',
      type: 'strength',
      metValue: 7.0,
      muscleGroups: ['Нижняя грудная', 'Трицепс', 'Передняя дельта'],
      difficulty: 'intermediate',
      equipment: 'Брусья',
      defaultSets: 3,
      defaultReps: 10,
    },
  ],

  'Спина': [
    {
      name: 'Подтягивания широким хватом',
      description: 'Лучшее упражнение для развития широчайших мышц спины и V-образного силуэта.',
      gifUrl: 'https://static.wger.de/media/exercise-images/194/Pull-ups-1.png',
      type: 'strength',
      metValue: 8.0,
      muscleGroups: ['Широчайшие', 'Большая круглая', 'Бицепс'],
      difficulty: 'intermediate',
      equipment: 'Турник',
      defaultSets: 4,
      defaultReps: 8,
    },
    {
      name: 'Тяга штанги в наклоне',
      description: 'Базовое упражнение для толщины спины. Прорабатывает среднюю часть трапеций и ромбовидные.',
      gifUrl: 'https://static.wger.de/media/exercise-images/142/Barbell-bent-over-row-1.png',
      type: 'strength',
      metValue: 6.0,
      muscleGroups: ['Широчайшие', 'Трапеция', 'Ромбовидные', 'Бицепс'],
      difficulty: 'intermediate',
      equipment: 'Штанга',
      defaultSets: 4,
      defaultReps: 10,
    },
    {
      name: 'Тяга гантели в наклоне',
      description: 'Односторонняя тяга позволяет лучше концентрироваться на каждой стороне спины.',
      gifUrl: 'https://static.wger.de/media/exercise-images/214/Dumbbell-bent-over-row-1.png',
      type: 'strength',
      metValue: 5.5,
      muscleGroups: ['Широчайшие', 'Трапеция', 'Бицепс'],
      difficulty: 'beginner',
      equipment: 'Гантель, скамья',
      defaultSets: 3,
      defaultReps: 12,
    },
    {
      name: 'Тяга верхнего блока',
      description: 'Альтернатива подтягиваниям для начинающих. Хорошо прорабатывает широчайшие.',
      gifUrl: 'https://static.wger.de/media/exercise-images/133/Lat-pulldown-1.png',
      type: 'strength',
      metValue: 5.0,
      muscleGroups: ['Широчайшие', 'Бицепс'],
      difficulty: 'beginner',
      equipment: 'Тренажёр',
      defaultSets: 3,
      defaultReps: 12,
    },
    {
      name: 'Тяга горизонтального блока',
      description: 'Прорабатывает среднюю часть спины. Укрепляет осанку.',
      gifUrl: 'https://static.wger.de/media/exercise-images/134/Seated-cable-row-1.png',
      type: 'strength',
      metValue: 5.0,
      muscleGroups: ['Широчайшие', 'Трапеция', 'Ромбовидные'],
      difficulty: 'beginner',
      equipment: 'Тренажёр',
      defaultSets: 3,
      defaultReps: 12,
    },
    {
      name: 'Становая тяга',
      description: 'Комплексное упражнение для всей задней цепи. Основа силовой подготовки.',
      gifUrl: 'https://static.wger.de/media/exercise-images/151/Deadlift-1.png',
      type: 'strength',
      metValue: 7.0,
      muscleGroups: ['Разгибатели спины', 'Ягодицы', 'Бицепс бедра', 'Трапеция'],
      difficulty: 'advanced',
      equipment: 'Штанга',
      defaultSets: 4,
      defaultReps: 6,
    },
  ],

  'Ноги': [
    {
      name: 'Приседания со штангой',
      description: 'Король упражнений для ног. Развивает квадрицепсы, ягодицы и укрепляет всё тело.',
      gifUrl: 'https://static.wger.de/media/exercise-images/106/Barbell-squat-1.png',
      type: 'strength',
      metValue: 6.0,
      muscleGroups: ['Квадрицепс', 'Ягодичные', 'Кор', 'Бицепс бедра'],
      difficulty: 'intermediate',
      equipment: 'Штанга, стойка',
      defaultSets: 4,
      defaultReps: 10,
    },
    {
      name: 'Выпады с гантелями',
      description: 'Отлично прорабатывают каждую ногу отдельно. Улучшают баланс и координацию.',
      gifUrl: 'https://static.wger.de/media/exercise-images/197/Dumbbell-lunges-1.png',
      type: 'strength',
      metValue: 5.0,
      muscleGroups: ['Квадрицепс', 'Ягодичные'],
      difficulty: 'beginner',
      equipment: 'Гантели',
      defaultSets: 3,
      defaultReps: 12,
    },
    {
      name: 'Жим ногами',
      description: 'Безопасная альтернатива приседаниям в тренажёре. Позволяет работать с большим весом.',
      gifUrl: 'https://static.wger.de/media/exercise-images/118/Leg-press-1.png',
      type: 'strength',
      metValue: 5.0,
      muscleGroups: ['Квадрицепс', 'Ягодичные'],
      difficulty: 'beginner',
      equipment: 'Тренажёр',
      defaultSets: 3,
      defaultReps: 12,
    },
    {
      name: 'Румынская тяга',
      description: 'Лучшее упражнение для задней поверхности бедра и ягодиц.',
      gifUrl: 'https://static.wger.de/media/exercise-images/152/Romanian-deadlift-1.png',
      type: 'strength',
      metValue: 6.0,
      muscleGroups: ['Бицепс бедра', 'Ягодичные', 'Разгибатели спины'],
      difficulty: 'intermediate',
      equipment: 'Штанга',
      defaultSets: 3,
      defaultReps: 10,
    },
    {
      name: 'Разгибания ног в тренажёре',
      description: 'Изолирующее упражнение для квадрицепсов. Хорошо для разминки или добивки.',
      gifUrl: 'https://static.wger.de/media/exercise-images/119/Leg-extensions-1.png',
      type: 'strength',
      metValue: 4.0,
      muscleGroups: ['Квадрицепс'],
      difficulty: 'beginner',
      equipment: 'Тренажёр',
      defaultSets: 3,
      defaultReps: 15,
    },
    {
      name: 'Сгибания ног в тренажёре',
      description: 'Изолирующее упражнение для бицепса бедра.',
      gifUrl: 'https://static.wger.de/media/exercise-images/120/Leg-curls-1.png',
      type: 'strength',
      metValue: 4.0,
      muscleGroups: ['Бицепс бедра'],
      difficulty: 'beginner',
      equipment: 'Тренажёр',
      defaultSets: 3,
      defaultReps: 15,
    },
    {
      name: 'Подъёмы на носки',
      description: 'Проработка икроножных мышц. Важно не забывать про ноги полностью.',
      gifUrl: 'https://static.wger.de/media/exercise-images/139/Calves-1.png',
      type: 'strength',
      metValue: 3.5,
      muscleGroups: ['Икроножная', 'Камбаловидная'],
      difficulty: 'beginner',
      equipment: null,
      defaultSets: 4,
      defaultReps: 20,
    },
  ],

  'Плечи': [
    {
      name: 'Жим гантелей стоя',
      description: 'Базовое упражнение для развития всех трёх пучков дельтовидных мышц.',
      gifUrl: 'https://static.wger.de/media/exercise-images/193/Dumbbell-shoulder-press-1.png',
      type: 'strength',
      metValue: 6.0,
      muscleGroups: ['Передняя дельта', 'Средняя дельта', 'Трицепс'],
      difficulty: 'intermediate',
      equipment: 'Гантели',
      defaultSets: 4,
      defaultReps: 10,
    },
    {
      name: 'Разведение гантелей в стороны',
      description: 'Изолирующее упражнение для средней дельты. Формирует ширину плеч.',
      gifUrl: 'https://static.wger.de/media/exercise-images/201/Lateral-raise-1.png',
      type: 'strength',
      metValue: 4.0,
      muscleGroups: ['Средняя дельта'],
      difficulty: 'beginner',
      equipment: 'Гантели',
      defaultSets: 4,
      defaultReps: 15,
    },
    {
      name: 'Тяга гантелей к подбородку',
      description: 'Прорабатывает среднюю дельту и трапеции. Улучшает форму плеч.',
      gifUrl: 'https://static.wger.de/media/exercise-images/153/Upright-row-1.png',
      type: 'strength',
      metValue: 5.0,
      muscleGroups: ['Средняя дельта', 'Трапеция'],
      difficulty: 'intermediate',
      equipment: 'Гантели',
      defaultSets: 3,
      defaultReps: 12,
    },
    {
      name: 'Махи гантелей в наклоне',
      description: 'Проработка задней дельты. Важна для баланса и осанки.',
      gifUrl: 'https://static.wger.de/media/exercise-images/202/Rear-delt-fly-1.png',
      type: 'strength',
      metValue: 4.0,
      muscleGroups: ['Задняя дельта', 'Трапеция'],
      difficulty: 'beginner',
      equipment: 'Гантели',
      defaultSets: 3,
      defaultReps: 15,
    },
    {
      name: 'Жим Арнольда',
      description: 'Комбинированное упражнение для всех пучков дельт. Названо в честь Арнольда Шварценеггера.',
      gifUrl: 'https://static.wger.de/media/exercise-images/193/Dumbbell-shoulder-press-1.png',
      type: 'strength',
      metValue: 6.0,
      muscleGroups: ['Передняя дельта', 'Средняя дельта'],
      difficulty: 'intermediate',
      equipment: 'Гантели',
      defaultSets: 3,
      defaultReps: 10,
    },
  ],

  'Руки': [
    {
      name: 'Сгибания рук со штангой стоя',
      description: 'Классическое упражнение для развития бицепса. Основа тренировки рук.',
      gifUrl: 'https://static.wger.de/media/exercise-images/163/Barbell-curl-1.png',
      type: 'strength',
      metValue: 4.0,
      muscleGroups: ['Бицепс', 'Плечевая'],
      difficulty: 'beginner',
      equipment: 'Штанга',
      defaultSets: 3,
      defaultReps: 12,
    },
    {
      name: 'Молотковые сгибания',
      description: 'Прорабатывает бицепс и плечевую мышцу. Придаёт рукам объём.',
      gifUrl: 'https://static.wger.de/media/exercise-images/167/Hammer-curl-1.png',
      type: 'strength',
      metValue: 4.0,
      muscleGroups: ['Бицепс', 'Плечевая', 'Плечелучевая'],
      difficulty: 'beginner',
      equipment: 'Гантели',
      defaultSets: 3,
      defaultReps: 12,
    },
    {
      name: 'Французский жим',
      description: 'Лучшее упражнение для длинной головки трицепса. Развивает объём рук.',
      gifUrl: 'https://static.wger.de/media/exercise-images/165/French-press-1.png',
      type: 'strength',
      metValue: 4.0,
      muscleGroups: ['Трицепс'],
      difficulty: 'intermediate',
      equipment: 'Штанга EZ, скамья',
      defaultSets: 3,
      defaultReps: 12,
    },
    {
      name: 'Разгибания на трицепс на блоке',
      description: 'Изолирующее упражнение для проработки формы трицепса.',
      gifUrl: 'https://static.wger.de/media/exercise-images/169/Tricep-pushdown-1.png',
      type: 'strength',
      metValue: 3.5,
      muscleGroups: ['Трицепс'],
      difficulty: 'beginner',
      equipment: 'Кроссовер',
      defaultSets: 3,
      defaultReps: 15,
    },
    {
      name: 'Сгибания рук с гантелями на скамье',
      description: 'Концентрированные сгибания для пикового сокращения бицепса.',
      gifUrl: 'https://static.wger.de/media/exercise-images/164/Incline-dumbbell-curl-1.png',
      type: 'strength',
      metValue: 3.5,
      muscleGroups: ['Бицепс'],
      difficulty: 'beginner',
      equipment: 'Гантели, наклонная скамья',
      defaultSets: 3,
      defaultReps: 12,
    },
    {
      name: 'Отжимания узким хватом',
      description: 'Упражнение на трицепс с собственным весом. Развивает силу и массу.',
      gifUrl: 'https://static.wger.de/media/exercise-images/182/Push-ups-1.png',
      type: 'strength',
      metValue: 7.0,
      muscleGroups: ['Трицепс', 'Грудь'],
      difficulty: 'beginner',
      equipment: null,
      defaultSets: 3,
      defaultReps: 12,
    },
  ],

  'Пресс': [
    {
      name: 'Скручивания на полу',
      description: 'Базовое упражнение для прямой мышцы живота. Классика тренировки пресса.',
      gifUrl: 'https://static.wger.de/media/exercise-images/91/Crunches-1.png',
      type: 'strength',
      metValue: 3.8,
      muscleGroups: ['Прямая мышца живота'],
      difficulty: 'beginner',
      equipment: null,
      defaultSets: 3,
      defaultReps: 20,
    },
    {
      name: 'Планка',
      description: 'Статическое упражнение для всего кора. Укрепляет глубокие мышцы-стабилизаторы.',
      gifUrl: 'https://static.wger.de/media/exercise-images/105/Plank-1.png',
      type: 'strength',
      metValue: 4.0,
      muscleGroups: ['Пресс', 'Поперечная мышца', 'Кор'],
      difficulty: 'beginner',
      equipment: null,
      defaultSets: 3,
      defaultReps: 1,
      defaultDurationSec: 60,
    },
    {
      name: 'Подъём ног лёжа',
      description: 'Прорабатывает нижнюю часть пресса и подвздошно-поясничную мышцу.',
      gifUrl: 'https://static.wger.de/media/exercise-images/107/Lying-leg-raise-1.png',
      type: 'strength',
      metValue: 4.5,
      muscleGroups: ['Нижний пресс', 'Подвздошно-поясничная'],
      difficulty: 'beginner',
      equipment: null,
      defaultSets: 3,
      defaultReps: 15,
    },
    {
      name: 'Русские скручивания',
      description: 'Упражнение для косых мышц живота. Работает с весом или без.',
      gifUrl: 'https://static.wger.de/media/exercise-images/226/Russian-twist-1.png',
      type: 'strength',
      metValue: 4.5,
      muscleGroups: ['Косые мышцы', 'Прямая мышца'],
      difficulty: 'intermediate',
      equipment: null,
      defaultSets: 3,
      defaultReps: 20,
    },
    {
      name: 'Велосипед',
      description: 'Динамичное упражнение, прорабатывает пресс и косые мышцы одновременно.',
      gifUrl: 'https://static.wger.de/media/exercise-images/92/Bicycle-crunches-1.png',
      type: 'strength',
      metValue: 5.0,
      muscleGroups: ['Пресс', 'Косые мышцы'],
      difficulty: 'beginner',
      equipment: null,
      defaultSets: 3,
      defaultReps: 20,
    },
    {
      name: 'Подъём ног в висе',
      description: 'Продвинутое упражнение для сильного пресса. Требует турник.',
      gifUrl: 'https://static.wger.de/media/exercise-images/107/Hanging-leg-raise-1.png',
      type: 'strength',
      metValue: 5.0,
      muscleGroups: ['Нижний пресс', 'Кор'],
      difficulty: 'advanced',
      equipment: 'Турник',
      defaultSets: 3,
      defaultReps: 10,
    },
  ],

  'Кардио': [
    {
      name: 'Бег на месте',
      description: 'Простое и эффективное кардио. Можно делать в любых условиях.',
      gifUrl: 'https://static.wger.de/media/exercise-images/191/Running-1.png',
      type: 'cardio',
      metValue: 8.0,
      muscleGroups: ['Ноги', 'Кор'],
      difficulty: 'beginner',
      equipment: null,
      defaultSets: 1,
      defaultReps: 1,
      defaultDurationSec: 600,
    },
    {
      name: 'Прыжки на скакалке',
      description: 'Отличное кардио для координации и выносливости. Сжигает много калорий.',
      gifUrl: 'https://static.wger.de/media/exercise-images/228/Jump-rope-1.png',
      type: 'cardio',
      metValue: 11.0,
      muscleGroups: ['Икры', 'Плечи', 'Кор'],
      difficulty: 'intermediate',
      equipment: 'Скакалка',
      defaultSets: 3,
      defaultReps: 1,
      defaultDurationSec: 180,
    },
    {
      name: 'Бёрпи',
      description: 'Комплексное упражнение для всего тела. Максимальное сжигание калорий.',
      gifUrl: 'https://static.wger.de/media/exercise-images/229/Burpees-1.png',
      type: 'cardio',
      metValue: 10.0,
      muscleGroups: ['Всё тело'],
      difficulty: 'advanced',
      equipment: null,
      defaultSets: 3,
      defaultReps: 10,
    },
    {
      name: 'Jumping Jacks',
      description: 'Классическое кардио упражнение для разминки и разогрева.',
      gifUrl: 'https://static.wger.de/media/exercise-images/230/Jumping-jacks-1.png',
      type: 'cardio',
      metValue: 8.0,
      muscleGroups: ['Всё тело'],
      difficulty: 'beginner',
      equipment: null,
      defaultSets: 3,
      defaultReps: 30,
    },
    {
      name: 'Горные альпинисты',
      description: 'Динамичное кардио, прорабатывает пресс, ноги и плечи.',
      gifUrl: 'https://static.wger.de/media/exercise-images/231/Mountain-climber-1.png',
      type: 'cardio',
      metValue: 8.0,
      muscleGroups: ['Кор', 'Квадрицепс', 'Плечи'],
      difficulty: 'intermediate',
      equipment: null,
      defaultSets: 3,
      defaultReps: 20,
    },
    {
      name: 'Высокие колени',
      description: 'Кардио упражнение для разогрева и развития скорости.',
      gifUrl: 'https://static.wger.de/media/exercise-images/232/High-knees-1.png',
      type: 'cardio',
      metValue: 8.0,
      muscleGroups: ['Квадрицепс', 'Кор'],
      difficulty: 'beginner',
      equipment: null,
      defaultSets: 3,
      defaultReps: 30,
    },
    {
      name: 'Скалолаз',
      description: 'Низкоинтенсивная альтернатива горным альпинистам. Подходит для начинающих.',
      gifUrl: 'https://static.wger.de/media/exercise-images/231/Mountain-climber-1.png',
      type: 'cardio',
      metValue: 6.0,
      muscleGroups: ['Кор', 'Ноги'],
      difficulty: 'beginner',
      equipment: null,
      defaultSets: 3,
      defaultReps: 20,
    },
  ],
};

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule);

  const categoryModel = app.get(getModelToken('WorkoutCategory'));
  const exerciseModel = app.get(getModelToken('Exercise'));

  console.log('=== Seeding workout categories ===\n');

  const categoryMap: Record<string, any> = {};
  for (const cat of categories) {
    const existing = await categoryModel.findOne({ name: cat.name });
    if (!existing) {
      const created = await categoryModel.create(cat);
      categoryMap[cat.name] = created;
      console.log(`  [+] ${cat.emoji} ${cat.name}`);
    } else {
      categoryMap[cat.name] = existing;
      console.log(`  [=] ${cat.emoji} ${cat.name} (уже существует)`);
    }
  }

  console.log('\n=== Seeding exercises ===\n');

  let createdCount = 0;
  let skippedCount = 0;

  for (const [catName, exercises] of Object.entries(exercisesByCategory)) {
    const category = categoryMap[catName];
    if (!category) continue;

    console.log(`\n  ${category.emoji} ${catName}:`);

    for (const ex of exercises) {
      const existing = await exerciseModel.findOne({ name: ex.name, categoryId: category._id });
      if (!existing) {
        await exerciseModel.create({
          ...ex,
          categoryId: category._id,
        });
        createdCount++;
        console.log(`    [+] ${ex.name} (${ex.type === 'cardio' ? 'кардио' : 'сила'}, MET ${ex.metValue})`);
      } else {
        skippedCount++;
        console.log(`    [=] ${ex.name} (уже существует)`);
      }
    }
  }

  console.log(`\n=== Готово! ===`);
  console.log(`Создано упражнений: ${createdCount}`);
  console.log(`Пропущено (уже есть): ${skippedCount}`);
  console.log(`Всего категорий: ${Object.keys(categoryMap).length}`);
  console.log(`Всего упражнений в базе: ${await exerciseModel.countDocuments()}`);

  await app.close();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
