# CHUNK_3_ENTRIES.md — Entries (приемы пищи) + дневные итоги + UI Today/Add/Edit

## Цель итерации

1. Добавить сущность Entry (лог приемов пищи) в Mongo.
2. Реализовать API: CRUD для entries + статистика за день.
3. На фронте:
   - экран Today (итоги + список приемов)
   - экран Add/Edit entry (выбор продукта, граммы, mealType, время)
   - возможность удалить и редактировать entry

## Модель Entry (Mongo)

Коллекция: entries

Поля:

- userId: ObjectId (required, ref Users)
- date: string (YYYY-MM-DD) required // день пользователя, без таймзоны
- time?: string (HH:mm) // опционально
- mealType: 'breakfast'|'lunch'|'dinner'|'snack'|'other' (default 'other')

Ссылка/описание продукта:

- productId?: ObjectId (ref Products)
- productName: string (required) // фиксируем имя на момент записи (snapshot)

Граммы:

- grams: number (required, >0)

Snapshot нутриентов на 100г (фиксируем при создании/смене продукта):

- kcalPer100g: number (required)
- proteinPer100g: number (default 0)
- fatPer100g: number (default 0)
- carbPer100g: number (default 0)

Computed totals для этой записи (храним для скорости/UI):

- kcal: number
- protein: number
- fat: number
- carb: number

timestamps: true

Индексы:

- { userId: 1, date: 1, createdAt: 1 }
- { userId: 1, date: 1, mealType: 1 } (не обязательно, но можно)

## Правила расчета

- factor = grams / 100
- kcal = round(kcalPer100g \* factor, 2)
- protein/fat/carb = round(xPer100g \* factor, 2)
  Округление до 2 знаков.

## API (Nest)

### GET /entries?date=YYYY-MM-DD

Возвращает список entries текущего пользователя за дату.
Сортировка:

- если time есть: по time ASC
- иначе по createdAt ASC

Response: Entry[]

### POST /entries

Body:
{
date: "YYYY-MM-DD",
time?: "HH:mm",
mealType?: "...",
productId: "ObjectId",
grams: number
}

Поведение:

- найти product по productId
- заполнить snapshot (productName + нутриенты на 100г)
- посчитать computed totals
- сохранить entry

Response: Entry

### PATCH /entries/:id

Body (частично):
{
date?: "YYYY-MM-DD",
time?: "HH:mm",
mealType?: "...",
productId?: "ObjectId",
grams?: number
}

Поведение:

- если изменился productId: обновить snapshot из продукта
- если изменились grams и/или snapshot: пересчитать computed totals
- сохранить

Response: Entry

### DELETE /entries/:id

Response: { ok: true }

### GET /stats/day?date=YYYY-MM-DD

Агрегация по entries текущего пользователя:
Response:
{
date: "YYYY-MM-DD",
totals: { kcal, protein, fat, carb },
entriesCount: number
}

## DTO/валидация

Использовать class-validator:

- date: IsString + matches YYYY-MM-DD
- time: optional matches HH:mm
- grams: IsNumber + Min(1)
- mealType: IsIn([...])
- productId: IsMongoId

## Frontend (React)

### Роуты

- /today (главный экран по умолчанию)
- /entry/new
- /entry/:id (edit)
- /products (уже есть)

### Экран Today

- Текущая дата (локально): YYYY-MM-DD
- Блок итогов: kcal + P/F/C
- Список entries:
  - productName
  - grams
  - kcal и P/F/C
  - время + mealType (если есть)
  - кнопки: Edit, Delete
- Кнопка: "+ Добавить" -> /entry/new

### Экран Add/Edit Entry

Поля:

- date (по умолчанию сегодня; можно сделать readonly в MVP или дать выбрать)
- time (optional)
- mealType (select)
- product: поиск и выбор
  - reuse /products API: search input + results dropdown
- grams (number input)
  Кнопки:
- Save (POST или PATCH)
- Cancel (назад)

Поведение:

- При edit загрузить entry по id (можно через GET /entries?date=... и найти, или добавить GET /entries/:id — если проще, добавить отдельный эндпоинт)
  Рекомендуется добавить:
- GET /entries/:id (для удобства edit)

### API client

Использовать существующий bearer token.
Все запросы на backend через тот же префикс, что уже работает (/api если у тебя прокси).

## UX для Telegram

- Использовать Telegram.WebApp.BackButton:
  - на /entry/new и /entry/:id включить, нажатие -> navigate(-1)
- На успешное сохранение: закрыть экран (navigate('/today'))

## Acceptance Criteria

1. В Mongo появляется коллекция entries.
2. Можно добавить entry, он отображается на Today.
3. Итоги дня корректно суммируются (kcal и P/F/C).
4. Entry можно редактировать (grams и product), totals обновляются.
5. Entry можно удалить.
6. Все работает в Telegram Mini App.
