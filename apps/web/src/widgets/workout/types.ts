export interface WorkoutCategory {
  _id: string;
  name: string;
  description?: string;
  emoji: string;
  imageUrl?: string;
}

export interface ProgramListItem {
  _id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  categoryId?: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  exerciseCount: number;
  estimatedDurationSec: number;
  estimatedKcal: number;
}

export interface ProgramItemExercise {
  _id: string;
  name: string;
  description?: string;
  gifUrl?: string;
  type: string;
  muscleGroups?: string[];
  difficulty?: string;
  equipment?: string;
}

export interface ProgramItem {
  exerciseId: string;
  order: number;
  sets: number;
  reps: number | null;
  durationSec: number | null;
  restSec: number;
  exercise: ProgramItemExercise;
}

export interface ProgramDetail extends ProgramListItem {
  items: ProgramItem[];
}

export interface SetDetail {
  setNumber: number;
  weightKg: number | null;
  reps: number | null;
  durationSec: number | null;
  done: boolean;
}

export interface SessionLog {
  _id: string;
  exerciseId: string;
  exerciseName: string;
  gifUrl?: string;
  sets: number;
  reps: number;
  weightKg: number | null;
  durationSec: number;
  caloriesBurned: number;
  setsDetail: SetDetail[];
  restSec: number;
  order: number;
}

export interface WorkoutSessionInfo {
  _id: string;
  name?: string;
  date?: string;
  categoryId?: string;
  programId?: string;
  programName?: string;
  totalCaloriesBurned: number;
  totalDurationSec: number;
  exerciseCount: number;
  startedAt?: string;
  finishedAt?: string;
}

export interface LastPerformance {
  weightKg: number | null;
  reps: number | null;
  sets: number;
  date: string | null;
  bestSet: { weightKg: number | null; reps: number | null } | null;
}

export interface FinishSummary {
  durationSec: number;
  totalVolumeKg: number;
  kcal: number;
  exercisesDone: number;
  prs: { exerciseName: string; weightKg: number; reps: number | null }[];
}
