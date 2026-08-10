// Дневная норма воды от веса: 30 мл/кг, округление к шагу 250 мл,
// в разумных пределах 1500–4000. Без веса — прежние 2000.
// Та же формула продублирована на бэке (water.service.ts) для события water_goal.
export function calcWaterGoalMl(weightKg?: number | null): number {
  if (!weightKg || weightKg <= 0) return 2000;
  const raw = weightKg * 30;
  const rounded = Math.round(raw / 250) * 250;
  return Math.min(4000, Math.max(1500, rounded));
}
