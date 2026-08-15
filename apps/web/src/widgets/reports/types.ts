export type ReportPeriod = 'week' | 'month';

export interface ReportEntry {
  kcal?: number;
  protein?: number;
  fat?: number;
  carb?: number;
}

export interface ReportWorkout {
  totalCaloriesBurned?: number;
}

export interface ReportDay {
  date: string;
  entries: ReportEntry[];
  workouts: ReportWorkout[];
  weight: number | null;
  waterMl?: number;
}
