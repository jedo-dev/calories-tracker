# Meal Planner Implementation Report

**Date:** 2026-06-24

## What was implemented

### Backend - New Module `meal-plan`

#### Schema (`MealPlan`)
- `userId` - owner reference
- `dateFrom`, `dateTo` - date range (YYYY-MM-DD strings)
- `mode` - `'day' | 'week'`
- `status` - `'draft' | 'applied' | 'archived'`
- `title` - plan title
- `settings` - embedded subdocument with:
  - `kcalTarget`, `proteinTargetG`, `fatTargetG`, `carbTargetG`
  - `mealCount` (3/4/5)
  - `includePublicRecipes`, `preferQuick`, `considerEaten`
  - `excludedTags`, `excludedProductNames`
  - `goal`
- `days[]` - array of plan days, each containing:
  - `date`
  - `meals[]` - array of meals, each containing:
    - `mealType`, `title`
    - `items[]` - food items with `sourceType`, `sourceId`, `name`, `grams`, `kcal`, `protein`, `fat`, `carb`, `photoUrl`, `authorName`
    - Meal totals
  - Day totals
- `score` - plan quality score (0-100)
- `explanation[]` - human-readable explanations

#### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/meal-plans/generate` | Generate a new meal plan |
| GET | `/meal-plans` | List user's meal plans |
| GET | `/meal-plans/:id` | Get plan details |
| POST | `/meal-plans/:id/apply` | Apply plan to diary (creates entries) |
| POST | `/meal-plans/:id/archive` | Archive a plan |
| POST | `/meal-plans/:id/replace-item` | Replace an item with alternative |
| POST | `/meal-plans/:id/save-template` | Save plan day as template |

#### Planner Algorithm (Rule-based)

1. **Collect candidates**: User's own recipes + public recipes (if enabled) + products as fallback
2. **Filter**: Exclude absurd nutrition (macros > 100g/100g), excluded tags/products
3. **Split by meals**: 3 meals (25/40/35%), 4 meals (25/35/25/15%), 5 meals (20/10/35/10/25%)
4. **Score candidates**: Based on mealType match, own recipe bonus, photo, nutrition fit, diversity
5. **Select items**: Pick from top-scored candidates with portion adjustment (50-600g range)
6. **Calculate score**: Based on closeness to calorie target
7. **Generate explanations**: Human-readable reasons for plan choices

#### Edge cases handled
- No profile → returns error asking to fill profile
- No candidates → returns error
- Already applied plan → blocks re-apply
- Consider eaten mode → subtracts already consumed calories/protein

### Frontend

#### New Page: `/meal-plan` (MealPlanPage)
- **Settings panel**: Mode (day/week), meal count (3/4/5), toggles for public recipes/consider eaten/quick meals, excluded tags
- **Plan view**: Day selector for week mode, meal cards with items, nutrition totals with progress bar
- **Actions**: Apply to diary, save as template, regenerate, archive
- **Replace**: Each item has a 🔄 button to swap with alternative
- **History**: View past plans with status badges
- **Empty state**: Profile required prompt with navigation to profile

#### TodayPage Integration
- Added CTA card after calorie balance section
- Shows "Составить план на сегодня" when no entries
- Shows "Добрать остаток N ккал" when entries exist
- Links to `/meal-plan?considerEaten=true/false`

#### Drawer Integration
- Added "🧠 План питания" menu item

#### i18n
- All new strings added to `apps/web/src/i18n/ru.ts` under `mealPlan` namespace

## Files changed

### Backend (new files)
- `apps/api/src/meal-plan/meal-plan.module.ts`
- `apps/api/src/meal-plan/meal-plan.controller.ts`
- `apps/api/src/meal-plan/meal-plan.service.ts`
- `apps/api/src/meal-plan/schemas/meal-plan.schema.ts`
- `apps/api/src/meal-plan/dto/generate-meal-plan.dto.ts`
- `apps/api/src/meal-plan/dto/replace-item.dto.ts`

### Backend (modified)
- `apps/api/src/app.module.ts` - added MealPlanModule import

### Frontend (new files)
- `apps/web/src/pages/MealPlanPage.tsx`

### Frontend (modified)
- `apps/web/src/App.tsx` - added route `/meal-plan`
- `apps/web/src/widget/Drawer.tsx` - added menu item
- `apps/web/src/pages/TodayPage.tsx` - added CTA card
- `apps/web/src/i18n/ru.ts` - added mealPlan translations

## Build verification

- `apps/api` TypeScript check: ✅
- `apps/web` TypeScript check: ✅

## Limitations

1. **No AI integration** - planner is deterministic rule-based, not ML-powered
2. **Single item per meal** - each meal slot gets one main item (can be extended)
3. **No calorie/macro targets override** per plan (uses profile targets)
4. **No shopping list generation** from plan
5. **No plan sharing** between users
6. **Simplified scoring** - doesn't consider ingredient availability or cooking time
7. **No meal prep suggestions** or batch cooking optimization
8. **Random selection** from top candidates - not fully deterministic (same settings may produce different plans)

## How to run

1. Start API: `cd apps/api && npm run start:dev`
2. Start Web: `cd apps/web && npm run dev`
3. Login and navigate to `/meal-plan` or use "🧠 План питания" in drawer
4. Configure settings and click "Составить план"
5. Review generated plan, replace items if needed
6. Apply to diary or save as template
