// Шагомер на акселерометре (DeviceMotionEvent). Каждый шаг при беге даёт
// пик вертикального ускорения; считаем модуль вектора (не зависит от
// ориентации телефона), сглаживаем и ловим пики с «мёртвым временем».
//
// Ограничение платформы: события приходят только пока страница видима и
// экран активен — поэтому беговой режим держит Wake Lock.

// Порог пика: в покое модуль ≈ 9.8 (гравитация), при беге пики 13–25
const PEAK_THRESHOLD = 11.8;
// Минимум между шагами: каденс бегуна ≤ 200 шагов/мин → ≥ 300 мс на шаг.
// Меньшие интервалы — дребезг одного удара, а не два шага.
const REFRACTORY_MS = 300;
// Коэффициент сглаживания EMA: гасит высокочастотный шум датчика
const SMOOTHING = 0.35;

export type MotionPermission = 'granted' | 'denied' | 'unsupported';

export function isMotionSupported(): boolean {
  return typeof window !== 'undefined' && 'DeviceMotionEvent' in window;
}

/** iOS 13+ требует явного запроса разрешения из обработчика клика. */
export async function requestMotionPermission(): Promise<MotionPermission> {
  if (!isMotionSupported()) return 'unsupported';
  const anyMotion = DeviceMotionEvent as any;
  if (typeof anyMotion.requestPermission === 'function') {
    try {
      const result = await anyMotion.requestPermission();
      return result === 'granted' ? 'granted' : 'denied';
    } catch {
      return 'denied';
    }
  }
  return 'granted';
}

export class StepCounter {
  private smoothed = 9.8;
  private lastStepAt = 0;
  private aboveThreshold = false;
  private handler: ((e: DeviceMotionEvent) => void) | null = null;

  steps = 0;

  start(onStep?: (steps: number) => void): void {
    if (this.handler) return;
    this.handler = (e: DeviceMotionEvent) => {
      const a = e.accelerationIncludingGravity;
      if (!a || a.x == null || a.y == null || a.z == null) return;
      const magnitude = Math.sqrt(a.x * a.x + a.y * a.y + a.z * a.z);
      this.smoothed = this.smoothed + SMOOTHING * (magnitude - this.smoothed);

      // Шаг = восходящее пересечение порога после мёртвого времени
      if (!this.aboveThreshold && this.smoothed > PEAK_THRESHOLD) {
        this.aboveThreshold = true;
        const now = Date.now();
        if (now - this.lastStepAt >= REFRACTORY_MS) {
          this.lastStepAt = now;
          this.steps++;
          onStep?.(this.steps);
        }
      } else if (this.aboveThreshold && this.smoothed < PEAK_THRESHOLD) {
        this.aboveThreshold = false;
      }
    };
    window.addEventListener('devicemotion', this.handler);
  }

  stop(): void {
    if (this.handler) {
      window.removeEventListener('devicemotion', this.handler);
      this.handler = null;
    }
  }

  reset(): void {
    this.steps = 0;
    this.smoothed = 9.8;
    this.lastStepAt = 0;
    this.aboveThreshold = false;
  }
}
