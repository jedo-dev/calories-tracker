# Social Recipes Implementation Report

Дата: 2026-06-24

## Что реализовано

### Backend

#### Новые поля RecipeSchema
- `visibility`: `'private' | 'public' | 'friends'` (default: `'private'`)
- `publishedAt`: Date — дата публикации
- `sourceRecipeId`: ObjectId — ссылка на оригинал при fork
- `forkCount`: number — количество копирований
- `likesCount`: number — количество лайков
- `authorSnapshot`: { userId, username, displayName, avatarEmoji } — снимок автора

#### Новые индексы
- `{ visibility: 1, publishedAt: -1 }` — для доски рецептов
- `{ userId: 1, visibility: 1, updatedAt: -1 }` — для профиля

#### Новые endpoints

| Endpoint | Method | Описание |
|----------|--------|----------|
| `/recipes/board` | GET | Публичные рецепты (доска) |
| `/recipes/:id/publish` | POST | Опубликовать рецепт |
| `/recipes/:id/unpublish` | POST | Снять с публикации |
| `/recipes/:id/fork` | POST | Скопировать чужой рецепт себе |
| `/recipes/:id/like` | POST | Лайк/анлайк рецепта |
| `/users/:id/recipes` | GET | Публичные рецепты пользователя |

#### Изменённые endpoints
- `GET /recipes/:id` — теперь возвращает публичные рецепты любому авторизованному пользователю
- `POST /recipes/:id/create-entry` — позволяет добавлять публичные рецепты в дневник

#### Feed events
- Добавлен тип события `recipe_published` в `ActivityEventType`
- При публикации рецепта создаётся событие в ленте

### Frontend

#### RecipesPage
- Две вкладки: **Мои блюда** и **Доска**
- Мои блюда: отображение статуса видимости (Личное/Опубликовано), кнопки публикации/снятия
- Доска: сортировка (Новые/Популярные/Копируемые), кнопки "В дневник" и "Скопировать себе"
- Бейдж "Мой" для своих рецептов на доске

#### RecipeDetailPage
- Для своих рецептов: управление публичностью, кнопки редактирования
- Для чужих публичных рецептов: отображение автора, кнопки "В дневник" и "Скопировать себе"
- 403/404 для чужих приватных рецептов

#### RecipeEditorPage
- Переключатель видимости "Личное / На доске" в форме создания/редактирования

#### PublicProfilePage
- Секция "Рецепты пользователя" с публичными рецептами

#### FeedPage
- Отображение событий публикации рецептов с фото и кнопками "Открыть" / "В дневник"

#### i18n
- Все новые строки добавлены в `apps/web/src/i18n/ru.ts`

## Изменённые файлы

### Backend
- `apps/api/src/recipes/schemas/recipe.schema.ts` — расширена схема
- `apps/api/src/recipes/recipes.service.ts` — новая логика (board, publish, fork, like)
- `apps/api/src/recipes/recipes.controller.ts` — новые endpoints
- `apps/api/src/recipes/recipes.module.ts` — импорт User и ActivityEvent моделей
- `apps/api/src/recipes/dto/query-board.dto.ts` — новый DTO
- `apps/api/src/recipes/dto/query-user-recipes.dto.ts` — новый DTO
- `apps/api/src/users/users.controller.ts` — endpoint пользовательских рецептов
- `apps/api/src/users/users.module.ts` — импорт RecipesModule
- `apps/api/src/social/schemas/activity-event.schema.ts` — тип recipe_published

### Frontend
- `apps/web/src/pages/RecipesPage.tsx` — переписан с вкладками
- `apps/web/src/pages/RecipeDetailPage.tsx` — социальные функции
- `apps/web/src/pages/RecipeEditorPage.tsx` — переключатель видимости
- `apps/web/src/pages/PublicProfilePage.tsx` — секция рецептов
- `apps/web/src/pages/FeedPage.tsx` — события рецептов
- `apps/web/src/i18n/ru.ts` — переводы

## Правила доступа

| Действие | Свой private | Свой public | Чужой public | Чужой private |
|----------|-------------|-------------|--------------|---------------|
| Просмотр | ✅ | ✅ | ✅ | ❌ 403 |
| Редактирование | ✅ | ✅ | ❌ | ❌ |
| Публикация | ✅ | — | — | — |
| Fork | — | ✅ | ✅ | ❌ |
| В дневник | ✅ | ✅ | ✅ | ❌ |
| Лайк | — | ✅ | ✅ | ❌ |
| Архив | ✅ | ✅ | ❌ | ❌ |

## Совместимость

- Существующие рецепты остаются `private` по умолчанию
- Существующие API endpoints работают без изменений
- Новые поля имеют дефолтные значения, миграция не требуется

## Ограничения

- `friends` visibility добавлена в схему, но не реализована в UI (TODO)
- Лайки реализованы через ActivityEvent, а не отдельную коллекцию (для простоты)
- Нет ограничения на количество лайков от одного пользователя (упрощение)
- Нет уведомлений при лайке/fork

## Сборки

- `npm run build` в `apps/api` ✅
- `npm run build` в `apps/web` ✅
