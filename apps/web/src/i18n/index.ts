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
