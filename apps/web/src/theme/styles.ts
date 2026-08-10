import type React from 'react';

// Единый «стеклянный» стиль карточек приложения. Раньше этот объект был
// скопирован символ-в-символ в 8 местах (страницы + workoutShared +
// mealPlan/types + measurements/shared) — теперь один источник.
export const glassCardStyle: React.CSSProperties = {
  borderRadius: '22px',
  background: 'linear-gradient(180deg, rgba(17, 49, 69, 0.96), rgba(10, 32, 46, 0.96))',
  border: '1px solid rgba(160, 200, 220, 0.18)',
  boxShadow: '0 22px 44px rgba(0, 0, 0, 0.28)',
  padding: '14px',
};

// Единый фон страниц (копировался в 17 файлах).
export const pageBackground = (bg: string) => `
  radial-gradient(circle at top, rgba(83, 212, 107, 0.18), transparent 34%),
  radial-gradient(circle at 20% 25%, rgba(60, 140, 255, 0.12), transparent 24%),
  linear-gradient(180deg, #07111d 0%, ${bg} 28%, #081523 100%)
`;
