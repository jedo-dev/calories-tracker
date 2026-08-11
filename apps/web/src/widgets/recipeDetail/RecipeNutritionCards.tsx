import { t } from '../../i18n';
import { glassCardStyle } from '../../theme/styles';
import { useTheme } from '../../theme/useTheme';
import { Card } from '../../ui/Card';
import { Text } from '../../ui/Text';
import { MACRO_COLORS } from '../../pages/RecipesPage';
import type { Recipe } from './types';

// КБЖУ на 100 г + сводка (вес/режим/порция) + список ингредиентов.
export function RecipeNutritionCards({ recipe }: { recipe: Recipe }) {
  const theme = useTheme();

  const modeLabel: Record<string, string> = {
    manual: t('recipes.manual'),
    ingredients: t('recipes.fromIngredients'),
    mixed: t('recipes.mixed'),
  };

  return (
    <>
      {/* KBJU per 100g */}
      <Card style={{ ...glassCardStyle, marginBottom: '12px' }}>
        <Text variant="h2" style={{ marginBottom: theme.spacing.sm }}>{t('recipes.per100g')}</Text>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: theme.spacing.sm, textAlign: 'center' }}>
          <div>
            <Text bold style={{ fontSize: '22px', display: 'block', color: theme.palette.primary }}>{recipe.kcalPer100g.toFixed(0)}</Text>
            <Text variant="small" muted>{t('mealPlan.kcal')}</Text>
          </div>
          <div>
            <Text bold style={{ fontSize: '22px', display: 'block' }}>{recipe.proteinPer100g.toFixed(1)}</Text>
            <Text variant="small" style={{ color: MACRO_COLORS.protein }}>{t('mealPlan.protein')}</Text>
          </div>
          <div>
            <Text bold style={{ fontSize: '22px', display: 'block' }}>{recipe.fatPer100g.toFixed(1)}</Text>
            <Text variant="small" style={{ color: MACRO_COLORS.fat }}>{t('mealPlan.fat')}</Text>
          </div>
          <div>
            <Text bold style={{ fontSize: '22px', display: 'block' }}>{recipe.carbPer100g.toFixed(1)}</Text>
            <Text variant="small" style={{ color: MACRO_COLORS.carb }}>{t('mealPlan.carbFull')}</Text>
          </div>
        </div>
      </Card>

      {/* Info */}
      <Card style={{ ...glassCardStyle, marginBottom: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: theme.spacing.sm }}>
          <Text variant="small" muted>{t('recipes.totalWeight')}</Text>
          <Text bold>{recipe.totalCookedWeightG}г</Text>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: theme.spacing.sm }}>
          <Text variant="small" muted>{t('recipeEditor.calculationMode')}</Text>
          <Text bold>{modeLabel[recipe.calculationMode] || recipe.calculationMode}</Text>
        </div>
        {recipe.servingName && recipe.servingGrams && (
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Text variant="small" muted>{recipe.servingName}</Text>
            <Text bold>{recipe.servingGrams}г ({((recipe.kcalPer100g * recipe.servingGrams) / 100).toFixed(0)} ккал)</Text>
          </div>
        )}
      </Card>

      {/* Ingredients */}
      {recipe.ingredients.length > 0 && (
        <Card style={{ ...glassCardStyle, marginBottom: '12px' }}>
          <Text variant="h2" style={{ marginBottom: theme.spacing.sm }}>{t('recipes.ingredients')}</Text>
          {recipe.ingredients.map((ing, index) => (
            <div
              key={index}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: `${theme.spacing.xs} 0`,
                borderBottom: index < recipe.ingredients.length - 1 ? `1px solid ${theme.palette.border}` : 'none',
              }}
            >
              <Text>{ing.productName}</Text>
              <div style={{ textAlign: 'right' }}>
                <Text bold>{ing.grams}г</Text>
                <Text variant="small" muted style={{ display: 'block' }}>
                  {ing.kcal.toFixed(0)} ккал
                </Text>
              </div>
            </div>
          ))}
          <div style={{
            marginTop: theme.spacing.sm,
            padding: theme.spacing.sm,
            backgroundColor: theme.palette.surface,
            borderRadius: theme.radius.md,
          }}>
            <Text variant="small" bold>
              {t('recipes.totalWeight')}: {recipe.ingredients.reduce((s, i) => s + i.grams, 0)}г · {recipe.totalKcal.toFixed(0)} ккал
            </Text>
          </div>
        </Card>
      )}
    </>
  );
}
