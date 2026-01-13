# CHUNK_6_DASHBOARD_PROFILE.md — Профиль + Норма + Новый Dashboard на Today

## Цели итерации

1. Добавить редактирование профиля пользователя (вес/рост/возраст/пол/активность/цель).
2. На backend считать дневную норму калорий и БЖУ-цели.
3. Переделать главный экран /today: вместо простого totals блок — dashboard как на скрине:
   - круговой прогресс калорий: consumed / target (например 1533 / 2200)
   - дуги/кольца по Б/Ж/У: граммы consumed / target
   - список продуктов/записей снизу как сейчас
   - выбор даты (вчера/сегодня/календарь)

---

## 1) Модель данных (Users)

Расширить users:

profile:

- weightKg: number (required for targets)
- heightCm: number (required for targets)
- birthYear: number (или age: number) // проще: age number
- gender: 'male'|'female' (required for formula)
- activityLevel: 'low'|'medium'|'high'|'very_high' (required)
- goal: 'lose'|'maintain'|'gain' (default 'maintain')
- goalSpeed: 'slow'|'normal' (optional) // можно не делать в MVP
- updatedAt

targets (computed можно не хранить, но удобно кешировать):

- kcalTarget: number
- proteinTargetG: number
- fatTargetG: number
- carbTargetG: number

Важно: targets можно считать на лету по profile (лучше), а в user хранить только profile.

---

## 2) Расчет нормы (backend)

Использовать Mifflin–St Jeor:

- BMR male = 10*w + 6.25*h - 5\*age + 5
- BMR female = 10*w + 6.25*h - 5\*age - 161

Activity multiplier:

- low: 1.2
- medium: 1.375
- high: 1.55
- very_high: 1.725

TDEE = BMR \* multiplier

Goal adjustment:

- maintain: target = TDEE
- lose: target = TDEE - 300
- gain: target = TDEE + 300
  Clamp min target: 1200

Округлить до целого.

BЖУ targets (MVP простые):

- proteinTargetG = round(weightKg \* 1.6) // 1.6г на кг
- fatTargetG = round(weightKg \* 0.9) // 0.9г на кг
- carbsTargetG:
  remainingKcal = kcalTarget - (proteinTargetG*4 + fatTargetG*9)
  carbTargetG = max(0, round(remainingKcal/4))

(Если remainingKcal < 0 — уменьшать fatTargetG в будущем, но в MVP просто max(0))

---

## 3) Backend API

### Profile

GET /profile
Response:
{
user: { id, username, displayName, avatarEmoji },
profile: { weightKg, heightCm, age, gender, activityLevel, goal },
targets: { kcalTarget, proteinTargetG, fatTargetG, carbTargetG }
}

PATCH /profile
Body:
{ weightKg, heightCm, age, gender, activityLevel, goal }
Validation:

- weightKg: 30..300
- heightCm: 120..230
- age: 10..100
- gender enum
- activityLevel enum
- goal enum

### Day dashboard

GET /dashboard/day?date=YYYY-MM-DD
Response:
{
date,
consumed: { kcal, protein, fat, carb },
targets: { kcalTarget, proteinTargetG, fatTargetG, carbTargetG },
progress: {
kcalPct: number (0..1),
proteinPct: number (0..1),
fatPct: number (0..1),
carbPct: number (0..1)
}
}

Примечание:

- consumed брать из entries (как stats/day сейчас)
- targets брать из profile (расчет)
- если профиль не заполнен — targets = null, progress = null

---

## 4) Frontend — экран Profile

Добавить страницу /profile:

- форма:
  - Вес (кг)
  - Рост (см)
  - Возраст (лет)
  - Пол (м/ж)
  - Активность (низкая/средняя/высокая/очень высокая)
  - Цель (похудение/поддержание/набор)
- кнопка Сохранить -> PATCH /profile
- после сохранения navigate('/today')
- если профиль не заполнен: на /today показывать баннер "Заполните профиль для расчета нормы" с кнопкой перейти на /profile

---

## 5) Frontend — новый Dashboard на /today

Заменить текущий totals блок на компонент DashboardRing:

Визуал:

- центральная цифра: consumed kcal
- под ней: target kcal ("2 200 ккал")
- вокруг 3 дуги/кольца:
  - Белки: consumed/target в граммах
  - Жиры: consumed/target
  - Углеводы: consumed/target
- можно сделать SVG arcs (без тяжелых библиотек), либо Canvas.
- Цвета брать из theme (primary, success, danger, etc.) но НЕ хардкодить hex.

Функционал:

- выбранная дата (как ранее): prev/next + календарь (input type=date)
- запрос:
  - GET /dashboard/day?date=
  - GET /entries?date= (список внизу)
- если targets null -> показывать простой totals как fallback + баннер заполнить профиль.

---

## 6) Acceptance Criteria

1. /profile позволяет сохранить параметры и они лежат в users.
2. /dashboard/day возвращает consumed + targets + progress.
3. /today отображает новый dashboard (кольца + central kcal).
4. Если профиль не заполнен — показывается CTA заполнить профиль.
5. Работает в Telegram Mini App.
