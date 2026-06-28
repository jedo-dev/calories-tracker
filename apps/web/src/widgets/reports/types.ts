export type ReportPeriod = 'week' | 'month';

export interface ReportEntry {
  kcal?: number;
}

export interface ReportWorkout {
  totalCaloriesBurned?: number;
}

export interface ReportDay {
  date: string;
  entries: ReportEntry[];
  workouts: ReportWorkout[];
  weight: number | null;
}
