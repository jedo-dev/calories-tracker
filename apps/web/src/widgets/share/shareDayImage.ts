// Генерация PNG-отчёта за день (для шаринга в соцсети).
// Рисуем на canvas: шапка с лого и датой, сводка калорий/БЖУ (как второй
// слайд дашборда), приёмы пищи по группам и маскот с подписью fit.flareon.ru.
import logoUrl from '../../assets/01_brand/logo_main.png';
import mascotUrl from '../../assets/08_mascot/mascot_fox_celebrate.png';
import mealBreakfastUrl from '../../assets/11_meal_types/meal_breakfast.jpg';
import mealLunchUrl from '../../assets/11_meal_types/meal_lunch.jpg';
import mealDinnerUrl from '../../assets/11_meal_types/meal_dinner.jpg';
import mealSnackUrl from '../../assets/11_meal_types/meal_snack.jpg';
import nutCaloriesUrl from '../../assets/06_nutrition/nut_calories.jpg';
import type { Entry } from '../../pages/TodayPage';

export const SHARE_URL = 'https://fit.flareon.ru';
export const SHARE_TEXT = `Смотри, что я сделал в классном приложении FlareonFit 🦊 ${SHARE_URL}`;

export interface ShareDashboard {
  consumed: { kcal: number; protein: number; fat: number; carb: number };
  targets: { kcalTarget: number; proteinTargetG: number; fatTargetG: number; carbTargetG: number } | null;
  progress: { kcalPct: number; proteinPct: number; fatPct: number; carbPct: number } | null;
}

const MEAL_ORDER = ['breakfast', 'lunch', 'dinner', 'snack', 'other'];

const MEAL_META: Record<string, { label: string; color: string; iconUrl: string }> = {
  breakfast: { label: 'Завтрак', color: '#F7C948', iconUrl: mealBreakfastUrl },
  lunch: { label: 'Обед', color: '#FF9F1A', iconUrl: mealLunchUrl },
  dinner: { label: 'Ужин', color: '#B77BFF', iconUrl: mealDinnerUrl },
  snack: { label: 'Перекус', color: '#5CCBFF', iconUrl: mealSnackUrl },
  other: { label: 'Другое', color: '#94A3B8', iconUrl: nutCaloriesUrl },
};

const FONT = "-apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";
const W = 1080;
const PAD = 64;
const MAX_ENTRIES_PER_MEAL = 4;

type MealGroup = { mealType: string; entries: Entry[]; totalKcal: number };

function groupEntries(entries: Entry[]): MealGroup[] {
  const map = new Map<string, Entry[]>();
  for (const entry of entries) {
    const key = MEAL_META[entry.mealType] ? entry.mealType : 'other';
    const list = map.get(key) || [];
    list.push(entry);
    map.set(key, list);
  }
  return MEAL_ORDER.map((mealType) => {
    const mealEntries = map.get(mealType) || [];
    return {
      mealType,
      entries: mealEntries,
      totalKcal: mealEntries.reduce((sum, e) => sum + e.kcal, 0),
    };
  }).filter((g) => g.entries.length > 0);
}

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function roundRectPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function ellipsize(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let result = text;
  while (result.length > 1 && ctx.measureText(result + '…').width > maxWidth) {
    result = result.slice(0, -1);
  }
  return result + '…';
}

function drawCardBg(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  const grad = ctx.createLinearGradient(0, y, 0, y + h);
  grad.addColorStop(0, 'rgba(18, 56, 79, 0.96)');
  grad.addColorStop(1, 'rgba(12, 37, 54, 0.98)');
  roundRectPath(ctx, x, y, w, h, 36);
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.strokeStyle = 'rgba(146, 188, 221, 0.22)';
  ctx.lineWidth = 2;
  ctx.stroke();
}

function drawRoundIcon(ctx: CanvasRenderingContext2D, img: HTMLImageElement | null, x: number, y: number, size: number, fallbackColor: string) {
  ctx.save();
  roundRectPath(ctx, x, y, size, size, size * 0.3);
  ctx.clip();
  if (img) {
    ctx.drawImage(img, x, y, size, size);
  } else {
    ctx.fillStyle = fallbackColor;
    ctx.fillRect(x, y, size, size);
  }
  ctx.restore();
}

