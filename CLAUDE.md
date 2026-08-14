# CLAUDE.md

Руководство для Claude Code по работе с этим репозиторием.

## Что это

FlareonFit — трекер калорий, воды, веса и тренировок с социальными фичами
(стрики, XP, лиги, лента друзей, рецепты, AI-распознавание еды по фото).
PWA на русском языке (единственная локаль).

## Стек и структура

pnpm-монорепо (workspace), два приложения:

- `apps/api` — NestJS 10 + Mongoose (MongoDB), JWT-авторизация, порт 3000.
- `apps/web` — React 18 + Vite 5 + TypeScript, react-router, axios, порт 5173.
  Vite в dev проксирует `/api` → `localhost:3000`.

## Команды

```bash
pnpm dev:api      # NestJS с watch
pnpm dev:web      # Vite dev-сервер
pnpm build:api
pnpm build:web    # tsc && vite build
```

Проверка типов (основной способ верификации, тестов в проекте нет):

```bash
cd apps/api && npx tsc --noEmit
cd apps/web && npx tsc --noEmit
```

## ВАЖНО: два lock-файла

Локально проект живёт на pnpm (`pnpm-lock.yaml` в корне), но Docker-образы
ставят зависимости через `npm ci` по отдельным `apps/*/package-lock.json`.
После добавления зависимости обязательно синхронизировать оба:

```bash
pnpm --filter api add <pkg>
cd apps/api && npm install --package-lock-only
```

Иначе деплой упадёт на `npm ci` с «Missing from lock file».

## API: конвенции

- Модуль на фичу: `src/<feature>/{feature}.module.ts` + controller + service +
  `schemas/*.schema.ts` (Mongoose-схемы через `@nestjs/mongoose` декораторы).
- `JwtAuthGuard` глобальный (`APP_GUARD` в `app.module.ts`); id пользователя —
  `req.user.id`. Контроллеры часто дублируют `@UseGuards(JwtAuthGuard)` — не ошибка.
- DTO-классов почти нет: тела запросов принимаются как `any` с ручной валидацией
  и `BadRequestException` (см. `water.controller.ts`). Глобальный ValidationPipe
  с whitelist работает только там, где DTO есть.
- Даты хранятся строками `YYYY-MM-DD`, время — `HH:mm`.
- Крон-задачи — `@nestjs/schedule` (подключён в `app.module.ts`).
- Конфиг — `@nestjs/config` из `apps/api/.env` (пример — `.env.example`).

## Web: конвенции

- Страницы в `src/pages`, переиспользуемые блоки — `src/widgets/<область>/`.
- Стили — инлайновые `style={{...}}` объекты; общие — `src/theme/styles.ts`
  (`glassCardStyle`, `pageBackground`) и `useTheme()`.
- Все строки UI — через `t('раздел.ключ')` из `src/i18n` (словарь `ru.ts`).
  Плюрализация — `plural(n, key)`.
- HTTP — только через `apiClient` (`src/api/client.ts`): baseURL, JWT из
  localStorage, редирект на /login при 401.
- Комментарии в коде — на русском, объясняют «почему», а не «что».

## Пуш-уведомления

- API-модуль `src/notifications`: Web Push (VAPID), настройки пользователя,
  крон каждые 10 минут. Анти-спам зашит в планировщик: максимум 2 пуша в день,
  тихие часы, отправка только если напоминание актуально (дневник пуст и т.п.).
- Ключи — env `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` / `VAPID_SUBJECT`.
  Без них модуль пишет warning и молчит. Генерация:
  `npx web-push generate-vapid-keys`. Смена ключей ломает все подписки.
- Web: сервис-воркер `public/sw.js` (только пуши, без кэширования),
  подписка — `src/utils/push.ts`, UI — `widgets/profile/NotificationsCard.tsx`.
  Разрешение браузера запрашивается только по явному действию пользователя.

## Стрики

- Логика в `social/social.service.ts` (`updateStreakIfFirstLogOfDay`), константы
  экономики там же. Стрик-фризы (запас ≤ 2, новичкам 1, покупка 30 XP)
  списываются автоматически при пропуске дней; сгоревший стрик ≥ 3 дней можно
  восстановить за 50 XP в течение 2 дней (`lostStreak`/`lostStreakDate`).
- Траты идут только из `xpTotal`; недельный `xpWeek` (лидерборд) не трогается.
- UI — `widgets/profile/StreakCard.tsx`.

## Подписка FlareonFit Plus (freemium)

- API-модуль `src/billing`: `User.premiumUntil`, `GET /billing/status`,
  активация премиум-кодов `POST /billing/redeem`; админ: `POST /billing/grant/:userId`
  и `POST /billing/codes` (создание кодов на N дней).
- Платёжного провайдера нет: кнопки тарифов на `PremiumCard` — fake door
  (событие `premium_interest` в аналитике меряет спрос), выдача — коды/админ.
- Единственный гейт сейчас — AI-лимит: `AiQuotaService.limitFor()` даёт Plus
  расширенный лимит (env `AI_PREMIUM_MONTHLY_LIMIT`, дефолт 300 против 10).
- UI — `widgets/profile/PremiumCard.tsx` в профиле.

## Интервальное голодание

- API-модуль `src/fasting`: сессии в Mongo, одна активная на пользователя
  (endedAt == null), `POST /fasting/start|stop`, `GET /fasting/current|history`.
  За фаст, завершённый по цели, — +5 XP через SocialService.
- Web: страница `/fasting` (таймер, протоколы 12/16/18/20, история),
  пункт «Голодание» в меню в группе «Питание».

## Продуктовая аналитика

- Своя, без внешних сервисов. API-модуль `src/analytics`: события в Mongo
  с TTL 180 дней, `POST /analytics/events` (батч), `GET /analytics/summary`
  (только admin) — DAU/WAU/MAU, ретеншн D1/W1, топ фич считаются на лету.
- Web: `src/utils/analytics.ts` — `track(name, props)` с очередью и батчингом;
  просмотры страниц трекаются автоматически (`PageViewTracker` в `App.tsx`,
  id в путях схлопываются в `:id`). Дашборд — `/admin/analytics` (пункт
  «Аналитика» в меню у роли admin).

## Деплой

Push в `main` → GitHub Actions (`.github/workflows/main.yml`, self-hosted
runner) → `docker-compose build && up`. Секреты прокидываются из GitHub
Secrets через env шага в `docker-compose.yml`. Новая env-переменная должна
появиться в четырёх местах: `.env.example`, `docker-compose.yml`,
`docker-compose.local.yml`, `main.yml` (оба шага) + секрет в GitHub.

## Процесс работы

- Верификация — только `tsc --noEmit` в обоих приложениях; билд и UI
  пользователь проверяет сам, браузерная верификация не нужна.
- Markdown-файлы в корне (CHUNK_*.md, *_REVIEW.md и т.п.) — исторические
  ТЗ/отчёты, не актуальная документация.
