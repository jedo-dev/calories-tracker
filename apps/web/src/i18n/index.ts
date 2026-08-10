import { ru } from './ru';

type Translations = typeof ru;
type Keys = keyof Translations | `${keyof Translations}.${string}`;

function getNestedValue(obj: any, path: string): string | undefined {
  const keys = path.split('.');
  let current = obj;
  for (const key of keys) {
    if (current?.[key] === undefined) return undefined;
    current = current[key];
  }
  return typeof current === 'string' ? current : undefined;
}

function replaceParams(template: string, params?: Record<string, string | number>): string {
  if (!params) return template;
  let result = template;
  for (const [key, value] of Object.entries(params)) {
    result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value));
  }
  return result;
}

export function t(key: Keys | string, params?: Record<string, string | number>): string {
  const translation = getNestedValue(ru, key);
  if (!translation) {
    console.warn(`Translation key not found: ${key}`);
    return String(key);
  }
  return replaceParams(translation, params);
}

export type Locale = 'ru' | 'en';

// Текущая локаль приложения. Пока одна, но всё завязано на неё —
// когда появятся другие языки, достаточно менять это значение.
export const locale: Locale = 'ru';

export type PluralKey = keyof typeof ru.plurals;

/**
 * Русская плюрализация. Формы живут в ru.plurals (как остальные строки):
 * plural(1, 'day') → 'день'; plural(2, 'day') → 'дня'; plural(5, 'day') → 'дней'.
 */
export function plural(n: number, key: PluralKey): string {
  const [one, few, many] = ru.plurals[key];
  const abs = Math.abs(Math.trunc(n));
  const mod10 = abs % 10;
  const mod100 = abs % 100;
  if (mod100 >= 11 && mod100 <= 14) return many;
  if (mod10 === 1) return one;
  if (mod10 >= 2 && mod10 <= 4) return few;
  return many;
}

/**
 * Форматирует дату (ISO `YYYY-MM-DD`) под локаль:
 *  - ru  → `dd.mm.yyyy`
 *  - иначе → `yyyy.mm.dd`
 */
export function formatDate(dateStr: string, loc: Locale = locale): string {
  const [y, m, d] = dateStr.split('-');
  if (!y || !m || !d) return dateStr;
  const dd = d.padStart(2, '0');
  const mm = m.padStart(2, '0');
  const yyyy = y.padStart(4, '0');
  return loc === 'ru' ? `${dd}.${mm}.${yyyy}` : `${yyyy}.${mm}.${dd}`;
}

/** Date → ISO `YYYY-MM-DD` в локальной таймзоне (раньше — 8 копий по коду). */
export function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Сегодняшняя локальная дата в ISO. */
export function todayISO(): string {
  return toISODate(new Date());
}

const MONTHS_RU_GENITIVE = [
  'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
  'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря',
];

/** Человекочитаемая дата: «5 августа» / «5 августа 2026» (из ISO-строки). */
export function formatDateHuman(dateStr: string, withYear = false): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  if (!y || !m || !d) return dateStr;
  const base = `${d} ${MONTHS_RU_GENITIVE[m - 1]}`;
  return withYear ? `${base} ${y}` : base;
}
