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
