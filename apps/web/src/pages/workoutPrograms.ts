import programAbs from '../assets/programs/program_abs.svg';
import programGlutes from '../assets/programs/program_glutes.svg';
import programFullbody from '../assets/programs/program_fullbody.svg';

export interface ProgramExercise {
  // exact Exercise.name in the catalog (seed-workouts.ts)
  name: string;
  sets: number;
  reps?: number;
  durationSec?: number;
}

export interface WorkoutProgramDay {
  key: string;
  title: string;
  subtitle: string;
  cover: string;
  exercises: ProgramExercise[];
}

// Домашняя программа «Плоский живот»: 3 чередуемых дня, 30–45 минут,
// без инвентаря (кроме желания). Порядок: разминка -> основная работа -> кор.
export const FLAT_BELLY_PROGRAM: WorkoutProgramDay[] = [
  {
    key: 'abs',
    title: 'День A — Пресс и кор',
    subtitle: '~35 мин · без инвентаря',
    cover: programAbs,
    exercises: [
      { name: 'Jumping Jacks', sets: 3, durationSec: 60 },
      { name: 'Скручивания на полу', sets: 3, reps: 15 },
      { name: 'Подъём ног лёжа', sets: 3, reps: 12 },
      { name: 'Русские скручивания', sets: 3, reps: 20 },
      { name: 'Планка', sets: 3, durationSec: 45 },
      { name: 'Велосипед', sets: 3, reps: 20 },
      { name: 'Горные альпинисты', sets: 3, durationSec: 30 },
    ],
  },
  {
    key: 'glutes',
    title: 'День B — Ягодицы и ноги',
    subtitle: '~35 мин · без инвентаря',
    cover: programGlutes,
    exercises: [
      { name: 'Высокие колени', sets: 3, durationSec: 60 },
      { name: 'Приседания без веса', sets: 4, reps: 15 },
      { name: 'Выпады с гантелями', sets: 3, reps: 12 },
      { name: 'Ягодичный мостик', sets: 4, reps: 15 },
      { name: 'Планка', sets: 3, durationSec: 40 },
      { name: 'Бёрпи', sets: 3, reps: 8 },
    ],
  },
  {
    key: 'fullbody',
    title: 'День C — Всё тело',
    subtitle: '~40 мин · без инвентаря',
    cover: programFullbody,
    exercises: [
      { name: 'Jumping Jacks', sets: 3, durationSec: 60 },
      { name: 'Отжимания', sets: 4, reps: 10 },
      { name: 'Приседания без веса', sets: 3, reps: 15 },
      { name: 'Скалолаз', sets: 3, durationSec: 30 },
      { name: 'Русские скручивания', sets: 3, reps: 15 },
      { name: 'Ягодичный мостик', sets: 3, reps: 15 },
      { name: 'Бег на месте', sets: 1, durationSec: 300 },
    ],
  },
];
