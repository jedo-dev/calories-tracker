# Seed Products Data

## Расположение файла

Поместите файл `products.jsonl` в эту директорию: `apps/api/data/seed/products.jsonl`

## Формат файла

Файл должен быть в формате JSONL (JSON Lines) - каждая строка это отдельный JSON объект.

### Формат A (Open Food Facts-like):

```json
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
```

### Формат B (Упрощенный):

```json
{
  "sourceId": "123",
  "name": "Milk",
  "kcalPer100g": 60,
  "proteinPer100g": 3.2,
  "fatPer100g": 3.5,
  "carbPer100g": 4.7
}
```

## Запуск seed

```bash
# Из корня проекта
pnpm --filter api seed:products

# Или с указанием пути к файлу
pnpm --filter api seed:products /path/to/products.jsonl
```

## Правила импорта

- Пропускаются записи без `name` или `kcalPer100g`
- P/F/C если отсутствуют - ставятся 0 (логируется счетчик missingMacros)
- Имя нормализуется: trim, множественные пробелы заменяются одним
- source = 'OFF' для формата A, 'CUSTOM_SEED' для формата B
- Upsert по (source, sourceId) если sourceId есть, иначе по nameNormalized + source
