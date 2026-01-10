# CHUNK_4_I18N_THEME_UI.md — Русификация + стилистика + конфиг темы/цветов

## Цели итерации
1) Полностью русифицировать UI (все тексты, кнопки, статусы).
2) Вынести цвета/тему в единый конфиг (чтобы потом легко менять).
3) Привести интерфейс к единой стилистике: аккуратные карточки, отступы, типографика, кнопки.
4) Учитывать Telegram тему (dark/light) по возможности.

---

## 1) i18n (упрощенный, без библиотек)
Не подключать тяжелые библиотеки. Сделать легкий словарь и helper:

- apps/web/src/i18n/ru.ts — объект переводов
- apps/web/src/i18n/index.ts — функция t(key, params?)

Требования:
- Все видимые строки заменить на t('...')
- Ключи понятные: today.title, totals.title, entry.add, entry.edit, entry.delete, products.title и т.д.
- Поддержать простую подстановку параметров:
  - t('today.dateTitle', { date }) -> "Сегодня — 2026-01-10"
- Язык пока один: ru. Структуру оставить расширяемой (чтобы потом добавить en).

---

## 2) Theme config (централизованные цвета)
Сделать файл:
- apps/web/src/theme/theme.ts

В нем описать:
- palette: { bg, surface, text, textMuted, primary, primaryText, danger, success, border }
- spacing: { xs, sm, md, lg }
- radius: { sm, md, lg }
- shadow: { sm, md }
- typography: { h1, h2, body, small } (минимально)

Сделать helper:
- apps/web/src/theme/useTheme.ts
  - читает Telegram.WebApp.themeParams (если доступно)
  - если нет — использует дефолтную тему
  - определяет isDark и подбирает palette

Важно:
- Реальные цвета должны быть только в theme.ts (или одном месте).
- Компоненты НЕ должны содержать “захардкоженных” hex’ов.

---

## 3) UI компоненты (минимальная дизайн-система)
Сделать базовые компоненты:

- apps/web/src/ui/Button.tsx
  - variants: primary | secondary | danger
  - sizes: md
  - использует theme

- apps/web/src/ui/Card.tsx
  - стандартная карточка с padding/border/radius/shadow

- apps/web/src/ui/Text.tsx (опционально)
  - h1/h2/body/small

- apps/web/src/ui/Input.tsx
  - единый стиль инпута

Задача: заменить текущие кнопки/карточки на эти компоненты.

---

## 4) Применить стиль к существующим экранам
Минимум:
- /today (главный экран)
- /products
- /entry/new и /entry/:id

Требования к визуалу (простые):
- фон приложения = theme.palette.bg
- карточки = theme.palette.surface
- единые отступы вокруг контента
- кнопки одной высоты, единый borderRadius
- цифры totals более заметные
- строки P/F/C более читаемые (muted)

---

## 5) Поведение под Telegram
- Использовать Telegram.WebApp.setHeaderColor / setBackgroundColor (если доступно) на основе темы
- Учитывать Telegram themeParams для цветов (если они присутствуют)
- Не ломать работу вне Telegram (в браузере)

---

## Acceptance Criteria
1) Все строки в UI на русском и идут через t().
2) В проекте есть theme.ts, и основные цвета меняются через него.
3) На экранах нет захардкоженных цветов (hex/rgb) — только из theme.
4) UI выглядит единообразно: Card + Button + Input.
5) Работает в Telegram Mini App и в обычном браузере.
