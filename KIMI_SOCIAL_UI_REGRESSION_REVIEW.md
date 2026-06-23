# Regression review after Kimi social/profile UI changes

Дата проверки: 2026-06-23  
Проверено вручную в браузере на desktop и mobile 390px.

## Что проверено

- [x] Frontend build: `apps/web`, `npm run build` проходит.
- [x] Backend build: `apps/api`, `npm run build` проходит.
- [x] Основные экраны открываются без runtime crash: `/today`, `/friends`, `/feed`, `/league`, `/profile`, `/workouts`, `/products`, `/templates`, `/measurements`, `/reports`.
- [x] Mobile 390px: горизонтального overflow не найдено.
- [x] `/workouts`: категория "Руки" теперь использует `cat_arms.jpg`, баг с картинкой груди исправлен.
- [x] `/today`: nutrition images встроены мелкими decorative images, верстку не ломают.
- [x] `/profile`: появились mascot, goal/activity images и achievements block.
- [x] `/feed`: появился EmptyState с mascot.
- [x] `/products` и `/reports`: появились illustrated empty states.
- [x] `/league`: появились быстрые действия и кликабельные карточки leaderboard.
- [x] Console: критичных runtime errors не найдено, только React Router future warnings.

## Нужно исправить

### 1. Public profile игнорирует приватность пользователя

**Приоритет:** P0 / privacy  
**Файл:** `apps/api/src/users/users.service.ts`

Метод `getPublicProfile(userId, currentUserId)` возвращает данные профиля даже если `user.isPublicProfile === false`. Сейчас поле просто пробрасывается в ответ:

```ts
isPublicProfile: user.isPublicProfile !== false
```

Но запрета на просмотр нет.

Что сделать:

- [ ] Если `user.isPublicProfile === false` и `userId !== currentUserId`, возвращать `NotFoundException` или `ForbiddenException`.
- [ ] Не отдавать recent events приватного пользователя.
- [ ] На frontend показать нормальный empty/error state: "Профиль недоступен".
- [ ] Проверить, что свой профиль все еще открывается.

### 2. PublicProfilePage показывает достижения текущего пользователя, а не открытого профиля

**Приоритет:** P1 / logic bug  
**Файл:** `apps/web/src/pages/PublicProfilePage.tsx`  
**Связанный backend:** `apps/api/src/social/achievements.controller.ts`

Страница `/users/:userId` делает:

```ts
apiClient.get(`/achievements`)
```

Этот endpoint возвращает достижения текущего авторизованного пользователя, а не пользователя из URL. В результате на чужом публичном профиле могут отображаться мои достижения.

Что сделать:

- [ ] Добавить endpoint `GET /achievements/:userId/public` или включить public achievements в `GET /users/:id/public`.
- [ ] На backend учитывать приватность профиля.
- [ ] В `PublicProfilePage` грузить достижения именно `userId` из route.
- [ ] Проверить чужой профиль и свой профиль отдельно.

### 3. Feed reactions могут не работать из-за отсутствующего `@Body()`

**Приоритет:** P1 / functional bug  
**Файл:** `apps/api/src/social/social.controller.ts`

В `FeedController.reactToEvent` код читает:

```ts
const { emoji } = req.body;
```

Но controller импортирует только:

```ts
import { Controller, Get, Post, Param, UseGuards, Request } from '@nestjs/common';
```

`@Body()` не используется. В NestJS надежнее явно принимать body:

```ts
async reactToEvent(@Param('eventId') eventId: string, @Body() body: { emoji: string }, @Request() req: any)
```

Что сделать:

- [ ] Добавить `Body` import из `@nestjs/common`.
- [ ] Читать `emoji` из `body`.
- [ ] Проверить кнопку реакции в `/feed`.
- [ ] Ошибку реакции показывать пользователю toast/error text, а не только `console.error`.

### 4. `/friends` в search-tab выглядит пустым без подсказки

**Приоритет:** P2 / UX  
**Файл:** `apps/web/src/pages/FriendsPage.tsx`

На `/friends` при открытии вкладки "Поиск" видны только заголовок, табы и поле "Поиск пользователей". Нет пояснения, что нужно ввести минимум 2 символа, нет illustrated empty state.

