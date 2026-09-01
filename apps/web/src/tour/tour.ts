import { track } from '../utils/analytics';

// Интерактивный тур: пользователь выполняет реальные действия, а шаги
// продвигаются событиями tourEvent() из кода приложения (не кликами по
// оверлею). Подсветка ищет элементы по атрибуту data-tour.

export interface TourStep {
  /** data-tour атрибут подсвечиваемого элемента; без него — финальная карточка по центру. */
  anchor?: string;
  textKey: string;
  /** Имя события tourEvent, по которому шаг считается выполненным. */
  advanceOn: string;
  /** Показать в тултипе кнопку, которая сама шлёт advanceOn (для «экскурсионных» шагов). */
  next?: boolean;
}

export interface TourScenario {
  id: string;
  titleKey: string;
  /** Куда увести пользователя перед стартом (по умолчанию /today). */
  startPath?: string;
  steps: TourStep[];
}

export const TOUR_SCENARIOS: TourScenario[] = [
  {
    id: 'fill-profile',
    titleKey: 'tour.scenario_fillProfile',
    steps: [
      { anchor: 'today-open-profile', textKey: 'tour.fillProfile_step1', advanceOn: 'profile_edit_opened' },
      { anchor: 'profile-body-card', textKey: 'tour.fillProfile_step2', advanceOn: 'profile_saved' },
      { anchor: 'today-dashboard', textKey: 'tour.fillProfile_step3', advanceOn: 'next', next: true },
      { anchor: 'help-button', textKey: 'tour.fillProfile_step4', advanceOn: 'finish', next: true },
    ],
  },
  {
    id: 'add-food',
    titleKey: 'tour.scenario_addFood',
    steps: [
      { anchor: 'today-add-entry', textKey: 'tour.addFood_step1', advanceOn: 'add_entry_opened' },
      { anchor: 'entry-search', textKey: 'tour.addFood_step2', advanceOn: 'product_selected' },
      { anchor: 'entry-save', textKey: 'tour.addFood_step3', advanceOn: 'entry_saved' },
      { anchor: 'today-food-list', textKey: 'tour.addFood_step4', advanceOn: 'meal_opened' },
      { anchor: 'meal-entry-delete', textKey: 'tour.addFood_step5', advanceOn: 'entry_deleted' },
      { textKey: 'tour.addFood_done', advanceOn: 'finish' },
    ],
  },
];

export interface TourState {
  scenario: TourScenario;
  stepIndex: number;
}

const STORAGE_KEY = 'tour_completed';

let state: TourState | null = null;
let listener: ((s: TourState | null) => void) | null = null;

function emit() {
  listener?.(state);
}

/** Монтируется один раз — в TourOverlay. */
export function subscribeTour(fn: (s: TourState | null) => void): () => void {
  listener = fn;
  fn(state);
  return () => {
    if (listener === fn) listener = null;
  };
}

export function isTourActive(): boolean {
  return state !== null;
}

export function getCompletedScenarios(): string[] {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
}

function markCompleted(id: string) {
  const done = getCompletedScenarios();
  if (!done.includes(id)) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...done, id]));
  }
}

export function startTour(id: string): void {
  const scenario = TOUR_SCENARIOS.find((s) => s.id === id);
  if (!scenario) return;
  state = { scenario, stepIndex: 0 };
  track('tour_started', { scenario: id });
  emit();
}

export function stopTour(completed = false): void {
  if (!state) return;
  const { scenario, stepIndex } = state;
  if (completed) {
    markCompleted(scenario.id);
    track('tour_completed', { scenario: scenario.id });
  } else {
    track('tour_skipped', { scenario: scenario.id, step: stepIndex });
  }
  state = null;
  emit();
}

/** Продвигает активный тур, если текущий шаг ждёт это событие. Без тура — no-op. */
export function tourEvent(name: string): void {
  if (!state) return;
  const step = state.scenario.steps[state.stepIndex];
  if (step?.advanceOn !== name) return;
  if (state.stepIndex >= state.scenario.steps.length - 1) {
    stopTour(true);
    return;
  }
  state = { ...state, stepIndex: state.stepIndex + 1 };
  emit();
}
