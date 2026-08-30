// Канонические группы мышц для карты тела. В БД Exercise.muscleGroups —
// свободные русские строки, поэтому здесь же живёт нормализация в слаги.
// Названия и описания — контент единственной локали, сознательно не в i18n
// (как текст PrivacyPage).

export type MuscleSlug =
  | 'chest'
  | 'abs'
  | 'obliques'
  | 'shoulders'
  | 'traps'
  | 'biceps'
  | 'triceps'
  | 'forearms'
  | 'upper_back'
  | 'lower_back'
  | 'glutes'
  | 'quads'
  | 'hamstrings'
  | 'calves';

export interface MuscleInfo {
  name: string;
  latin: string;
  description: string;
}

export const MUSCLES: Record<MuscleSlug, MuscleInfo> = {
  chest: {
    name: 'Грудные мышцы',
    latin: 'Pectoralis major',
    description: 'Толкают руки вперёд и сводят их перед собой. Работают в жимах лёжа, отжиманиях и разводках.',
  },
  abs: {
    name: 'Пресс',
    latin: 'Rectus abdominis',
    description: 'Сгибает корпус и стабилизирует его в любых упражнениях. Скручивания, планки, подъёмы ног.',
  },
  obliques: {
    name: 'Косые мышцы живота',
    latin: 'Obliquus abdominis',
    description: 'Повороты и наклоны корпуса, боковая стабильность. Русские скручивания, боковые планки.',
  },
  shoulders: {
    name: 'Дельтовидные',
    latin: 'Deltoideus',
    description: 'Поднимают и отводят руки во всех направлениях. Жимы над головой, махи, тяги к подбородку.',
  },
  traps: {
    name: 'Трапеции',
    latin: 'Trapezius',
    description: 'Поднимают и сводят лопатки, держат шею. Шраги, становые тяги, тяжёлые удержания.',
  },
  biceps: {
    name: 'Бицепс',
    latin: 'Biceps brachii',
    description: 'Сгибает руку в локте. Подъёмы на бицепс, подтягивания обратным хватом, тяги.',
  },
  triceps: {
    name: 'Трицепс',
    latin: 'Triceps brachii',
    description: 'Разгибает руку в локте — две трети объёма плеча. Жимы узким хватом, отжимания на брусьях.',
  },
  forearms: {
    name: 'Предплечья',
    latin: 'Brachioradialis',
    description: 'Сила хвата и работа кисти. Нагружаются во всех тягах, удержаниях и висах.',
  },
  upper_back: {
    name: 'Верх спины',
    latin: 'Latissimus dorsi, Rhomboidei',
    description: 'Широчайшие тянут руки вниз и к корпусу и формируют «крылья», ромбовидные сводят лопатки и держат осанку. Подтягивания, тяги к поясу и верхнего блока.',
  },
  lower_back: {
    name: 'Поясница',
    latin: 'Erector spinae',
    description: 'Разгибает и стабилизирует позвоночник. Становые тяги, гиперэкстензии, наклоны.',
  },
  glutes: {
    name: 'Ягодичные',
    latin: 'Gluteus maximus',
    description: 'Разгибают бедро — самая сильная мышца тела. Приседания, выпады, ягодичный мост.',
  },
  quads: {
    name: 'Квадрицепсы',
    latin: 'Quadriceps femoris',
    description: 'Разгибают ногу в колене. Приседания, выпады, жим ногами, разгибания сидя.',
  },
  hamstrings: {
    name: 'Бицепс бедра',
    latin: 'Biceps femoris',
    description: 'Сгибает колено и разгибает бедро. Румынская тяга, сгибания ног, наклоны.',
  },
  calves: {
    name: 'Икры',
    latin: 'Gastrocnemius',
    description: 'Поднимают на носки и толкают при ходьбе и беге. Подъёмы на носки стоя и сидя.',
  },
};

export const MUSCLE_SLUGS = Object.keys(MUSCLES) as MuscleSlug[];

// Сырые строки из Exercise.muscleGroups → слаги (одна строка может
// относиться к нескольким группам, «всё тело» сознательно никуда не мапится)
const NORMALIZE: Record<string, MuscleSlug[]> = {
  'кор': ['abs'],
  'пресс': ['abs'],
  'нижний пресс': ['abs'],
  'прямая мышца живота': ['abs'],
  'прямая мышца': ['abs'],
  'поперечная мышца': ['abs'],
  'подвздошно-поясничная': ['abs'],
  'косые мышцы': ['obliques'],
  'грудь': ['chest'],
  'большая грудная': ['chest'],
  'нижняя грудная': ['chest'],
  'плечи': ['shoulders'],
  'передняя дельта': ['shoulders'],
  'средняя дельта': ['shoulders'],
  'задняя дельта': ['shoulders'],
  'трапеция': ['traps'],
  'бицепс': ['biceps'],
  'плечевая': ['biceps'],
  'трицепс': ['triceps'],
  'предплечья': ['forearms'],
  'плечелучевая': ['forearms'],
  'широчайшие': ['upper_back'],
  'большая круглая': ['upper_back'],
  'ромбовидные': ['upper_back'],
  'разгибатели спины': ['lower_back'],
  'ягодичные': ['glutes'],
  'ягодицы': ['glutes'],
  'квадрицепс': ['quads'],
  'сгибатели бедра': ['quads'],
  'бицепс бедра': ['hamstrings'],
  'ноги': ['quads', 'hamstrings', 'calves'],
  'икры': ['calves'],
  'икроножная': ['calves'],
  'камбаловидная': ['calves'],
};

export function normalizeMuscles(raw: string[] | undefined): MuscleSlug[] {
  const result = new Set<MuscleSlug>();
  for (const item of raw || []) {
    for (const slug of NORMALIZE[item.trim().toLowerCase()] || []) result.add(slug);
  }
  return [...result];
}