Что сделать:

- [ ] Для пустого search state добавить `EmptyState` с `emptyFriends`.
- [ ] Текст: "Введите имя или username, чтобы найти людей".
- [ ] Показывать это только когда `searchQuery.length === 0`.
- [ ] Для `1` символа показать подсказку "Введите минимум 2 символа".

### 5. EmptyState склеивает title и description в accessible text

**Приоритет:** P2 / UI polish  
**Файл:** `apps/web/src/ui/EmptyState.tsx`

В DOM на `/feed` текст читается как:

```text
Нет событийПодпишитесь на друзей, чтобы видеть их активность
```

Визуально это может быть нормально, но для accessibility/DOM text лучше разделить title и description блочными элементами.

Что сделать:

- [ ] Убедиться, что `Text` в `EmptyState` рендерится как block или добавить `display: 'block'`.
- [ ] Добавить нормальный margin между title и description.
- [ ] Проверить `/feed`, `/products`, `/reports`, `/friends`.

### 6. В `Today` nutrition images используют тяжелые 1024px JPG для 24-32px UI

**Приоритет:** P2 / performance  
**Файл:** `apps/web/src/pages/TodayPage.tsx`

Функционально работает, но картинки 1024px весом 370-680 KB используются как маленькие 24-32px decoration. Пользователь просил не удалять лишние изображения, поэтому удалять ассеты не надо.

Что сделать:

- [ ] Не удалять исходные изображения.
- [ ] Сделать lightweight variants для UI: WebP/AVIF или уменьшенные 64/128px версии.
- [ ] Использовать маленькие версии в `/today`.
- [ ] Исходники оставить в проекте.

### 7. Build все еще эмитит много тяжелых JPG

**Приоритет:** P2 / performance  
**Файлы:** страницы с прямыми импортами ассетов

Barrel-import частично исправлен, но production build все еще включает много больших JPG:

- `nut_calories` ~682 KB
- `rank_gold` ~606 KB
- badges ~440-520 KB каждый
- goal/activity images ~330-500 KB

Это ожидаемо, если эти картинки реально используются, но для UI-размеров 20-120px лучше иметь optimized variants.

Что сделать:

- [ ] Не удалять пользовательские изображения.
- [ ] Добавить оптимизированные копии для UI.
- [ ] Большие originals оставить для будущих экранов/маркетинга/детальных страниц.
- [ ] Проверить `dist/assets` после оптимизации.

### 8. Achievements definitions в backend выглядят поврежденными в исходниках

**Приоритет:** P3 / maintainability  
**Файл:** `apps/api/src/social/achievements.service.ts`

В исходнике строки выглядят mojibake-символами, например названия достижений. В браузере часть текста может приходить через i18n, но backend payload будет трудно поддерживать.

Что сделать:

- [ ] Проверить encoding файла как UTF-8.
- [ ] Перезаписать `ACHIEVEMENT_DEFS` нормальным русским текстом.
- [ ] Лучше хранить `key` на backend, а display text держать во frontend i18n.

## Что выглядит хорошо

- `/workouts` исправлен: "Руки" теперь с правильной картинкой.
- `/today` не перегружен, картинки маленькие.
- `/league` стал заметно полезнее: прогресс, быстрые действия, XP tips.
- `/profile` стал живее за счет mascot/goal/activity/achievements.
- `/feed` получил нормальное пустое состояние.
- Mobile 390px без горизонтального scroll.
- Frontend/backend builds проходят.

## Контроль после следующего фикса

- [ ] `apps/web`: `npm run build`.
- [ ] `apps/api`: `npm run build`.
- [ ] Открыть `/friends`: search empty state должен быть понятным.
- [ ] Открыть `/feed` с событиями и нажать reaction.
- [ ] Открыть чужой `/users/:userId`: достижения должны быть именно этого пользователя.
- [ ] Проверить приватный профиль: чужой пользователь не должен видеть данные.
- [ ] Проверить `/today` и `/profile` после оптимизации картинок.
- [ ] Mobile 390px: нет overflow и наездов текста на изображения.
