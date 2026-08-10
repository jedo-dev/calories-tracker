import { useEffect, useState } from 'react';
import { apiClient } from '../api/client';
import { t, toISODate } from '../i18n';
import { glassCardStyle, pageBackground } from '../theme/styles';

export const workoutCardStyle = glassCardStyle;

export const workoutPageBackground = pageBackground;

export function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  if (m === 0) return `${s}${t('workout.sec')}`;
  if (s === 0) return `${m}${t('workout.min')}`;
  return `${m}${t('workout.min')} ${s}${t('workout.sec')}`;
}

export const formatDate = toISODate;

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
