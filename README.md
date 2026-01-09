# Calorie Tracker

Monorepo для трекера калорий с backend на NestJS и frontend на React (Telegram WebApp).

## Установка

### Требования

- Node.js 18+
- pnpm 8+

### Установка pnpm

```bash
npm install -g pnpm
```

или через curl:

```bash
curl -fsSL https://get.pnpm.io/install.sh | sh -
```

### Установка зависимостей

```bash
pnpm i
```

## Запуск

### Backend (API)

```bash
pnpm dev:api
```

API запустится на `http://localhost:3000`

Endpoints:
- `GET /health` - проверка работоспособности
- `POST /auth/telegram` - авторизация через Telegram WebApp
- `GET /me` - получение текущего пользователя (требует авторизации)

### Frontend (Web)

```bash
pnpm dev:web
```

Frontend запустится на `http://localhost:5173`

## Настройка

### Backend (apps/api/.env)

Скопируйте `apps/api/.env.example` в `apps/api/.env` и заполните:

```env
PORT=3000
MONGO_URI=mongodb://sanya:sanya@192.168.50.167:27017/calories?authSource=admin
JWT_SECRET=your-secret-key-here-min-32-chars
JWT_EXPIRES_IN=7d
TELEGRAM_BOT_TOKEN=your-telegram-bot-token-here
```

**Важно:** 
- `JWT_SECRET` должен быть длиной минимум 32 символа
- `TELEGRAM_BOT_TOKEN` получается у [@BotFather](https://t.me/BotFather) в Telegram

### Frontend (apps/web/.env)

Скопируйте `apps/web/.env.example` в `apps/web/.env`:

```env
VITE_API_URL=http://localhost:3000
```

## Тестирование /auth/telegram

⚠️ **Важно:** `initData` приходит только из реального Telegram WebApp приложения. Нельзя просто скопировать строку - она подписана HMAC и содержит временную метку.

Для тестирования:

1. Создайте бота через [@BotFather](https://t.me/BotFather)
2. Получите `TELEGRAM_BOT_TOKEN`
3. Настройте WebApp URL в настройках бота
4. Откройте бота в Telegram
5. Frontend автоматически отправит `initData` на `/auth/telegram`

Алгоритм верификации:
- Проверяется HMAC SHA256 подпись
- Проверяется `auth_date` (не старше 24 часов)
- Создается/обновляется пользователь в MongoDB
- Возвращается JWT token

## Структура проекта

```
calorie-tracker/
├── apps/
│   ├── api/          # NestJS backend
│   └── web/          # React + Vite frontend
├── package.json
├── pnpm-workspace.yaml
└── README.md
```

