# CURSOR.md — Bootstrap проекта (Stage 0-1)

## Цель

Создать monorepo (один репозиторий) для:

- backend: NestJS + MongoDB (Mongoose)
- frontend: React (Vite) как Telegram WebApp
- авторизация: Telegram WebApp initData -> backend verify -> JWT

## Важно про Mongo

MongoDB уже развернут на домашнем сервере. Использовать строку:
MONGO_URI="mongodb://sanya:sanya@192.168.50.167:27017/calories?authSource=admin"

Если база `calories` не существует — Mongo создаст её при первой записи.

## Репозиторий / структура

В корне repo:

- package.json (workspaces)
- pnpm-workspace.yaml
- .gitignore
- .env.example

Папки:

- apps/api (NestJS)
- apps/web (React Vite)

## Требования к запуску

Команды в корне:

- pnpm i
- pnpm dev:api (Nest на PORT=3000)
- pnpm dev:web (Vite на PORT=5173)

Backend должен иметь endpoint:

- GET /health -> { ok: true }

## Backend (apps/api)

1. NestJS проект
2. Подключить ConfigModule (global) и MongooseModule.forRoot(MONGO_URI)
3. Создать модули:

- AuthModule
- UsersModule
- HealthModule

### User schema (Mongo)

Коллекция users:

- tgUserId: number (unique)
- username?: string
- firstName?: string
- lastName?: string
  timestamps: true

### Auth

POST /auth/telegram
Body: { initData: string }
Response: { token: string, user: { id, tgUserId, username? } }

Auth flow:

- verify initData по Telegram WebApp алгоритму (HMAC sha256)
- проверить auth_date не старше 24 часов
- upsert user по tgUserId
- выдать JWT (secret из env)
  JWT expires: 7d

### Guard

Сделать JwtAuthGuard:

- защищать все роуты кроме /auth/telegram и /health
- пример защищенного роутера можно добавить /me (GET) -> возвращает user

## Frontend (apps/web)

React + Vite.
Сделать:

- простой экран "Loading / Logged in"
- hook useTelegramAuth():
  - берёт window.Telegram.WebApp.initData
  - вызывает POST http://localhost:3000/auth/telegram
  - сохраняет token в localStorage
  - хранит user в state
- добавить axios/fetch wrapper, который подставляет Authorization Bearer token

UI минимальный, без дизайна.

## ENV

Сделать:

- apps/api/.env.example:
  PORT=3000
  MONGO_URI=...
  JWT_SECRET=...
  JWT_EXPIRES_IN=7d
  TELEGRAM_BOT_TOKEN=...

- apps/web/.env.example:
  VITE_API_URL=http://localhost:3000

## Документация

В корневой README.md:

- как установить pnpm
- как запустить api/web
- как настроить TELEGRAM_BOT_TOKEN
- пример, как тестировать /auth/telegram (описать, что initData приходит только из Telegram)

## Acceptance Criteria

- pnpm i && pnpm dev:api -> /health работает
- /auth/telegram валидирует initData (при неверном возвращает 401)
- при валидном initData создаётся user в Mongo и возвращается token
- фронт при старте пытается залогиниться и показывает userId
