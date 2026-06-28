import type { ReportDay, ReportPeriod } from './types';

const WEEKDAY_SHORT = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];

function pad2(value: number): string {
  return String(value).padStart(2, '0');
}

function toLocalDate(dateStr: string): Date {
  return new Date(`${dateStr}T00:00:00`);
}

export function formatDateInput(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

export function getPeriodBounds(period: ReportPeriod, offset = 0): { from: string; to: string } {
  const now = new Date();

  if (period === 'month') {
    const first = new Date(now.getFullYear(), now.getMonth() + offset, 1);
    const last = new Date(now.getFullYear(), now.getMonth() + offset + 1, 0);
    return { from: formatDateInput(first), to: formatDateInput(last) };
  }

  const currentDay = now.getDay() || 7;
  const monday = new Date(now);
  monday.setDate(now.getDate() - currentDay + 1 + offset * 7);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  return { from: formatDateInput(monday), to: formatDateInput(sunday) };
}

export function getPeriodLabel(period: ReportPeriod, from: string, to: string): string {
  const fromDate = toLocalDate(from);
  const toDate = toLocalDate(to);

  if (period === 'month') {
    return new Intl.DateTimeFormat('ru-RU', { month: 'long', year: 'numeric' }).format(fromDate);
  }

  const sameMonth = fromDate.getMonth() === toDate.getMonth() && fromDate.getFullYear() === toDate.getFullYear();
  if (sameMonth) {
    const month = new Intl.DateTimeFormat('ru-RU', { month: 'long' }).format(fromDate);
    return `${fromDate.getDate()}–${toDate.getDate()} ${month}`;
  }

  const fromLabel = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long' }).format(fromDate);
  const toLabel = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long' }).format(toDate);
  return `${fromLabel} – ${toLabel}`;
}

export function getWeekdayLabel(dateStr: string): string {
  const date = toLocalDate(dateStr);
  return WEEKDAY_SHORT[date.getDay()];
}

export function getDayNumberLabel(dateStr: string): string {
  return String(toLocalDate(dateStr).getDate());
}

export function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

export function extractWeights(days: ReportDay[]): Array<{ date: string; weight: number; index: number }> {
  return days
    .map((day, index) => (day.weight == null ? null : { date: day.date, weight: day.weight, index }))
    .filter((item): item is { date: string; weight: number; index: number } => item !== null);
}
