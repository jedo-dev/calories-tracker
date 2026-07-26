import { useEffect, useState } from 'react';
import { apiClient } from '../api/client';
import { t } from '../i18n';

export const workoutCardStyle: React.CSSProperties = {
  borderRadius: '22px',
  background: 'linear-gradient(180deg, rgba(17, 49, 69, 0.96), rgba(10, 32, 46, 0.96))',
  border: '1px solid rgba(160, 200, 220, 0.18)',
  boxShadow: '0 22px 44px rgba(0, 0, 0, 0.28)',
  padding: '14px',
};

export const workoutPageBackground = (bg: string) => `
  radial-gradient(circle at top, rgba(83, 212, 107, 0.18), transparent 34%),
  radial-gradient(circle at 20% 25%, rgba(60, 140, 255, 0.12), transparent 24%),
  linear-gradient(180deg, #07111d 0%, ${bg} 28%, #081523 100%)
`;

export function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  if (m === 0) return `${s}${t('workout.sec')}`;
  if (s === 0) return `${m}${t('workout.min')}`;
  return `${m}${t('workout.min')} ${s}${t('workout.sec')}`;
}

export function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

interface ExerciseLike {
  type: string;
  metValue: number;
  defaultSets: number;
  defaultReps: number;
  defaultDurationSec?: number | null;
}

// Mirrors the backend formula in workout.service.ts (calculateCalories + estimateDuration)
export function estimateExerciseKcal(ex: ExerciseLike, weightKg: number): number {
  const durationSec =
    ex.defaultDurationSec ||
    (ex.type === 'cardio' ? 300 : ex.defaultSets * ex.defaultReps * 3 + (ex.defaultSets - 1) * 60);
  return Math.round(ex.metValue * weightKg * (durationSec / 3600));
}

// User weight for kcal estimates; backend falls back to 70 the same way
export function useUserWeight(): number {
  const [weight, setWeight] = useState(70);
  useEffect(() => {
    apiClient
      .get('/profile')
      .then((res) => {
        const w = res.data?.profile?.weightKg;
        if (w) setWeight(w);
      })
      .catch(() => {});
  }, []);
  return weight;
}
