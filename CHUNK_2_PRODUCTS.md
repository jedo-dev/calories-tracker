# CHUNK_2_PRODUCTS.md — Seed справочника + Products API + UI поиска

## Цель итерации

1. Добавить модель Product в Mongo (kcal + P/F/C на 100г).
2. Сделать seed-скрипт импорта справочника из локального файла (JSONL) в Mongo.
3. Сделать API для поиска/получения/создания продуктов.
4. На фронте сделать экран Products: поиск + список + выбор продукта.

## Источник данных для seed (ВАЖНО)

- Используем локальный файл JSONL: каждая строка — JSON объект.
- Файл положить в: apps/api/data/seed/products.jsonl
- В репозиторий можно НЕ коммитить огромный файл. Достаточно:
  - добавить папку apps/api/data/seed/
  - добавить README как положить файл
  - добавить .gitignore правило на \*.jsonl (по желанию)

Формат входных строк допускается 2 варианта (скрипт должен быть "толерантным"):
A) Open Food Facts-like:
{
"code": "123456789",
"product_name": "Milk",
"nutriments": {
"energy-kcal_100g": 60,
"proteins_100g": 3.2,
"fat_100g": 3.5,
"carbohydrates_100g": 4.7
}
}

B) Упрощенный наш:
{
"sourceId": "123",
"name": "Milk",
"kcalPer100g": 60,
"proteinPer100g": 3.2,
"fatPer100g": 3.5,
"carbPer100g": 4.7
}

## Правила импорта (качество данных)

- Пропускать записи, если нет name или kcalPer100g.
- P/F/C если нет — ставить 0 (но логировать счетчик missingMacros).
- Нормализовать name: trim, множественные пробелы -> один пробел.
- source = 'OFF' для варианта A, и source='CUSTOM_SEED' для варианта B.
- sourceId = code (A) или sourceId (B)
- upsert по (source, sourceId) если sourceId есть, иначе по name (case-insensitive) + source

## Mongo модель Product

Коллекция: products
Поля:

- name: string (required)
- nameNormalized: string (lowercase) (required, index)
- kcalPer100g: number (required)
- proteinPer100g: number (default 0)
- fatPer100g: number (default 0)
- carbPer100g: number (default 0)
- source: 'OFF' | 'USER' | 'CUSTOM_SEED'
- sourceId?: string
- createdBy?: ObjectId (если source USER)
  timestamps: true

Индексы:

- nameNormalized
- (source, sourceId) unique sparse
- text index по name (опционально), но достаточно nameNormalized prefix search

## Seed script

- файл: apps/api/scripts/seed-products.ts
- читает apps/api/data/seed/products.jsonl (путь задается env или аргументом)
- читает построчно (stream) чтобы не жрать память
- пишет прогресс каждые N строк
- по итогу выводит summary:
  - processed, inserted, updated, skippedNoName, skippedNoKcal, missingMacros

Добавить команду:

- apps/api/package.json:
  "seed:products": "ts-node -r tsconfig-paths/register scripts/seed-products.ts"

(Если в проекте нет ts-node — добавить как dev dependency)

## Products API (Nest)

Создать ProductsModule:

- Product schema + repository/service
- ProductsController:

GET /products?search=milk&limit=20

- search по nameNormalized (prefix/contains)
- сортировка: startsWith выше, затем по kcalPer100g не нужна
- limit по умолчанию 20, max 50

GET /products/:id

POST /products
Body: { name, kcalPer100g, proteinPer100g, fatPer100g, carbPer100g }

- source='USER'
- createdBy = текущий user из JWT
- nameNormalized рассчитать
- валидация DTO (class-validator)

## Frontend — экран Products

Добавить роут/страницу /products:

- Input search
- debounce 300ms
- список результатов (name + kcal/100g + P/F/C)
- при клике по продукту: пока просто показывать alert/console.log выбранный productId (на следующем chunk будем использовать в Add Entry)

API URL:

- использовать существующий API client (Bearer token)
- запрос GET /products?search=...

## Acceptance Criteria

1. pnpm --filter @app/api seed:products успешно заливает данные в Mongo.
2. GET /products?search=... возвращает найденные продукты.
3. POST /products создает новый продукт и он находится поиском.
4. В web есть страница /products с поиском и списком.
