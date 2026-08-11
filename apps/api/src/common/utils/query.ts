import { BadRequestException } from '@nestjs/common';

/**
 * Безопасный разбор ?limit=: `abc` → значение по умолчанию (раньше .limit(NaN)),
 * отрицательные и гигантские значения клампятся в [1, max].
 */
export function parseLimit(raw: string | undefined, def: number, max = 200): number {
  const n = raw ? parseInt(raw, 10) : def;
  if (!Number.isFinite(n) || Number.isNaN(n)) return def;
  return Math.min(max, Math.max(1, n));
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Обязательная ISO-дата в query: отсутствие/мусор → 400, а не полный скан. */
export function requireIsoDate(raw: string | undefined, param = 'date'): string {
  if (!raw || !ISO_DATE.test(raw) || isNaN(Date.parse(raw))) {
    throw new BadRequestException(`Некорректный параметр ${param} (ожидается YYYY-MM-DD)`);
  }
  return raw;
}