function drawMacroBar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  label: string,
  value: number,
  target: number,
  pct: number,
) {
  ctx.textBaseline = 'alphabetic';
  ctx.font = `500 30px ${FONT}`;
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'left';
  ctx.fillText(label, x, y);

  ctx.textAlign = 'right';
  ctx.font = `600 30px ${FONT}`;
  ctx.fillStyle = '#ffffff';
  const valueText = `${Math.round(value)}`;
  const restText = ` / ${Math.round(target)} г`;
  const restWidth = ctx.measureText(restText).width;
  ctx.fillStyle = '#94A3B8';
  ctx.fillText(restText, x + width, y);
  ctx.fillStyle = '#ffffff';
  ctx.fillText(valueText, x + width - restWidth, y);

  const barY = y + 16;
  roundRectPath(ctx, x, barY, width, 14, 7);
  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  ctx.fill();
  const filled = Math.max(0.06, Math.min(1, pct));
  const grad = ctx.createLinearGradient(x, 0, x + width, 0);
  grad.addColorStop(0, '#58D45D');
  grad.addColorStop(1, '#79E26C');
  roundRectPath(ctx, x, barY, width * filled, 14, 7);
  ctx.fillStyle = grad;
  ctx.fill();
}

function formatDateRu(dateISO: string): string {
  const [y, m, d] = dateISO.split('-').map(Number);
  const months = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
  return `${d} ${months[(m || 1) - 1]} ${y}`;
}

