# CHUNK_5_SOCIAL_XP.md — Social + XP + Streak + Leaderboards (Duolingo-like MVP)

## Цель итерации

Добавить социальные и игровые механики:

1. Подписки (follow): искать пользователей, подписываться/отписываться, списки.
2. Streak: серия дней логирования.
3. XP: очки за активность (в т.ч. weekly XP).
4. Лидерборды: среди друзей и глобальный за неделю.
5. Лента активности (упрощенная): события друзей за последние 7 дней.

---

## 0) Принципы (важно)

- XP начисляет только backend.
- Стрик считается по дням: день засчитан, если в этот день создан хотя бы 1 entry.
- Дата — строка YYYY-MM-DD как и сейчас.
- “Неделя” для weekly XP: ISO-неделя или просто неделю считать от понедельника 00:00 по UTC (проще).
- В MVP не делаем Cron. Weekly XP можно сбрасывать лениво: если weekKey изменился — сбросить при следующем запросе/начислении.

---

## 1) Расширение User

Коллекция users: добавить поля

- displayName: string (optional) // если нет — собрать из firstName/username
- isPublicProfile: boolean (default true)
- avatarEmoji: string (default '🦊') // просто эмодзи вместо аватарки

Индексы:

- tgUserId unique (уже есть)
- username (sparse)
- displayName (optional)

---

## 2) Follow model (подписки)

Коллекция: follows
Поля:

- followerId: ObjectId (user)
- followingId: ObjectId (user)
  timestamps: true
  Индексы:
- unique(followerId, followingId)
- followerId
- followingId

---

## 3) XP/Streak model

Коллекция: user_stats
Поля:

- userId: ObjectId unique
- xpTotal: number (default 0)
- xpWeek: number (default 0)
- weekKey: string (e.g. "2026-W02") // текущая неделя, чтобы понимать когда сбрасывать xpWeek
- currentStreak: number (default 0)
- bestStreak: number (default 0)
- lastLoggedDate?: string (YYYY-MM-DD)
- updatedAt

Индексы:

- userId unique

---

## 4) Activity events (упрощенная лента)

Коллекция: activity_events
Поля:

- userId: ObjectId
- type: 'log_day' | 'streak_milestone' | 'xp_gain' | 'follow'
- date: string (YYYY-MM-DD) // для простого отображения
- payload: object (light) // например { xp: 10, streak: 7, targetUserId: ... }
- createdAt
  Индексы:
- userId + createdAt desc

---

## 5) Правила начисления XP (MVP)

Начислять при создании Entry:

- если это первая запись пользователя за дату: +10 XP (type: log_day)
- за каждую запись: +2 XP (type: xp_gain)
  Ограничения:
- max XP per day: 50 (чтобы не накручивали)
  Хранить лимит можно расчетом по events за дату, или проще: хранить dayXpMap в памяти нельзя. Сделай запрос к activity_events за date и type xp_gain/log_day и суммируй — если >=50, не начислять.

Streak update при первой записи дня:

- если lastLoggedDate == date: streak не меняем
- если lastLoggedDate == yesterday(date): currentStreak += 1
- иначе currentStreak = 1
- bestStreak = max(bestStreak, currentStreak)
- lastLoggedDate = date
  Если currentStreak достиг 3/7/14/30 — создать activity_event streak_milestone.

---

## 6) Backend API

### 6.1 Users search

GET /users/search?query=...&limit=20
Возвращает публичных пользователей, исключая текущего.
Поиск по:

- username (без @ тоже)
- displayName
  Response item:
  { id, username?, displayName?, avatarEmoji, isFollowing: boolean }

### 6.2 Follow

POST /friends/follow/:userId
DELETE /friends/follow/:userId
GET /friends/following?limit=50
GET /friends/followers?limit=50
Response для списков: массив { id, username, displayName, avatarEmoji }

При follow/unfollow создавать activity_event type='follow' (payload targetUserId).

### 6.3 Stats (XP/Streak)

GET /social/me
Response:
{
user: { id, username, displayName, avatarEmoji },
stats: { xpTotal, xpWeek, weekKey, currentStreak, bestStreak, lastLoggedDate }
}

### 6.4 Leaderboards

GET /leaderboard/week/global?limit=50
GET /leaderboard/week/friends?limit=50
Response:
{
weekKey,
me?: { rank, xpWeek },
items: [{ rank, user: {id, displayName, username?, avatarEmoji}, xpWeek }]
}

Ранжировать по xpWeek desc. При равенстве — по updatedAt/createdAt.

### 6.5 Feed

GET /feed?limit=50
Возвращает события (activity_events) для пользователей, на которых я подписан (following), за последние 7 дней.
Response:
[{ id, type, date, user: {id, displayName, avatarEmoji}, payload, createdAt }]

---

## 7) Интеграция с существующим Entries

В EntriesService при POST /entries:

- после сохранения Entry вызвать SocialService:
  - ensureUserStats(userId)
  - maybeResetWeek(userStats)
  - updateStreakIfFirstLogOfDay(userId, date)
  - grantXpForEntry(userId, date)
  - create activity events

ВАЖНО: все это должно быть идемпотентно относительно "первый лог дня".
Проверка "первая запись дня":

- query entries for userId+date count BEFORE save, или после save считать: если count == 1 -> first log day.

---

## 8) Frontend (React)

### 8.1 Навигация/экраны

Добавить вкладки или простой верхний переключатель:

- Today (существует)
- League (leaderboard)
- Friends (поиск + following/followers)
- Feed (лента)

Если вкладки уже есть — интегрировать. Если нет — сделать минимум:

- на /today добавить кнопки-ссылки: "Лига", "Друзья", "Лента" (вверху)

### 8.2 Today

Добавить блок геймификации сверху:

- Streak: "Серия: X дней 🔥"
- XP week: "XP за неделю: N"
  Брать с GET /social/me.

### 8.3 League page

- Переключатель: "Друзья / Глобальный"
- Список items rank + avatarEmoji + displayName + xpWeek
- Отдельно подсветить me (если есть)

### 8.4 Friends page

- Поиск пользователей (GET /users/search)
- кнопка Follow/Unfollow
- список following и followers (две вкладки)

### 8.5 Feed page

- События друзей:
  - "🦊 Саша залогировал день (+10 XP)"
  - "🦊 Саша набрал серию 7 дней 🔥"
  - "🦊 Саша подписался на Петю"
  - формировать текст на фронте по type/payload
- limit 50, простая прокрутка

---

## Acceptance Criteria

1. В Mongo появились коллекции: follows, user_stats, activity_events.
2. При создании entry начисляется XP и обновляется streak, видно на /today.
3. Можно найти пользователя поиском и подписаться.
4. Leaderboard week (global и friends) возвращает ранжированный список.
5. Feed показывает события друзей.
6. Все защищено JWT, не протекает чужая приватная инфа (isPublicProfile=false не показывать в search/leaderboard/feed).