export async function renderDayReport(params: {
  dateISO: string;
  entries: Entry[];
  dashboard: ShareDashboard | null;
  waterMl?: number;
  waterGoalMl?: number;
}): Promise<Blob> {
  const { dateISO, entries, dashboard, waterMl, waterGoalMl } = params;
  const groups = groupEntries(entries);

  const [logo, mascot, ...mealIcons] = await Promise.all([
    loadImage(logoUrl),
    loadImage(mascotUrl),
    ...groups.map((g) => loadImage(MEAL_META[g.mealType].iconUrl)),
  ]);

  // Расчёт высоты: шапка + карточка сводки + карточки приёмов пищи + футер с маскотом
  const headerH = 150;
  const summaryH = dashboard ? 380 : 0;
  const mealGap = 28;
  const mealHeights = groups.map((g) => {
    const lines = Math.min(g.entries.length, MAX_ENTRIES_PER_MEAL);
    const moreLine = g.entries.length > MAX_ENTRIES_PER_MEAL ? 1 : 0;
    return 128 + (lines + moreLine) * 46 + 16;
  });
  const mealsH = mealHeights.reduce((s, h) => s + h + mealGap, 0);
  const footerH = 330;
  const H = Math.max(1350, PAD + headerH + summaryH + 40 + mealsH + footerH + PAD / 2);

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas 2d context unavailable');

  // Фон
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#0F2839');
  bg.addColorStop(0.5, '#0D2231');
  bg.addColorStop(1, '#081A28');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Зелёное свечение сверху
  const glow = ctx.createRadialGradient(W / 2, 0, 0, W / 2, 0, 700);
  glow.addColorStop(0, 'rgba(83, 212, 107, 0.12)');
  glow.addColorStop(1, 'rgba(83, 212, 107, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, 700);

  // Шапка
  let y = PAD;
  drawRoundIcon(ctx, logo, PAD, y, 96, '#53D46B');
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';
  ctx.fillStyle = '#ffffff';
  ctx.font = `700 56px ${FONT}`;
  ctx.fillText('FlareonFit', PAD + 120, y + 52);
  ctx.font = `400 32px ${FONT}`;
  ctx.fillStyle = '#94A3B8';
  ctx.fillText(`Мой день · ${formatDateRu(dateISO)}`, PAD + 120, y + 96);
  y += headerH;

  // Сводка: круг калорий + макро-бары (второй слайд дашборда)
  if (dashboard) {
    const cardH = summaryH - 20;
    drawCardBg(ctx, PAD, y, W - PAD * 2, cardH);

    const cx = PAD + 190;
    const cy = y + cardH / 2;
    const r = 110;
    const stroke = 20;
    const kcal = dashboard.consumed.kcal;
    const target = dashboard.targets?.kcalTarget || 0;
    const pct = dashboard.progress?.kcalPct ?? (target > 0 ? kcal / target : 0);
    const ringColor = pct > 1.1 ? '#E53E3E' : pct > 0.9 ? '#FFA500' : '#58D45D';

    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = stroke;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.max(0, Math.min(1, pct)));
    ctx.strokeStyle = ringColor;
    ctx.lineCap = 'round';
    ctx.lineWidth = stroke;
    ctx.stroke();
    ctx.lineCap = 'butt';

    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.font = `700 52px ${FONT}`;
    ctx.fillText(`${Math.round(kcal)}`, cx, cy + 4);
    ctx.font = `400 28px ${FONT}`;
    ctx.fillStyle = '#94A3B8';
    if (target > 0) {
      ctx.fillText(`из ${Math.round(target)}`, cx, cy + 44);
      ctx.fillText('ккал', cx, cy + 78);
    } else {
      ctx.fillText('ккал', cx, cy + 44);
    }

    const barX = PAD + 350;
    const barW = W - PAD * 2 - 350 - 48;
    const t = dashboard.targets;
    if (t) {
      const p = dashboard.progress;
      let barY = y + 84;
      drawMacroBar(ctx, barX, barY, barW, 'Белки', dashboard.consumed.protein, t.proteinTargetG, p?.proteinPct ?? 0);
      barY += 92;
      drawMacroBar(ctx, barX, barY, barW, 'Жиры', dashboard.consumed.fat, t.fatTargetG, p?.fatPct ?? 0);
      barY += 92;
      drawMacroBar(ctx, barX, barY, barW, 'Углеводы', dashboard.consumed.carb, t.carbTargetG, p?.carbPct ?? 0);
    }

    // Вода в нижней части карточки
    if (typeof waterMl === 'number' && waterGoalMl) {
      ctx.textAlign = 'right';
      ctx.font = `500 28px ${FONT}`;
      ctx.fillStyle = '#5CCBFF';
      ctx.fillText(`💧 ${waterMl} / ${waterGoalMl} мл`, W - PAD - 48, y + cardH - 36);
    }

    y += summaryH;
  }

  y += 20;

  // Заголовок секции питания
  ctx.textAlign = 'left';
  ctx.fillStyle = '#ffffff';
  ctx.font = `700 40px ${FONT}`;
  ctx.fillText('Питание за день', PAD, y);
  y += 20;

  if (groups.length === 0) {
    ctx.font = `400 32px ${FONT}`;
    ctx.fillStyle = '#94A3B8';
    ctx.fillText('Пока нет записей', PAD, y + 48);
    y += 90;
  }

  // Карточки приёмов пищи
  groups.forEach((group, i) => {
    const meta = MEAL_META[group.mealType];
    const cardH = mealHeights[i];
    drawCardBg(ctx, PAD, y, W - PAD * 2, cardH);

    const iconSize = 72;
    drawRoundIcon(ctx, mealIcons[i], PAD + 32, y + 28, iconSize, meta.color);

    ctx.textAlign = 'left';
    ctx.fillStyle = '#ffffff';
    ctx.font = `700 36px ${FONT}`;
    ctx.fillText(meta.label, PAD + 32 + iconSize + 24, y + 62);

    ctx.textAlign = 'right';
    ctx.font = `700 36px ${FONT}`;
    ctx.fillStyle = '#53D46B';
    const kcalText = `${Math.round(group.totalKcal)}`;
    ctx.fillText(kcalText, W - PAD - 100, y + 62);
    ctx.font = `400 26px ${FONT}`;
    ctx.fillStyle = '#94A3B8';
    ctx.textAlign = 'left';
    ctx.fillText('ккал', W - PAD - 92, y + 62);

    // Разделитель
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(PAD + 32, y + 108);
    ctx.lineTo(W - PAD - 32, y + 108);
    ctx.stroke();

    let lineY = y + 152;
    const shown = group.entries.slice(0, MAX_ENTRIES_PER_MEAL);
    for (const entry of shown) {
      ctx.font = `400 30px ${FONT}`;
      ctx.fillStyle = '#CBD5E1';
      ctx.textAlign = 'left';
      const kcalPart = `${Math.round(entry.kcal)} ккал`;
      ctx.textAlign = 'right';
      ctx.fillStyle = '#94A3B8';
      ctx.fillText(kcalPart, W - PAD - 32, lineY);
      const kcalW = ctx.measureText(kcalPart).width;
      ctx.textAlign = 'left';
      ctx.fillStyle = '#CBD5E1';
      const name = ellipsize(ctx, `${entry.productName} · ${Math.round(entry.grams)} г`, W - PAD * 2 - 64 - kcalW - 32);
      ctx.fillText(name, PAD + 32, lineY);
      lineY += 46;
    }
    if (group.entries.length > MAX_ENTRIES_PER_MEAL) {
      ctx.font = `400 28px ${FONT}`;
      ctx.fillStyle = '#94A3B8';
      ctx.fillText(`+ ещё ${group.entries.length - MAX_ENTRIES_PER_MEAL}`, PAD + 32, lineY);
    }

    y += cardH + mealGap;
  });

  // Футер: текст слева, маскот справа снизу
  const mascotSize = 300;
  const mascotX = W - PAD - mascotSize + 30;
  const mascotY = H - mascotSize - 30;

  ctx.textAlign = 'left';
  const footerTextY = H - 190;
  ctx.font = `500 34px ${FONT}`;
  ctx.fillStyle = '#CBD5E1';
  ctx.fillText('Считаю калории и тренируюсь', PAD, footerTextY);
  ctx.fillText('в приложении', PAD, footerTextY + 48);
  ctx.font = `700 48px ${FONT}`;
  ctx.fillStyle = '#53D46B';
  ctx.fillText('fit.flareon.ru', PAD, footerTextY + 120);

  if (mascot) {
    ctx.drawImage(mascot, mascotX, mascotY, mascotSize, mascotSize);
  }

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('canvas toBlob failed'));
    }, 'image/png');
  });
}
